import React, { useState } from 'react';
import { KeyRound, Eye, EyeOff, AlertCircle, X, Loader2 } from 'lucide-react';
import { api, SessionInfo } from '../services/api.ts';
import { session } from '../services/session.ts';
import { PASSWORD_POLICY_TEXT, validatePasswordStrength } from '../shared/access.ts';

interface Props {
  /** true = wajib (login pertama / setelah reset admin); tidak bisa ditutup. */
  forced?: boolean;
  onClose?: () => void;
  onChanged: (info: SessionInfo) => void;
  onLogout?: () => void;
}

export const ChangePasswordModal: React.FC<Props> = ({ forced, onClose, onChanged, onLogout }) => {
  const [current, setCurrent] = useState('');
  const [next, setNext] = useState('');
  const [confirmPw, setConfirmPw] = useState('');
  const [show, setShow] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    const weak = validatePasswordStrength(next);
    if (weak) return setError(weak);
    if (next !== confirmPw) return setError('Password confirmation does not match.');
    if (next === current) return setError('The new password must be different from the current password.');
    setBusy(true);
    try {
      const res = await api.changePassword({ currentPassword: current, newPassword: next });
      session.replaceToken(res.token);
      onChanged({ user: res.user, modules: res.modules });
    } catch (err: any) {
      setError(err.message || 'Failed to change password.');
    } finally {
      setBusy(false);
    }
  };

  const input = 'w-full pl-3 pr-9 py-2 text-xs border border-slate-300 rounded focus:border-slate-800 focus:ring-1 focus:ring-slate-800 outline-none';

  return (
    <div className="fixed inset-0 z-[90] bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-4">
      <form onSubmit={submit} className="bg-white rounded-xl shadow-2xl max-w-md w-full p-6 space-y-4 text-xs text-slate-900">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-amber-100 text-amber-700 flex items-center justify-center"><KeyRound className="w-5 h-5" /></div>
            <div>
              <h2 className="text-base font-bold">{forced ? 'Create a New Password' : 'Change Password'}</h2>
              <p className="text-slate-500">{forced ? 'For security, change your temporary password before continuing.' : 'Use a unique, hard-to-guess password.'}</p>
            </div>
          </div>
          {!forced && onClose && (
            <button type="button" onClick={onClose} className="text-slate-400 hover:text-slate-700 cursor-pointer" aria-label="Close"><X className="w-4 h-4" /></button>
          )}
        </div>

        {error && (
          <div className="p-2.5 rounded bg-rose-50 border border-rose-200 text-rose-800 flex items-start gap-2" role="alert">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" /><span>{error}</span>
          </div>
        )}

        {([
          ['Current password', current, setCurrent, 'current-password'],
          ['New password', next, setNext, 'new-password'],
          ['Confirm new password', confirmPw, setConfirmPw, 'new-password'],
        ] as const).map(([label, val, setter, ac], i) => (
          <label key={label} className="block">
            <span className="block font-semibold text-slate-700 mb-1">{label}</span>
            <div className="relative">
              <input type={show ? 'text' : 'password'} required autoComplete={ac} value={val}
                onChange={(e) => setter(e.target.value)} className={input} autoFocus={i === 0} />
              {i === 1 && (
                <button type="button" onClick={() => setShow(!show)} className="absolute right-2.5 top-2.5 text-slate-400 hover:text-slate-700 cursor-pointer" aria-label="Show/hide password">
                  {show ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              )}
            </div>
            {i === 1 && <span className="text-[10px] text-slate-400 mt-1 block">{PASSWORD_POLICY_TEXT}</span>}
          </label>
        ))}

        <div className="flex items-center justify-between gap-3 pt-1">
          {forced && onLogout ? (
            <button type="button" onClick={onLogout} className="text-slate-500 hover:text-slate-800 underline cursor-pointer">Log out</button>
          ) : <span />}
          <button type="submit" disabled={busy}
            className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white font-semibold rounded flex items-center gap-2 disabled:opacity-50 cursor-pointer">
            {busy && <Loader2 className="w-3.5 h-3.5 animate-spin" />} Save Password
          </button>
        </div>
      </form>
    </div>
  );
};
