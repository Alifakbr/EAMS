import React from 'react';
import {
  Building2, ArrowRight, QrCode, FileText, Wrench, Banknote, BarChart3, ShieldCheck, Boxes,
  ClipboardCheck, Smartphone, LineChart, Users, History, Check, Menu, X,
} from 'lucide-react';
import { ROLE_LABELS, ROLE_MODULES } from '../shared/access.ts';
import type { UserRole } from '../types/index.ts';

interface LandingPageProps {
  onLogin: () => void;
}

const FEATURES = [
  { icon: Boxes, title: 'Register Aset & Legalitas', desc: 'Data alat berat, nomor seri, serta masa berlaku STNK, BPKB, dan SIA tersimpan rapi dengan pengingat.' },
  { icon: QrCode, title: 'Scan QR di Lapangan', desc: 'Operator memindai kode alat dari HP untuk absen datang/pulang dan melaporkan kerusakan dalam hitungan detik.' },
  { icon: FileText, title: 'Penawaran, Order & Sewa', desc: 'Dari quotation, sales order, hingga kontrak sewa dan surat jalan — alurnya tersambung, tanpa input ulang.' },
  { icon: Banknote, title: 'Invoice & Piutang', desc: 'Terbitkan invoice, catat pembayaran, dan pantau umur piutang (aging) agar penagihan tidak terlewat.' },
  { icon: Wrench, title: 'Perawatan & Servis', desc: 'Work order bengkel, penggantian sparepart, dan status alat otomatis ikut berubah saat servis selesai.' },
  { icon: BarChart3, title: 'Laporan Siap Cetak', desc: 'Laporan eksekutif, utilisasi armada, dan profitabilitas aset yang bisa diunduh ke Excel atau PDF.' },
];

const STEPS = [
  { icon: ClipboardCheck, title: 'Daftarkan aset', desc: 'Input alat berat sekali, lengkap dengan dokumen legalitas dan lokasi proyek.' },
  { icon: Smartphone, title: 'Operasikan dari lapangan', desc: 'Operator dan mekanik scan QR untuk absen, lapor status, dan mulai/selesaikan servis.' },
  { icon: LineChart, title: 'Pantau & tagih', desc: 'Manajemen melihat utilisasi dan piutang real-time; keuangan menerbitkan invoice dari data yang sama.' },
];

const SECURITY = [
  'Login dengan password terenkripsi dan batas percobaan',
  'Akses menu & data dibatasi sesuai peran, dicek di server',
  'Seluruh aktivitas penting tercatat di log audit',
  'Backup data satu klik oleh Administrator IT',
];

const goto = (id: string) => (e: React.MouseEvent) => {
  e.preventDefault();
  document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
};

export const LandingPage: React.FC<LandingPageProps> = ({ onLogin }) => {
  const [open, setOpen] = React.useState(false);
  const roles = Object.keys(ROLE_MODULES) as UserRole[];

  const links = [
    ['fitur', 'Fitur'], ['cara-kerja', 'Cara Kerja'], ['peran', 'Untuk Siapa'], ['keamanan', 'Keamanan'],
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
            <button onClick={onLogin} className="px-4 py-2 rounded-lg bg-amber-400 hover:bg-amber-300 text-slate-900 text-sm font-semibold cursor-pointer">Masuk</button>
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
              Kelola alat berat dari gudang sampai <span className="text-amber-400">tagihan</span>, dalam satu sistem.
            </h1>
            <p className="mt-5 text-lg text-slate-300 max-w-xl">
              Aset, legalitas, operator, penyewaan, perawatan, dan keuangan terhubung. Tim lapangan cukup scan QR dari HP; manajemen melihat hasilnya langsung.
            </p>
            <div className="mt-8 flex flex-wrap items-center gap-3">
              <button onClick={onLogin} className="inline-flex items-center gap-2 px-6 py-3 rounded-lg bg-amber-400 hover:bg-amber-300 text-slate-900 font-bold cursor-pointer">
                Masuk ke Sistem <ArrowRight className="w-4 h-4" />
              </button>
              <a href="#fitur" onClick={goto('fitur')} className="px-6 py-3 rounded-lg border border-slate-700 hover:border-slate-500 text-slate-200 font-semibold">Lihat Fitur</a>
            </div>
            <p className="mt-4 text-xs text-slate-500">Akun dibuat oleh Administrator IT perusahaan Anda.</p>
          </div>

          {/* Ilustrasi dashboard (murni CSS) */}
          <div className="relative" aria-hidden="true">
            <div className="rounded-2xl border border-slate-700 bg-slate-900 shadow-2xl p-4 space-y-3">
              <div className="flex items-center gap-1.5"><i className="w-2.5 h-2.5 rounded-full bg-rose-400" /><i className="w-2.5 h-2.5 rounded-full bg-amber-400" /><i className="w-2.5 h-2.5 rounded-full bg-emerald-400" /></div>
              <div className="grid grid-cols-3 gap-2.5">
                {[['Utilisasi', '82%', 'text-emerald-400'], ['Alat Disewa', '24', 'text-amber-400'], ['Piutang Jatuh Tempo', '3', 'text-rose-400']].map(([l, v, c]) => (
                  <div key={l} className="rounded-lg bg-slate-800/70 border border-slate-700 p-3">
                    <div className="text-[10px] text-slate-400">{l}</div>
                    <div className={`text-xl font-bold ${c}`}>{v}</div>
                  </div>
                ))}
              </div>
              <div className="rounded-lg bg-slate-800/70 border border-slate-700 p-3">
                <div className="text-[10px] text-slate-400 mb-2">Pendapatan sewa per bulan</div>
                <svg viewBox="0 0 300 80" className="w-full h-20">
                  {[28, 36, 31, 48, 44, 58, 52, 66, 61, 74].map((h, i) => (
                    <rect key={i} x={i * 30 + 4} y={80 - h} width="20" height={h} rx="3" className={i === 9 ? 'fill-amber-400' : 'fill-slate-600'} />
                  ))}
                </svg>
              </div>
              {[['EXC-320 · Excavator', 'Disewa', 'bg-blue-500/20 text-blue-300'], ['DMP-110 · Dump Truck', 'Tersedia', 'bg-emerald-500/20 text-emerald-300'], ['CRN-045 · Crane', 'Perawatan', 'bg-rose-500/20 text-rose-300']].map(([n, s, c]) => (
                <div key={n} className="flex items-center justify-between rounded-lg bg-slate-800/70 border border-slate-700 px-3 py-2 text-xs">
                  <span className="text-slate-200 font-mono">{n}</span>
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${c}`}>{s}</span>
                </div>
              ))}
            </div>
            <div className="absolute -bottom-5 -left-3 sm:-left-8 rounded-xl bg-white text-slate-900 shadow-xl px-4 py-3 flex items-center gap-3">
              <span className="w-9 h-9 rounded-lg bg-slate-900 text-amber-400 flex items-center justify-center"><QrCode className="w-5 h-5" /></span>
              <span className="text-xs leading-tight"><b className="block text-sm">Absen terekam</b>Operator scan EXC-320</span>
            </div>
          </div>
        </div>
      </section>

      {/* Fitur */}
      <section id="fitur" className="bg-slate-900/60 border-y border-slate-800 scroll-mt-16">
        <div className="max-w-6xl mx-auto px-5 py-20">
          <h2 className="text-3xl font-bold tracking-tight">Semua yang dibutuhkan, tanpa pindah-pindah aplikasi</h2>
          <p className="mt-3 text-slate-400 max-w-2xl">Dirancang untuk perusahaan penyewaan dan pengelola alat berat di Indonesia.</p>
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

      {/* Cara kerja */}
      <section id="cara-kerja" className="scroll-mt-16">
        <div className="max-w-6xl mx-auto px-5 py-20">
          <h2 className="text-3xl font-bold tracking-tight">Cara kerjanya</h2>
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

      {/* Peran */}
      <section id="peran" className="bg-slate-900/60 border-y border-slate-800 scroll-mt-16">
        <div className="max-w-6xl mx-auto px-5 py-20">
          <h2 className="text-3xl font-bold tracking-tight flex items-center gap-3"><Users className="w-7 h-7 text-amber-400" /> Setiap orang melihat yang relevan</h2>
          <p className="mt-3 text-slate-400 max-w-2xl">Menu dan data menyesuaikan peran, sehingga tim bekerja lebih fokus dan informasi sensitif tetap terlindungi.</p>
          <div className="mt-8 flex flex-wrap gap-2.5">
            {roles.map((r) => (
              <span key={r} className="px-3.5 py-2 rounded-full border border-slate-700 bg-slate-900 text-sm text-slate-200">{ROLE_LABELS[r]}</span>
            ))}
          </div>
        </div>
      </section>

      {/* Keamanan */}
      <section id="keamanan" className="scroll-mt-16">
        <div className="max-w-6xl mx-auto px-5 py-20 grid md:grid-cols-2 gap-10 items-center">
          <div>
            <h2 className="text-3xl font-bold tracking-tight flex items-center gap-3"><History className="w-7 h-7 text-amber-400" /> Aman dan bisa diaudit</h2>
            <p className="mt-3 text-slate-400">Data operasional dan keuangan Anda dijaga dengan kontrol akses dan jejak aktivitas yang jelas.</p>
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
          <h2 className="text-3xl font-extrabold tracking-tight">Siap mulai bekerja?</h2>
          <p className="mt-2 text-slate-800">Masuk dengan akun perusahaan Anda.</p>
          <button onClick={onLogin} className="mt-6 inline-flex items-center gap-2 px-6 py-3 rounded-lg bg-slate-900 text-white font-semibold hover:bg-slate-800 cursor-pointer">
            Masuk ke Sistem <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </section>

      <footer className="border-t border-slate-800 px-5 py-8 text-center text-xs text-slate-500">
        &copy; {new Date().getFullYear()} Apex Industrial Solutions &middot; Enterprise Asset Management System
      </footer>
    </div>
  );
};
