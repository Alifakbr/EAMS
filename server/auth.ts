import crypto from 'crypto';
import fs from 'fs';
import path from 'path';
import { promisify } from 'util';
import type { Request, Response, NextFunction } from 'express';
import { db } from './db.ts';
import type { User } from '../src/types/index.ts';
import {
  type ModuleId,
  getEffectiveModules,
  hasActionPermission,
} from '../src/shared/access.ts';
import type { UserPermissionMatrix, UserRole } from '../src/types/index.ts';

const scrypt = promisify(crypto.scrypt) as (pw: string, salt: Buffer, keylen: number) => Promise<Buffer>;

// ------------------------------------------------------------------
// Configuration
// ------------------------------------------------------------------
export const IS_PROD = process.env.NODE_ENV === 'production';
/** Demo mode: shows sample accounts on the login page. Enabled by default in development and disabled in production. */
export const DEMO_MODE = process.env.DEMO_MODE ? process.env.DEMO_MODE === 'true' : !IS_PROD;
const DEMO_PASSWORD = 'Demo@2026';
const TOKEN_TTL_MS = (parseInt(process.env.SESSION_HOURS || '12', 10) || 12) * 60 * 60 * 1000;
const MAX_FAILED = 5;
const LOCK_MS = 15 * 60 * 1000;

const DATA_DIR = path.resolve(process.cwd(), 'data');

// ------------------------------------------------------------------
// Password hashing (scrypt + salt acak; perbandingan constant-time)
// ------------------------------------------------------------------
export async function hashPassword(password: string): Promise<string> {
  const salt = crypto.randomBytes(16);
  const dk = await scrypt(password, salt, 64);
  return `scrypt$${salt.toString('hex')}$${dk.toString('hex')}`;
}

export async function verifyPassword(password: string, stored?: string): Promise<boolean> {
  // Selalu lakukan satu hash agar waktu respons sama untuk akun yang tidak ada.
  const parts = (stored || '').split('$');
  if (parts.length !== 3 || parts[0] !== 'scrypt') {
    await scrypt(password, crypto.randomBytes(16), 64);
    return false;
  }
  const salt = Buffer.from(parts[1], 'hex');
  const expected = Buffer.from(parts[2], 'hex');
  const actual = await scrypt(password, salt, 64);
  return expected.length === actual.length && crypto.timingSafeEqual(expected, actual);
}

export function generatePassword(): string {
  const alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789';
  let out = '';
  const bytes = crypto.randomBytes(12);
  for (let i = 0; i < 12; i++) out += alphabet[bytes[i] % alphabet.length];
  return `${out}#7`; // dijamin lolos kebijakan (huruf + angka)
}

/** Set an initial password for accounts that do not have one (e.g. seed data / legacy database). */
export function ensureUserCredentials(): void {
  let changed = false;
  const generated: { email: string; password: string }[] = [];
  for (const u of db.getUsers()) {
    if (u.passwordHash) continue;
    let pw = process.env.SEED_PASSWORD || '';
    if (!pw) {
      if (DEMO_MODE) pw = DEMO_PASSWORD;
      else { pw = generatePassword(); generated.push({ email: u.email, password: pw }); }
    }
    const salt = crypto.randomBytes(16);
    u.passwordHash = `scrypt$${salt.toString('hex')}$${crypto.scryptSync(pw, salt, 64).toString('hex')}`;
    u.tokenVersion = u.tokenVersion || 1;
    u.mustChangePassword = !DEMO_MODE;
    changed = true;
  }
  if (changed) db.save();
  if (generated.length) {
    console.warn('\n[Auth] Production mode: initial passwords were generated randomly (shown ONCE). Share them securely and require a change at login:');
    generated.forEach((g) => console.warn(`  ${g.email}  =>  ${g.password}`));
    console.warn('[Auth] Or set SEED_PASSWORD before the first startup.\n');
  }
  if (DEMO_MODE) {
    console.warn(`[Auth] DEMO_MODE is enabled — sample accounts use password "${process.env.SEED_PASSWORD || DEMO_PASSWORD}". DO NOT use in production.`);
  }
}

export function publicUser(u: User): Omit<User, 'passwordHash' | 'tokenVersion'> {
  const { passwordHash: _h, tokenVersion: _t, ...rest } = u;
  return rest;
}

// ------------------------------------------------------------------
// HMAC-signed session token (no additional dependencies)
// ------------------------------------------------------------------
function loadSecret(): Buffer {
  if (process.env.SESSION_SECRET && process.env.SESSION_SECRET.length >= 16) {
    return Buffer.from(process.env.SESSION_SECRET);
  }
  try {
    const file = path.join(DATA_DIR, '.session_secret');
    if (fs.existsSync(file)) return Buffer.from(fs.readFileSync(file, 'utf-8').trim(), 'hex');
    fs.mkdirSync(DATA_DIR, { recursive: true });
    const secret = crypto.randomBytes(48);
    fs.writeFileSync(file, secret.toString('hex'), { mode: 0o600 });
    return secret;
  } catch {
    console.warn('[Auth] Unable to persist the session secret; sessions will expire when the server restarts. Set SESSION_SECRET.');
    return crypto.randomBytes(48);
  }
}
const SECRET = loadSecret();

const b64 = (buf: Buffer | string) => Buffer.from(buf).toString('base64url');

export function signToken(user: User): string {
  const payload = { uid: user.id, v: user.tokenVersion || 1, exp: Date.now() + TOKEN_TTL_MS };
  const body = b64(JSON.stringify(payload));
  const sig = b64(crypto.createHmac('sha256', SECRET).update(body).digest());
  return `${body}.${sig}`;
}

function verifyToken(token: string): { uid: string; v: number; exp: number } | null {
  const [body, sig] = token.split('.');
  if (!body || !sig) return null;
  const expected = crypto.createHmac('sha256', SECRET).update(body).digest();
  const given = Buffer.from(sig, 'base64url');
  if (given.length !== expected.length || !crypto.timingSafeEqual(given, expected)) return null;
  try {
    const payload = JSON.parse(Buffer.from(body, 'base64url').toString('utf-8'));
    if (typeof payload.exp !== 'number' || payload.exp < Date.now()) return null;
    return payload;
  } catch {
    return null;
  }
}

// ------------------------------------------------------------------
// Pembatasan percobaan login (anti brute-force)
// ------------------------------------------------------------------
const attempts = new Map<string, { count: number; lockedUntil: number }>();
const attemptKey = (req: Request, email: string) => `${req.ip}|${email}`;

export function loginLockRemainingMs(req: Request, email: string): number {
  const a = attempts.get(attemptKey(req, email));
  return a && a.lockedUntil > Date.now() ? a.lockedUntil - Date.now() : 0;
}
export function recordLoginFailure(req: Request, email: string): void {
  const k = attemptKey(req, email);
  const a = attempts.get(k) || { count: 0, lockedUntil: 0 };
  a.count += 1;
  if (a.count >= MAX_FAILED) { a.lockedUntil = Date.now() + LOCK_MS; a.count = 0; }
  attempts.set(k, a);
}
export function recordLoginSuccess(req: Request, email: string): void {
  attempts.delete(attemptKey(req, email));
}

// ------------------------------------------------------------------
// Endpoint ACL — DENY BY DEFAULT. Routes not listed here are denied.
// ------------------------------------------------------------------
type Rule = {
  methods: string[];
  path: RegExp;
  /** true = login required. Array = user must have one of these modules. */
  access: 'PUBLIC' | 'AUTH' | ModuleId[];
  /** Roles also allowed without the module (e.g. documents in Reports). */
  roles?: UserRole[];
  /** Izin tindakan tambahan (di luar modul). */
  action?: keyof UserPermissionMatrix;
};

const GET = ['GET'];
const WRITE = ['POST', 'PUT', 'PATCH', 'DELETE'];
const ALLM = ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'];

const CUSTOMER_READ: ModuleId[] = ['customers', 'quotations', 'sales', 'rentals', 'deliveries', 'invoices', 'payments', 'maintenance', 'dashboard'];
const PRODUCT_READ: ModuleId[] = ['products', 'quotations', 'sales', 'rentals', 'procurement', 'assets', 'maintenance', 'technical-service', 'reports', 'dashboard'];
const ASSET_READ: ModuleId[] = ['assets', 'quotations', 'sales', 'rentals', 'deliveries', 'maintenance', 'technical-service', 'operator-status', 'reports', 'dashboard'];
const WO_READ: ModuleId[] = ['maintenance', 'technical-service', 'assets', 'operator-status', 'reports', 'dashboard'];
const OPERATOR_READ: ModuleId[] = ['maintenance', 'assets', 'operator-status', 'technical-service', 'rentals', 'deliveries', 'reports', 'dashboard'];

export const ACL: Rule[] = [
  // Publik & sesi
  { methods: ['POST'], path: /^\/auth\/login$/, access: 'PUBLIC' },
  { methods: GET, path: /^\/auth\/me$/, access: 'AUTH' },
  { methods: ['POST'], path: /^\/auth\/logout$/, access: 'AUTH' },
  { methods: ['POST'], path: /^\/auth\/change-password$/, access: 'AUTH' },
  { methods: ALLM, path: /^\/notifications(\/.*)?$/, access: 'AUTH' },
  { methods: GET, path: /^\/settings$/, access: 'AUTH' },
  { methods: ['GET', 'PUT', 'DELETE'], path: /^\/drafts\/[^/]+$/, access: 'AUTH' },
  { methods: GET, path: /^\/manager\/approvals$/, access: ['manager-approvals'] },
  {
    methods: ['POST'],
    path: /^\/manager\/approvals\/(quotation|sales|rental|invoice|procurement|delivery|maintenance)\/[^/]+\/(approve|reject)$/,
    access: ['manager-approvals'],
  },

  // Administrasi IT
  { methods: ALLM, path: /^\/auth\/users(\/.*)?$/, access: ['user-management'] },
  { methods: GET, path: /^\/system\/run-tests$/, access: ['test-runner'] },
  { methods: ALLM, path: /^\/system\/(backup|restore|reset-demo)$/, access: ['settings'] },
  { methods: GET, path: /^\/openapi\.json$/, access: ['api-explorer'] },
  { methods: GET, path: /^\/audit-logs$/, access: ['dashboard', 'settings', 'user-management'] },
  { methods: ['PATCH'], path: /^\/settings$/, access: ['settings'] },

  // Customers
  { methods: GET, path: /^\/customers\/[^/]+\/statement$/, access: ['customers', 'invoices', 'payments'] },
  { methods: GET, path: /^\/customers(\/[^/]+)?$/, access: CUSTOMER_READ, roles: ['MANAGER'] },
  { methods: WRITE, path: /^\/customers(\/[^/]+)?$/, access: ['customers'] },

  // Products
  { methods: GET, path: /^\/products(\/[^/]+)?$/, access: PRODUCT_READ, roles: ['MANAGER'] },
  { methods: WRITE, path: /^\/products(\/[^/]+)?$/, access: ['products', 'procurement'] },

  // Assets
  { methods: GET, path: /^\/assets\/barcode\/[^/]+$/, access: ['assets', 'maintenance', 'operator-status', 'technical-service'] },
  { methods: GET, path: /^\/assets\/status-logs$/, access: ['assets', 'maintenance', 'operator-status', 'technical-service', 'reports', 'dashboard'] },
  { methods: ['POST'], path: /^\/assets\/status-logs$/, access: ['assets', 'maintenance', 'operator-status', 'technical-service'] },
  { methods: GET, path: /^\/assets\/[^/]+\/history$/, access: ['assets', 'maintenance', 'technical-service'] },
  { methods: ['POST'], path: /^\/assets\/[^/]+\/documents$/, access: ['assets'], action: 'canUploadLegalDocs' },
  { methods: GET, path: /^\/assets$/, access: ASSET_READ, roles: ['MANAGER'] },
  { methods: WRITE, path: /^\/assets(\/[^/]+)?$/, access: ['assets'] },

  // Quotations & Sales
  { methods: ['POST'], path: /^\/quotations\/[^/]+\/convert-to-order$/, access: ['quotations', 'sales'] },
  { methods: GET, path: /^\/quotations$/, access: ['quotations', 'sales', 'dashboard'], roles: ['MANAGER'] },
  { methods: WRITE, path: /^\/quotations(\/.*)?$/, access: ['quotations'] },
  { methods: GET, path: /^\/sales-orders$/, access: ['sales', 'quotations', 'deliveries', 'invoices', 'dashboard'], roles: ['MANAGER'] },
  { methods: WRITE, path: /^\/sales-orders(\/.*)?$/, access: ['sales'] },

  // Rentals & Deliveries
  { methods: GET, path: /^\/rentals$/, access: ['rentals', 'invoices', 'deliveries', 'maintenance', 'dashboard'], roles: ['SALES_MARKETING', 'AR_MANAGEMENT', 'ASSET_CONTROL', 'MANAGER'] },
  { methods: WRITE, path: /^\/rentals(\/.*)?$/, access: ['rentals'] },
  { methods: GET, path: /^\/deliveries$/, access: ['deliveries', 'sales', 'rentals', 'dashboard'], roles: ['MANAGER'] },
  { methods: WRITE, path: /^\/deliveries(\/.*)?$/, access: ['deliveries'] },

  // Finance
  { methods: GET, path: /^\/invoices(\/[^/]+)?$/, access: ['invoices', 'payments', 'dashboard'], roles: ['MANAGER'] },
  { methods: WRITE, path: /^\/invoices(\/.*)?$/, access: ['invoices'] },
  { methods: GET, path: /^\/payments$/, access: ['payments', 'invoices', 'dashboard'] },
  { methods: WRITE, path: /^\/payments(\/.*)?$/, access: ['payments'] },

  // Procurement
  { methods: ['POST'], path: /^\/procurement\/vendor-bills\/[^/]+\/pay$/, access: ['payments'] },
  { methods: GET, path: /^\/procurement\/(vendors|purchase-orders|vendor-bills)$/, access: ['procurement', 'payments', 'dashboard'], roles: ['MANAGER'] },
  { methods: WRITE, path: /^\/procurement\/.*$/, access: ['procurement'] },

  // Operator lapangan, absensi, servis
  { methods: GET, path: /^\/operators(\/attendance)?$/, access: OPERATOR_READ },
  { methods: ['POST'], path: /^\/operators\/attendance\/(check-in|check-out|report-breakdown)$/, access: ['operator-status'] },
  { methods: ['PATCH'], path: /^\/operators\/attendance\/[^/]+$/, access: ['operator-status', 'maintenance'] },
  { methods: WRITE, path: /^\/operators(\/.*)?$/, access: ['maintenance'] },
  { methods: GET, path: /^\/technical-service\/dashboard$/, access: ['technical-service', 'maintenance'] },
  { methods: WRITE, path: /^\/technical-service\/.*$/, access: ['technical-service'] },
  { methods: GET, path: /^\/maintenance\/work-orders$/, access: WO_READ, roles: ['MANAGER'] },
  { methods: WRITE, path: /^\/maintenance\/work-orders(\/.*)?$/, access: ['maintenance', 'technical-service'] },

  // Laporan
  { methods: GET, path: /^\/reports\/[^/]+$/, access: ['reports', 'dashboard'] },
];

export function findRule(method: string, p: string): Rule | undefined {
  return ACL.find((r) => r.methods.includes(method) && r.path.test(p));
}

// ------------------------------------------------------------------
// Middleware
// ------------------------------------------------------------------
export type AuthedRequest = Request & { user: User };
export const actorName = (req: Request): string => (req as AuthedRequest).user?.name || 'System';
export const actorUser = (req: Request): User | undefined => (req as AuthedRequest).user;

const PWD_CHANGE_ALLOWED = /^\/auth\/(me|logout|change-password)$/;

export function authenticateAndAuthorize(req: Request, res: Response, next: NextFunction) {
  const rule = findRule(req.method, req.path);
  if (rule?.access === 'PUBLIC') return next();

  const header = req.headers.authorization || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : '';
  const payload = token ? verifyToken(token) : null;
  const user = payload ? db.getUsers().find((u) => u.id === payload.uid) : undefined;

  if (!payload || !user || user.status !== 'ACTIVE' || (user.tokenVersion || 1) !== payload.v) {
    return res.status(401).json({ error: 'Your session is invalid or has expired. Please log in again.', code: 'UNAUTHENTICATED' });
  }
  (req as AuthedRequest).user = user;

  if (user.mustChangePassword && !PWD_CHANGE_ALLOWED.test(req.path)) {
    return res.status(403).json({ error: 'You must change your password before continuing.', code: 'PASSWORD_CHANGE_REQUIRED' });
  }

  const managerApprovalAction =
    req.method === 'POST' &&
    /^\/manager\/approvals\/(quotation|sales|rental|invoice|procurement|delivery|maintenance)\/[^/]+\/(approve|reject)$/.test(req.path);
  const managerSessionAction =
    req.method === 'POST' && /^\/auth\/(logout|change-password)$/.test(req.path);
  const managerReadPath =
    req.method === 'GET' &&
    (/^\/manager\/approvals$/.test(req.path) ||
      /^\/(customers|products|assets|quotations|sales-orders|rentals|deliveries)$/.test(req.path) ||
      /^\/invoices(\/[^/]+)?$/.test(req.path) ||
      /^\/procurement\/(vendors|purchase-orders|vendor-bills)$/.test(req.path) ||
      /^\/maintenance\/work-orders$/.test(req.path) ||
      /^\/notifications$/.test(req.path));
  const managerNotificationAction =
    (req.method === 'PUT' && /^\/notifications\/[^/]+\/read$/.test(req.path)) ||
    (req.method === 'POST' && req.path === '/notifications/mark-all-read');
  if (
    user.role === 'MANAGER' &&
    !managerApprovalAction &&
    !managerSessionAction &&
    !managerReadPath &&
    !managerNotificationAction
  ) {
    db.logAudit(user.name, 'ACCESS_DENIED', 'API', req.path, 'Manager access is restricted to approval operations.');
    return res.status(403).json({ error: 'Managers may only view data and process approvals.', code: 'FORBIDDEN' });
  }

  if (!rule) {
    // Deny-by-default: endpoint baru harus didaftarkan di ACL secara eksplisit.
    return res.status(403).json({ error: 'This endpoint is not registered in the access policy.', code: 'FORBIDDEN' });
  }
  if (rule.access === 'AUTH') return next();

  const modules = getEffectiveModules(user);
  const allowed = rule.access.some((m) => modules.includes(m)) || !!rule.roles?.includes(user.role);
  if (!allowed || (rule.action && !hasActionPermission(user, rule.action))) {
    db.logAudit(user.name, 'ACCESS_DENIED', 'API', req.path, `${req.method} ${req.path} denied for role ${user.role}`);
    return res.status(403).json({
      error: `Access denied: your account (${user.role}) is not authorized to perform this operation.`,
      code: 'FORBIDDEN',
    });
  }
  next();
}

/** Header keamanan dasar (tanpa dependensi). Kamera diizinkan untuk origin sendiri (scanner). */
export function securityHeaders(_req: Request, res: Response, next: NextFunction) {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  res.setHeader('Permissions-Policy', 'camera=(self), geolocation=(self), microphone=()');
  res.setHeader('Cross-Origin-Opener-Policy', 'same-origin');
  if (IS_PROD) res.setHeader('Strict-Transport-Security', 'max-age=15552000; includeSubDomains');
  next();
}
