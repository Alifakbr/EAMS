import React, { useEffect, useState } from 'react';
import { api, SessionInfo } from '../services/api.ts';
import { session } from '../services/session.ts';
import { Lock, Mail, ArrowRight, ArrowLeft, AlertCircle, Building2, ChevronDown, ChevronUp, Eye, EyeOff, Loader2, Info, ShieldCheck, QrCode, BarChart3 } from 'lucide-react';

interface LoginPageProps {
  onLoginSuccess: (info: SessionInfo) => void;
  onBack: () => void;
  /** Pesan dari sistem, mis. "Sesi Anda berakhir". */
  notice?: string | null;
}

const DEMO_PASSWORD = 'Demo@2026';
const DEMO_ACCOUNTS = [
<<<<<<< HEAD
  { role: 'Executive Director', email: 'marcus@apex-industrial.com' },
  { role: 'IT Administrator', email: 'hendra.it@apex-industrial.com' },
=======
  { role: 'Executive (Direktur)', email: 'marcus@apex-industrial.com' },
  { role: 'Administrator IT', email: 'hendra.it@apex-industrial.com' },
>>>>>>> 2e64693bfb1fbb36a821a7a7248b397ac785b443
  { role: 'Sales & Marketing', email: 'elena@apex-industrial.com' },
  { role: 'Asset Control', email: 'bambang.asset@apex-industrial.com' },
  { role: 'Management Operation', email: 'joko.ops@apex-industrial.com' },
  { role: 'Procurement', email: 'dewi.proc@apex-industrial.com' },
  { role: 'Finance, Accounting & Tax', email: 'sarah@apex-industrial.com' },
  { role: 'AR Management', email: 'reza.ar@apex-industrial.com' },
<<<<<<< HEAD
  { role: 'Field Operator', email: 'agus.operator@apex-industrial.com' },
=======
  { role: 'Operator Lapangan', email: 'agus.operator@apex-industrial.com' },
>>>>>>> 2e64693bfb1fbb36a821a7a7248b397ac785b443
];

export const LoginPage: React.FC<LoginPageProps> = ({ onLoginSuccess, onBack, notice }) => {
  const [email, setEmail] = useState(session.getLastEmail());
  const [password, setPassword] = useState('');
  const [remember, setRemember] = useState(true);
  const [showPw, setShowPw] = useState(false);
  const [capsOn, setCapsOn] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [demoMode, setDemoMode] = useState(false);
  const [showDemo, setShowDemo] = useState(false);

  useEffect(() => {
    fetch('/api/public-config').then((r) => r.json()).then((c) => setDemoMode(!!c.demoMode)).catch(() => {});
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !password) {
<<<<<<< HEAD
      setErrorMessage('Email and password are required.');
=======
      setErrorMessage('Email dan password wajib diisi.');
>>>>>>> 2e64693bfb1fbb36a821a7a7248b397ac785b443
      return;
    }
    setLoading(true);
    setErrorMessage(null);
    try {
      const res = await api.login({ email: email.trim(), password });
      session.setToken(res.token, remember);
      session.setLastEmail(email.trim());
      onLoginSuccess({ user: res.user, modules: res.modules });
    } catch (err: any) {
      setPassword('');
<<<<<<< HEAD
      setErrorMessage(err.message || 'Sign-in failed. Check your email and password.');
=======
      setErrorMessage(err.message || 'Gagal masuk. Periksa kembali email dan password Anda.');
>>>>>>> 2e64693bfb1fbb36a821a7a7248b397ac785b443
    } finally {
      setLoading(false);
    }
  };

  const field = 'w-full pl-9 pr-3 py-2.5 text-sm border border-slate-300 rounded-lg focus:border-slate-900 focus:ring-2 focus:ring-slate-900/10 outline-none bg-white';

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 grid lg:grid-cols-2 selection:bg-amber-400 selection:text-slate-900">
      {/* Panel merek (desktop) */}
      <aside className="hidden lg:flex flex-col justify-between p-12 bg-gradient-to-br from-slate-900 via-slate-950 to-slate-900 border-r border-slate-800">
        <button type="button" onClick={onBack} className="flex items-center gap-3 text-left cursor-pointer w-fit">
          <div className="w-10 h-10 rounded-lg bg-amber-400 text-slate-900 flex items-center justify-center"><Building2 className="w-5 h-5" /></div>
          <span className="font-bold text-lg tracking-tight">Apex EAMS</span>
        </button>
        <div className="space-y-8 max-w-md">
<<<<<<< HEAD
          <h1 className="text-3xl font-bold leading-tight">One platform for all your heavy equipment operations.</h1>
          <ul className="space-y-4 text-sm text-slate-300">
            {[
              [QrCode, 'Scan QR in the field', 'Operators can check in and report damage directly from a mobile device.'],
              [BarChart3, 'Ready-to-use reports', 'Utilization, receivables, and profitability in one view.'],
              [ShieldCheck, 'Role-based access', 'Everyone sees only the menus relevant to their responsibilities.'],
=======
          <h1 className="text-3xl font-bold leading-tight">Satu pintu untuk seluruh operasi alat berat Anda.</h1>
          <ul className="space-y-4 text-sm text-slate-300">
            {[
              [QrCode, 'Scan QR di lapangan', 'Absen operator & lapor kerusakan langsung dari HP.'],
              [BarChart3, 'Laporan siap pakai', 'Utilisasi, piutang, dan profitabilitas dalam satu tampilan.'],
              [ShieldCheck, 'Akses sesuai peran', 'Setiap orang hanya melihat menu yang relevan dengan tugasnya.'],
>>>>>>> 2e64693bfb1fbb36a821a7a7248b397ac785b443
            ].map(([Icon, t, d]: any) => (
              <li key={t} className="flex gap-3">
                <Icon className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
                <span><strong className="block text-white">{t}</strong>{d}</span>
              </li>
            ))}
          </ul>
        </div>
        <p className="text-xs text-slate-500">&copy; {new Date().getFullYear()} Apex Industrial Solutions</p>
      </aside>

      {/* Form */}
      <main className="flex items-center justify-center p-5 sm:p-10 bg-slate-100 text-slate-900">
        <div className="w-full max-w-sm">
          <button type="button" onClick={onBack} className="mb-6 inline-flex items-center gap-1.5 text-xs text-slate-500 hover:text-slate-900 cursor-pointer">
<<<<<<< HEAD
            <ArrowLeft className="w-3.5 h-3.5" /> Back to home
          </button>

          <h2 className="text-2xl font-bold tracking-tight">Sign In</h2>
          <p className="text-sm text-slate-500 mt-1 mb-6">Use the company account provided by your IT Administrator.</p>
=======
            <ArrowLeft className="w-3.5 h-3.5" /> Kembali ke beranda
          </button>

          <h2 className="text-2xl font-bold tracking-tight">Masuk</h2>
          <p className="text-sm text-slate-500 mt-1 mb-6">Gunakan akun perusahaan yang diberikan Administrator IT.</p>
>>>>>>> 2e64693bfb1fbb36a821a7a7248b397ac785b443

          {notice && !errorMessage && (
            <div className="mb-4 p-3 rounded-lg bg-amber-50 border border-amber-200 text-amber-900 text-xs flex items-start gap-2" role="status">
              <Info className="w-4 h-4 shrink-0 mt-0.5" /><span>{notice}</span>
            </div>
          )}
          {errorMessage && (
            <div className="mb-4 p-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-start gap-2" role="alert">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" /><span>{errorMessage}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4" noValidate>
            <label className="block">
<<<<<<< HEAD
              <span className="block text-xs font-semibold text-slate-700 mb-1">Work email</span>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                <input type="email" autoComplete="username" inputMode="email" autoFocus={!email}
                  placeholder="name@company.com" value={email} onChange={(e) => setEmail(e.target.value)} className={field} />
=======
              <span className="block text-xs font-semibold text-slate-700 mb-1">Email perusahaan</span>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                <input type="email" autoComplete="username" inputMode="email" autoFocus={!email}
                  placeholder="nama@perusahaan.com" value={email} onChange={(e) => setEmail(e.target.value)} className={field} />
>>>>>>> 2e64693bfb1fbb36a821a7a7248b397ac785b443
              </div>
            </label>

            <label className="block">
              <span className="block text-xs font-semibold text-slate-700 mb-1">Password</span>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                <input type={showPw ? 'text' : 'password'} autoComplete="current-password" autoFocus={!!email}
                  value={password} onChange={(e) => setPassword(e.target.value)}
                  onKeyUp={(e) => setCapsOn(e.getModifierState?.('CapsLock') ?? false)}
                  className={`${field} pr-10`} />
<<<<<<< HEAD
                <button type="button" onClick={() => setShowPw(!showPw)} className="absolute right-3 top-3 text-slate-400 hover:text-slate-700 cursor-pointer" aria-label="Show/hide password">
                  {showPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              {capsOn && <span className="text-[11px] text-amber-700 mt-1 block">Caps Lock is on.</span>}
=======
                <button type="button" onClick={() => setShowPw(!showPw)} className="absolute right-3 top-3 text-slate-400 hover:text-slate-700 cursor-pointer" aria-label="Tampilkan/sembunyikan password">
                  {showPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              {capsOn && <span className="text-[11px] text-amber-700 mt-1 block">Caps Lock sedang aktif.</span>}
>>>>>>> 2e64693bfb1fbb36a821a7a7248b397ac785b443
            </label>

            <label className="flex items-center gap-2 text-xs text-slate-600 cursor-pointer select-none">
              <input type="checkbox" checked={remember} onChange={(e) => setRemember(e.target.checked)} className="rounded border-slate-300" />
              Tetap masuk di perangkat ini
            </label>

            <button type="submit" disabled={loading}
              className="w-full py-3 bg-slate-900 hover:bg-slate-800 text-white text-sm font-semibold rounded-lg flex items-center justify-center gap-2 disabled:opacity-60 cursor-pointer">
<<<<<<< HEAD
              {loading ? <><Loader2 className="w-4 h-4 animate-spin" /> Verifying…</> : <>Sign In <ArrowRight className="w-4 h-4" /></>}
            </button>
          </form>

          <p className="text-[11px] text-slate-400 mt-4">Forgot your password? Contact your IT Administrator to reset it.</p>
=======
              {loading ? <><Loader2 className="w-4 h-4 animate-spin" /> Memverifikasi…</> : <>Masuk <ArrowRight className="w-4 h-4" /></>}
            </button>
          </form>

          <p className="text-[11px] text-slate-400 mt-4">Lupa password? Hubungi Administrator IT untuk reset.</p>
>>>>>>> 2e64693bfb1fbb36a821a7a7248b397ac785b443

          {demoMode && (
            <div className="mt-6 pt-4 border-t border-slate-300">
              <button type="button" onClick={() => setShowDemo(!showDemo)} className="w-full flex items-center justify-between text-xs text-slate-600 hover:text-slate-900 cursor-pointer">
<<<<<<< HEAD
                <span className="font-semibold">Demo accounts (testing mode)</span>
=======
                <span className="font-semibold">Akun demo (mode pengujian)</span>
>>>>>>> 2e64693bfb1fbb36a821a7a7248b397ac785b443
                {showDemo ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
              </button>
              {showDemo && (
                <div className="mt-2 space-y-1">
<<<<<<< HEAD
                  <p className="text-[11px] text-slate-500">Select an account to fill in the form. Password: <code className="font-mono bg-white px-1 rounded">{DEMO_PASSWORD}</code></p>
=======
                  <p className="text-[11px] text-slate-500">Ketuk salah satu untuk mengisi formulir. Password: <code className="font-mono bg-white px-1 rounded">{DEMO_PASSWORD}</code></p>
>>>>>>> 2e64693bfb1fbb36a821a7a7248b397ac785b443
                  <div className="max-h-52 overflow-y-auto rounded-lg border border-slate-200 bg-white divide-y divide-slate-100">
                    {DEMO_ACCOUNTS.map((a) => (
                      <button key={a.email} type="button" onClick={() => { setEmail(a.email); setPassword(DEMO_PASSWORD); setErrorMessage(null); setShowDemo(false); }}
                        className="w-full text-left px-3 py-2 hover:bg-slate-50 cursor-pointer">
                        <span className="block text-xs font-semibold text-slate-800">{a.role}</span>
                        <span className="block text-[10px] font-mono text-slate-400">{a.email}</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </main>
    </div>
  );
};
