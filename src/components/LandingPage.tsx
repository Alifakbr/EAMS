import React from 'react';
import {
  Building2, ArrowRight, QrCode, FileText, Wrench, Banknote, BarChart3, ShieldCheck, Boxes,
  ClipboardCheck, Smartphone, LineChart, Users, History, Check, Menu, X,
} from 'lucide-react';
import { ROLE_MODULES } from '../shared/access.ts';
import type { UserRole } from '../types/index.ts';

interface LandingPageProps {
  onLogin: () => void;
}

const FEATURES = [
  { icon: Boxes, title: 'Asset Registry & Compliance', desc: 'Keep equipment records, serial numbers, and registration and operating license expirations organized with reminders.' },
  { icon: QrCode, title: 'QR Scanning in the Field', desc: 'Operators can scan equipment QR codes on their phones to record attendance and report issues in seconds.' },
  { icon: FileText, title: 'Quotations, Orders & Rentals', desc: 'Connect quotations, sales orders, rental contracts, and delivery notes without re-entering data.' },
  { icon: Banknote, title: 'Invoicing & Receivables', desc: 'Issue invoices, record payments, and monitor receivables aging so collections stay on track.' },
  { icon: Wrench, title: 'Maintenance & Service', desc: 'Manage workshop work orders, replacement parts, and equipment status updates in one workflow.' },
  { icon: BarChart3, title: 'Print-Ready Reports', desc: 'Export executive, fleet utilization, and asset profitability reports to Excel or PDF.' },
];

const STEPS = [
  { icon: ClipboardCheck, title: 'Register your assets', desc: 'Enter equipment once, along with compliance documents and project locations.' },
  { icon: Smartphone, title: 'Work from the field', desc: 'Operators and technicians scan QR codes to record attendance, report status, and start or complete service.' },
  { icon: LineChart, title: 'Monitor and invoice', desc: 'Managers see utilization and receivables in real time, while finance issues invoices from the same data.' },
];

const SECURITY = [
  'Encrypted password login with attempt limits',
  'Role-based access to menus and data, enforced by the server',
  'All important activity is recorded in the audit log',
  'One-click backups by the IT Administrator',
];

const LANDING_ROLE_LABELS: Record<UserRole, string> = {
  EXECUTIVE: 'Executive (Chief Executive Officer)',
  ADMIN_IT: 'IT Administrator',
  SALES_MARKETING: 'Sales & Marketing',
  ASSET_CONTROL: 'Asset Control',
  MANAGEMENT_OPERATION: 'Operations Management',
  PROCUREMENT: 'Procurement',
  FINANCE_ACCOUNTING_TAX: 'Finance, Accounting & Tax',
  AR_MANAGEMENT: 'Accounts Receivable Management',
  OPERATOR_USER: 'Field Operator',
  TECHNICAL_SERVICE: 'Technical Service',
  MANAGER: 'Manager',
};

const goto = (id: string) => (e: React.MouseEvent) => {
  e.preventDefault();
  document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
};

export const LandingPage: React.FC<LandingPageProps> = ({ onLogin }) => {
  const [open, setOpen] = React.useState(false);
  const roles = Object.keys(ROLE_MODULES) as UserRole[];

  const links = [
    ['fitur', 'Features'], ['cara-kerja', 'How It Works'], ['peran', 'Who It’s For'], ['keamanan', 'Security'],
  ] as const;

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 selection:bg-amber-400 selection:text-slate-900 scroll-smooth">
      {/* Navbar */}
      <header className="sticky top-0 z-40 bg-slate-950/85 backdrop-blur border-b border-slate-800">
        <div className="max-w-6xl mx-auto px-5 h-16 flex items-center justify-between">
          <a href="#/" className="flex items-center gap-2.5 font-bold tracking-tight">
            <span className="w-9 h-9 rounded-lg bg-amber-400 text-slate-900 flex items-center justify-center"><Building2 className="w-5 h-5" /></span>
            Apex EAMS
          </a>
          <nav className="hidden md:flex items-center gap-7 text-sm text-slate-300">
            {links.map(([id, label]) => (
              <a key={id} href={`#${id}`} onClick={goto(id)} className="hover:text-white transition-colors">{label}</a>
            ))}
          </nav>
          <div className="flex items-center gap-2">
            <button onClick={onLogin} className="px-4 py-2 rounded-lg bg-amber-400 hover:bg-amber-300 text-slate-900 text-sm font-semibold cursor-pointer">Log In</button>
            <button onClick={() => setOpen(!open)} className="md:hidden p-2 rounded-lg border border-slate-700 text-slate-300 cursor-pointer" aria-label="Menu">
              {open ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
            </button>
          </div>
        </div>
        {open && (
          <div className="md:hidden border-t border-slate-800 px-5 py-3 space-y-1 bg-slate-950">
            {links.map(([id, label]) => (
              <a key={id} href={`#${id}`} onClick={(e) => { goto(id)(e); setOpen(false); }} className="block py-2 text-sm text-slate-300">{label}</a>
            ))}
          </div>
        )}
      </header>

      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 pointer-events-none opacity-[0.07]" style={{ backgroundImage: 'linear-gradient(#fff 1px, transparent 1px), linear-gradient(90deg, #fff 1px, transparent 1px)', backgroundSize: '44px 44px' }} />
        <div className="absolute -top-40 -right-40 w-[34rem] h-[34rem] rounded-full bg-amber-400/10 blur-3xl pointer-events-none" />
        <div className="relative max-w-6xl mx-auto px-5 pt-16 pb-20 md:pt-24 md:pb-28 grid lg:grid-cols-2 gap-12 items-center">
          <div>
            <span className="inline-flex items-center gap-2 text-xs font-semibold text-amber-300 bg-amber-400/10 border border-amber-400/30 rounded-full px-3 py-1">
              <ShieldCheck className="w-3.5 h-3.5" /> Enterprise Asset Management System
            </span>
            <h1 className="mt-5 text-4xl md:text-5xl font-extrabold tracking-tight leading-[1.1]">
              Manage heavy equipment from the depot to <span className="text-amber-400">invoicing</span> in one system.
            </h1>
            <p className="mt-5 text-lg text-slate-300 max-w-xl">
              Connect assets, compliance, operators, rentals, maintenance, and finance. Field teams can scan QR codes on their phones, while managers see updates in real time.
            </p>
            <div className="mt-8 flex flex-wrap items-center gap-3">
              <button onClick={onLogin} className="inline-flex items-center gap-2 px-6 py-3 rounded-lg bg-amber-400 hover:bg-amber-300 text-slate-900 font-bold cursor-pointer">
                Log In to the System <ArrowRight className="w-4 h-4" />
              </button>
              <a href="#fitur" onClick={goto('fitur')} className="px-6 py-3 rounded-lg border border-slate-700 hover:border-slate-500 text-slate-200 font-semibold">Explore Features</a>
            </div>
            <p className="mt-4 text-xs text-slate-500">Your company’s IT Administrator creates user accounts.</p>
          </div>

          {/* Dashboard illustration */}
          <div className="relative" aria-hidden="true">
            <div className="rounded-2xl border border-slate-700 bg-slate-900 shadow-2xl p-4 space-y-3">
              <div className="flex items-center gap-1.5"><i className="w-2.5 h-2.5 rounded-full bg-rose-400" /><i className="w-2.5 h-2.5 rounded-full bg-amber-400" /><i className="w-2.5 h-2.5 rounded-full bg-emerald-400" /></div>
              <div className="grid grid-cols-3 gap-2.5">
                {[['Utilization', '82%', 'text-emerald-400'], ['Units on Rent', '24', 'text-amber-400'], ['Overdue Invoices', '3', 'text-rose-400']].map(([l, v, c]) => (
                  <div key={l} className="rounded-lg bg-slate-800/70 border border-slate-700 p-3">
                    <div className="text-[10px] text-slate-400">{l}</div>
                    <div className={`text-xl font-bold ${c}`}>{v}</div>
                  </div>
                ))}
              </div>
              <div className="rounded-lg bg-slate-800/70 border border-slate-700 p-3">
                <div className="text-[10px] text-slate-400 mb-2">Monthly rental revenue</div>
                <svg viewBox="0 0 300 80" className="w-full h-20">
                  {[28, 36, 31, 48, 44, 58, 52, 66, 61, 74].map((h, i) => (
                    <rect key={i} x={i * 30 + 4} y={80 - h} width="20" height={h} rx="3" className={i === 9 ? 'fill-amber-400' : 'fill-slate-600'} />
                  ))}
                </svg>
              </div>
              {[['EXC-320 · Excavator', 'On Rent', 'bg-blue-500/20 text-blue-300'], ['DMP-110 · Dump Truck', 'Available', 'bg-emerald-500/20 text-emerald-300'], ['CRN-045 · Crane', 'In Maintenance', 'bg-rose-500/20 text-rose-300']].map(([n, s, c]) => (
                <div key={n} className="flex items-center justify-between rounded-lg bg-slate-800/70 border border-slate-700 px-3 py-2 text-xs">
                  <span className="text-slate-200 font-mono">{n}</span>
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${c}`}>{s}</span>
                </div>
              ))}
            </div>
            <div className="absolute -bottom-5 -left-3 sm:-left-8 rounded-xl bg-white text-slate-900 shadow-xl px-4 py-3 flex items-center gap-3">
              <span className="w-9 h-9 rounded-lg bg-slate-900 text-amber-400 flex items-center justify-center"><QrCode className="w-5 h-5" /></span>
              <span className="text-xs leading-tight"><b className="block text-sm">Attendance recorded</b>Operator scanned EXC-320</span>
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="fitur" className="bg-slate-900/60 border-y border-slate-800 scroll-mt-16">
        <div className="max-w-6xl mx-auto px-5 py-20">
          <h2 className="text-3xl font-bold tracking-tight">Everything you need, all in one place</h2>
          <p className="mt-3 text-slate-400 max-w-2xl">Built for heavy equipment rental and fleet management businesses.</p>
          <div className="mt-10 grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {FEATURES.map(({ icon: Icon, title, desc }) => (
              <div key={title} className="rounded-xl border border-slate-800 bg-slate-900 p-6 hover:border-amber-400/50 transition-colors">
                <div className="w-11 h-11 rounded-lg bg-amber-400/10 text-amber-400 flex items-center justify-center"><Icon className="w-5 h-5" /></div>
                <h3 className="mt-4 font-semibold text-lg">{title}</h3>
                <p className="mt-2 text-sm text-slate-400 leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section id="cara-kerja" className="scroll-mt-16">
        <div className="max-w-6xl mx-auto px-5 py-20">
          <h2 className="text-3xl font-bold tracking-tight">How It Works</h2>
          <div className="mt-10 grid md:grid-cols-3 gap-6">
            {STEPS.map(({ icon: Icon, title, desc }, i) => (
              <div key={title} className="relative rounded-xl border border-slate-800 p-6">
                <span className="absolute -top-3 left-5 text-xs font-bold bg-amber-400 text-slate-900 rounded-full w-7 h-7 flex items-center justify-center">{i + 1}</span>
                <Icon className="w-7 h-7 text-amber-400 mt-2" />
                <h3 className="mt-3 font-semibold text-lg">{title}</h3>
                <p className="mt-1.5 text-sm text-slate-400">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Roles */}
      <section id="peran" className="bg-slate-900/60 border-y border-slate-800 scroll-mt-16">
        <div className="max-w-6xl mx-auto px-5 py-20">
          <h2 className="text-3xl font-bold tracking-tight flex items-center gap-3"><Users className="w-7 h-7 text-amber-400" /> The right tools for every role</h2>
          <p className="mt-3 text-slate-400 max-w-2xl">Menus and data are tailored to each role, helping teams stay focused while protecting sensitive information.</p>
          <div className="mt-8 flex flex-wrap gap-2.5">
            {roles.map((r) => (
              <span key={r} className="px-3.5 py-2 rounded-full border border-slate-700 bg-slate-900 text-sm text-slate-200">{LANDING_ROLE_LABELS[r]}</span>
            ))}
          </div>
        </div>
      </section>

      {/* Security */}
      <section id="keamanan" className="scroll-mt-16">
        <div className="max-w-6xl mx-auto px-5 py-20 grid md:grid-cols-2 gap-10 items-center">
          <div>
            <h2 className="text-3xl font-bold tracking-tight flex items-center gap-3"><History className="w-7 h-7 text-amber-400" /> Secure and auditable</h2>
            <p className="mt-3 text-slate-400">Your operational and financial data is protected by access controls and a clear activity trail.</p>
          </div>
          <ul className="space-y-3">
            {SECURITY.map((s) => (
              <li key={s} className="flex items-start gap-3 text-slate-200">
                <span className="mt-0.5 w-5 h-5 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0"><Check className="w-3.5 h-3.5" /></span>{s}
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* CTA */}
      <section className="px-5 pb-20">
        <div className="max-w-4xl mx-auto rounded-2xl bg-gradient-to-br from-amber-400 to-amber-500 text-slate-900 p-10 text-center">
          <h2 className="text-3xl font-extrabold tracking-tight">Ready to get started?</h2>
          <p className="mt-2 text-slate-800">Log in with your company account.</p>
          <button onClick={onLogin} className="mt-6 inline-flex items-center gap-2 px-6 py-3 rounded-lg bg-slate-900 text-white font-semibold hover:bg-slate-800 cursor-pointer">
            Log In to the System <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </section>

      <footer className="border-t border-slate-800 px-5 py-8 text-center text-xs text-slate-500">
        &copy; {new Date().getFullYear()} Apex Industrial Solutions &middot; Enterprise Asset Management System
      </footer>
    </div>
  );
};
