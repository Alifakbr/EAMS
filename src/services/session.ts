/**
 * Penyimpanan sesi di sisi klien.
 * - Hanya menyimpan TOKEN. Data pengguna/peran selalu diambil ulang dari server (/auth/me),
 *   sehingga mengubah localStorage tidak bisa menaikkan hak akses.
 * - "Ingat saya" = localStorage (tetap login). Tanpa itu = sessionStorage (hilang saat tab ditutup).
 */
const KEY = 'eams_token';
const EMAIL_KEY = 'eams_last_email';

export const session = {
  getToken(): string | null {
    try {
      return sessionStorage.getItem(KEY) || localStorage.getItem(KEY);
    } catch {
      return null;
    }
  },
  setToken(token: string, remember = true) {
    try {
      sessionStorage.removeItem(KEY);
      localStorage.removeItem(KEY);
      (remember ? localStorage : sessionStorage).setItem(KEY, token);
    } catch { /* storage diblokir */ }
  },
  /** Ganti token tanpa mengubah mode ingat-saya (dipakai setelah ganti password). */
  replaceToken(token: string) {
    try {
      if (sessionStorage.getItem(KEY)) sessionStorage.setItem(KEY, token);
      else localStorage.setItem(KEY, token);
    } catch { /* noop */ }
  },
  clear() {
    try {
      sessionStorage.removeItem(KEY);
      localStorage.removeItem(KEY);
      // Bersihkan sisa kunci lama (versi sebelumnya menyimpan peran di localStorage).
      ['apex_auth_user', 'apex_user_role', 'apex_user_name'].forEach((k) => localStorage.removeItem(k));
    } catch { /* noop */ }
  },
  getLastEmail(): string {
    try { return localStorage.getItem(EMAIL_KEY) || ''; } catch { return ''; }
  },
  setLastEmail(email: string) {
    try { localStorage.setItem(EMAIL_KEY, email); } catch { /* noop */ }
  },
};

export const SESSION_EVENTS = {
  expired: 'eams:session-expired',
  passwordRequired: 'eams:password-required',
} as const;
