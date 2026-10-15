import React, { useState } from 'react';
import { User, UserRole } from '../types/index.ts';
import { api } from '../services/api.ts';
import {
  ShieldCheck,
  Lock,
  Mail,
  ArrowRight,
  AlertCircle,
  Building2,
  ChevronDown,
  ChevronUp,
  UserCheck,
} from 'lucide-react';

interface LoginPageProps {
  onLoginSuccess: (user: User) => void;
}

const DEMO_ACCOUNTS = [
  { name: 'Marcus Sterling', role: 'EXECUTIVE', email: 'marcus@apex-industrial.com', label: '1. Executive (Direktur Utama)' },
  { name: 'Hendra Wijaya', role: 'ADMIN_IT', email: 'hendra.it@apex-industrial.com', label: '2. Administrator Admin (IT)' },
  { name: 'Elena Rostova', role: 'SALES_MARKETING', email: 'elena@apex-industrial.com', label: '3. Sales & Marketing Support' },
  { name: 'Bambang Pratama', role: 'ASSET_CONTROL', email: 'bambang.asset@apex-industrial.com', label: '4. Asset Control (Asset Management)' },
  { name: 'Joko Susilo', role: 'MANAGEMENT_OPERATION', email: 'joko.ops@apex-industrial.com', label: '5. Management Operation (Field Operation)' },
  { name: 'Dewi Lestari', role: 'PROCUREMENT', email: 'dewi.proc@apex-industrial.com', label: '6. Procurement' },
  { name: 'Sarah Jenkins', role: 'FINANCE_ACCOUNTING_TAX', email: 'sarah@apex-industrial.com', label: '7. Accounting Finance & Tax (FAT)' },
  { name: 'Reza Ramadhan', role: 'AR_MANAGEMENT', email: 'reza.ar@apex-industrial.com', label: '8. AR Management (Accounts Receivable)' },
  { name: 'Agus Santoso', role: 'OPERATOR_USER', email: 'agus.operator@apex-industrial.com', label: '9. Operator / Pengguna Alat Lapangan' },
];

export const LoginPage: React.FC<LoginPageProps> = ({ onLoginSuccess }) => {
  const [email, setEmail] = useState('marcus@apex-industrial.com');
  const [password, setPassword] = useState('••••••••');
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [showDemoSelector, setShowDemoSelector] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) {
      setErrorMessage('Alamat email perusahaan wajib diisi.');
      return;
    }

    setLoading(true);
    setErrorMessage(null);

    try {
      const response = await api.login({
        email: email.trim(),
        password,
      });

      localStorage.setItem('apex_auth_user', JSON.stringify(response.user));
      localStorage.setItem('apex_user_role', response.user.role);
      localStorage.setItem('apex_user_name', response.user.name);
      onLoginSuccess(response.user);
    } catch (err: any) {
      setErrorMessage(err.message || 'Gagal masuk. Silakan periksa kembali alamat email Anda.');
    } finally {
      setLoading(false);
    }
  };

  const handleSelectDemoAccount = (demoEmail: string) => {
    setEmail(demoEmail);
    setPassword('demo-password');
    setShowDemoSelector(false);
    setErrorMessage(null);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col justify-between selection:bg-amber-500 selection:text-slate-900">
      {/* Top Brand Bar */}
      <div className="px-6 py-4 flex items-center justify-between border-b border-slate-800">
        <div className="flex items-center gap-3">
          <Building2 className="w-5 h-5 text-amber-400" />
          <span className="text-base font-bold tracking-tight text-white">
            Apex Industrial Solutions
          </span>
          <span className="text-slate-600">|</span>
          <span className="text-xs text-slate-400 font-medium">
            Enterprise Asset Rental Management System (EARMS)
          </span>
        </div>

        <div className="text-[11px] text-slate-400 font-mono">
          SECURE PORTAL · NODE API v2.4
        </div>
      </div>

      {/* Centered Enterprise Login Card */}
      <div className="flex-1 flex items-center justify-center p-6">
        <div className="max-w-md w-full bg-white text-slate-900 rounded-xl p-8 shadow-2xl border border-slate-200">
          <div className="text-center mb-6">
            <div className="w-12 h-12 bg-slate-900 text-amber-400 rounded-lg flex items-center justify-center mx-auto mb-3 shadow-md">
              <Building2 className="w-6 h-6" />
            </div>
            <h1 className="text-xl font-bold tracking-tight text-slate-900">
              Masuk ke Portal EARMS
            </h1>
            <p className="text-xs text-slate-500 mt-1">
              Masukkan alamat email perusahaan untuk mengakses area kerja Anda.
            </p>
          </div>

          {errorMessage && (
            <div className="mb-4 p-3 rounded bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-start gap-2">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
              <span>{errorMessage}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4 text-xs">
            {/* Email Input */}
            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Alamat Email Perusahaan (Corporate Email) *
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                <input
                  type="email"
                  required
                  placeholder="nama@apex-industrial.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 text-xs border border-slate-300 rounded font-mono focus:border-slate-800 focus:ring-1 focus:ring-slate-800 outline-none"
                />
              </div>
            </div>

            {/* Password Input */}
            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Kata Sandi (Security Password)
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                <input
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 text-xs border border-slate-300 rounded font-mono focus:border-slate-800 outline-none"
                />
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 px-4 bg-slate-900 hover:bg-slate-800 text-white font-semibold rounded transition-colors flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 mt-2 shadow-xs"
            >
              {loading ? (
                <span>Memverifikasi Akun...</span>
              ) : (
                <>
                  <span>Masuk ke Sistem (Sign In)</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          {/* Collapsible Fast Demo Account Selector for evaluator testing */}
          <div className="mt-6 pt-4 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setShowDemoSelector(!showDemoSelector)}
              className="w-full text-left text-[11px] text-slate-500 hover:text-slate-800 flex items-center justify-between py-1 cursor-pointer"
            >
              <span className="font-medium">Opsi Akun Demo Pengujian (Testing Credentials)</span>
              {showDemoSelector ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
            </button>

            {showDemoSelector && (
              <div className="mt-2.5 p-2.5 bg-slate-50 rounded border border-slate-200 space-y-1.5 text-[11px]">
                <span className="text-[10px] text-slate-400 block mb-1">
                  Pilih akun untuk mengisi formulir masuk secara instan:
                </span>
                <div className="grid grid-cols-1 gap-1 max-h-48 overflow-y-auto">
                  {DEMO_ACCOUNTS.map((acc) => (
                    <button
                      key={acc.email}
                      type="button"
                      onClick={() => handleSelectDemoAccount(acc.email)}
                      className="w-full text-left p-1.5 rounded hover:bg-white border border-transparent hover:border-slate-200 transition-colors flex items-center justify-between cursor-pointer"
                    >
                      <div className="min-w-0">
                        <span className="font-semibold text-slate-800 block truncate">{acc.label}</span>
                        <span className="font-mono text-[10px] text-slate-400">{acc.email}</span>
                      </div>
                      <span className="text-[9px] font-mono px-1 py-0.2 rounded bg-slate-200 text-slate-700 shrink-0">
                        {acc.role}
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-[10px] text-slate-400">
            <span>Standar Keamanan ISO 27001</span>
            <span>Enkripsi TLS 1.3 Terpusat</span>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="px-6 py-3 border-t border-slate-800 text-[11px] text-slate-400 flex flex-col sm:flex-row items-center justify-between gap-2">
        <span>&copy; 2026 Apex Industrial Solutions &amp; Commercial Operations Corp. Hak Cipta Dilindungi.</span>
        <span className="font-mono text-slate-400">Environment: Production Sandbox</span>
      </footer>
    </div>
  );
};
