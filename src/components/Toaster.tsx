import React, { useEffect, useState } from 'react';
import { CheckCircle2, AlertCircle, Info, X } from 'lucide-react';

type ToastType = 'success' | 'error' | 'info';
interface ToastItem { id: number; type: ToastType; text: string }

let listeners: ((t: ToastItem) => void)[] = [];
let counter = 0;

const guessType = (msg: string): ToastType => {
  if (/gagal|error|salah|ditolak|tidak (dapat|bisa|valid|ditemukan)|invalid|failed|forbidden|wajib/i.test(msg)) return 'error';
  if (/berhasil|sukses|success|tersimpan|disimpan|dibuat|updated|saved|terkirim/i.test(msg)) return 'success';
  return 'info';
};

export function toast(text: string, type?: ToastType) {
  const item = { id: ++counter, type: type || guessType(String(text)), text: String(text) };
  listeners.forEach((l) => l(item));
}

/**
 * Mengganti window.alert() yang memblokir layar dengan notifikasi non-blokir.
 * Seluruh pemanggilan alert() yang sudah ada di aplikasi otomatis memakainya.
 */
export function installAlertToast() {
  window.alert = (msg?: unknown) => toast(String(msg ?? ''));
}

const STYLE: Record<ToastType, { box: string; Icon: React.ElementType }> = {
  success: { box: 'bg-emerald-50 border-emerald-300 text-emerald-900', Icon: CheckCircle2 },
  error: { box: 'bg-rose-50 border-rose-300 text-rose-900', Icon: AlertCircle },
  info: { box: 'bg-white border-slate-300 text-slate-800', Icon: Info },
};

export const Toaster: React.FC = () => {
  const [items, setItems] = useState<ToastItem[]>([]);

  useEffect(() => {
    const onToast = (t: ToastItem) => {
      setItems((prev) => [...prev.slice(-3), t]);
      window.setTimeout(() => setItems((prev) => prev.filter((x) => x.id !== t.id)), t.type === 'error' ? 8000 : 5000);
    };
    listeners.push(onToast);
    return () => { listeners = listeners.filter((l) => l !== onToast); };
  }, []);

  if (!items.length) return null;
  return (
    <div className="fixed z-[100] bottom-4 right-4 left-4 sm:left-auto sm:w-96 space-y-2 no-print" role="status" aria-live="polite">
      {items.map((t) => {
        const { box, Icon } = STYLE[t.type];
        return (
          <div key={t.id} className={`flex items-start gap-2.5 p-3 rounded-lg border shadow-lg text-xs ${box}`}>
            <Icon className="w-4 h-4 shrink-0 mt-0.5" />
            <span className="flex-1 whitespace-pre-line break-words">{t.text}</span>
            <button type="button" onClick={() => setItems((p) => p.filter((x) => x.id !== t.id))} className="opacity-60 hover:opacity-100 cursor-pointer"             aria-label="Close">
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        );
      })}
    </div>
  );
};
