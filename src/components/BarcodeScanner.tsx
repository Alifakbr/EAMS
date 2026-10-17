import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Camera, CameraOff, FlipHorizontal, Flashlight, ImagePlus, X, AlertCircle, Loader2 } from 'lucide-react';

/**
 * Scanner QR/Barcode memakai kamera ASLI perangkat.
 *
 * - Memakai BarcodeDetector bawaan browser bila ada (cepat), jika tidak memakai ZXing (dimuat lazy).
 * - Kamera belakang jadi default di HP; bisa ganti kamera & nyalakan senter bila didukung.
 * - Jika kamera tidak bisa dipakai (HTTP non-aman, izin ditolak, tidak ada kamera), tersedia
 *   cadangan "Foto Barcode" (membuka kamera/galeri lewat input file) + input manual di halaman induk.
 * - Semua stream dihentikan saat ditutup / unmount (lampu kamera mati).
 */

interface BarcodeScannerProps {
  onDetected: (code: string) => void;
  onClose: () => void;
  hint?: string;
}

/** Ambil tag aset dari isi QR (mis. URL atau teks panjang). */
export function normalizeScan(raw: string): string {
  const text = raw.trim();
  const m = /AST-[A-Z0-9-]+/i.exec(text);
  if (m) return m[0].toUpperCase();
  try {
    const u = new URL(text);
    const last = u.pathname.split('/').filter(Boolean).pop();
    if (last) return decodeURIComponent(last);
  } catch { /* bukan URL */ }
  return text;
}

type Detector = (src: CanvasImageSource, canvas: HTMLCanvasElement) => Promise<string | null>;

async function createDetector(): Promise<Detector> {
  const BD = (window as any).BarcodeDetector;
  if (BD) {
    try {
      const wanted = ['qr_code', 'code_128', 'code_39', 'ean_13', 'ean_8', 'upc_a', 'itf', 'data_matrix'];
      const supported: string[] = await BD.getSupportedFormats();
      const formats = wanted.filter((f) => supported.includes(f));
      if (formats.length) {
        const det = new BD({ formats });
        return async (src) => {
          const res = await det.detect(src);
          return res?.[0]?.rawValue ?? null;
        };
      }
    } catch { /* jatuh ke ZXing */ }
  }
  const { BrowserMultiFormatReader } = await import('@zxing/browser');
  const reader = new BrowserMultiFormatReader();
  return async (src, canvas) => {
    const w = (src as any).videoWidth || (src as any).width;
    const h = (src as any).videoHeight || (src as any).height;
    if (!w || !h) return null;
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    if (!ctx) return null;
    ctx.drawImage(src, 0, 0, w, h);
    try {
      return reader.decodeFromCanvas(canvas).getText();
    } catch {
      return null; // NotFoundException = belum ada kode di frame
    }
  };
}

function describeCameraError(err: any): string {
  const name = err?.name || '';
  if (!window.isSecureContext) {
    return 'Kamera hanya dapat dipakai lewat koneksi aman (HTTPS) atau localhost. Buka aplikasi dengan https:// atau gunakan tombol "Foto Barcode" di bawah.';
  }
  if (name === 'NotAllowedError' || name === 'SecurityError') {
    return 'Izin kamera ditolak. Ketuk ikon gembok/kamera di bilah alamat browser → izinkan Kamera → muat ulang halaman. Atau gunakan "Foto Barcode".';
  }
  if (name === 'NotFoundError' || name === 'OverconstrainedError') {
    return 'Kamera tidak ditemukan di perangkat ini. Gunakan "Foto Barcode" atau ketik kode secara manual.';
  }
  if (name === 'NotReadableError' || name === 'AbortError') {
    return 'Kamera sedang dipakai aplikasi lain. Tutup aplikasi/tab yang memakai kamera lalu coba lagi.';
  }
  return `Kamera tidak dapat dibuka (${name || 'error tidak dikenal'}). Gunakan "Foto Barcode" atau ketik kode secara manual.`;
}

export const BarcodeScanner: React.FC<BarcodeScannerProps> = ({ onDetected, onClose, hint }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const detectorRef = useRef<Detector | null>(null);
  const lastHitRef = useRef<{ code: string; at: number }>({ code: '', at: 0 });
  const onDetectedRef = useRef(onDetected);
  onDetectedRef.current = onDetected;

  const [status, setStatus] = useState<'starting' | 'scanning' | 'error'>('starting');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [devices, setDevices] = useState<MediaDeviceInfo[]>([]);
  const [deviceId, setDeviceId] = useState<string | undefined>(undefined);
  const [torchSupported, setTorchSupported] = useState(false);
  const [torchOn, setTorchOn] = useState(false);
  const [photoBusy, setPhotoBusy] = useState(false);
  const [photoMsg, setPhotoMsg] = useState<string | null>(null);

  if (!canvasRef.current && typeof document !== 'undefined') {
    canvasRef.current = document.createElement('canvas');
  }

  const stopStream = useCallback(() => {
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
    if (videoRef.current) videoRef.current.srcObject = null;
  }, []);

  const handleHit = useCallback((raw: string) => {
    const code = normalizeScan(raw);
    const now = Date.now();
    if (!code || (lastHitRef.current.code === code && now - lastHitRef.current.at < 2500)) return false;
    lastHitRef.current = { code, at: now };
    try { navigator.vibrate?.(80); } catch { /* tidak didukung */ }
    onDetectedRef.current(code);
    return true;
  }, []);

  // Mulai kamera
  useEffect(() => {
    let cancelled = false;
    let rafId = 0;
    let timer: number | undefined;

    const start = async () => {
      setStatus('starting');
      setErrorMsg(null);
      setTorchOn(false);

      if (!navigator.mediaDevices?.getUserMedia) {
        setStatus('error');
        setErrorMsg(describeCameraError({ name: 'NotSupported' }));
        return;
      }

      try {
        const base: MediaTrackConstraints = deviceId
          ? { deviceId: { exact: deviceId } }
          : { facingMode: { ideal: 'environment' } };
        let stream: MediaStream;
        try {
          stream = await navigator.mediaDevices.getUserMedia({
            video: { ...base, width: { ideal: 1280 }, height: { ideal: 720 } },
            audio: false,
          });
        } catch (e: any) {
          if (e?.name === 'OverconstrainedError') {
            stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: false });
          } else {
            throw e;
          }
        }
        if (cancelled) { stream.getTracks().forEach((t) => t.stop()); return; }
        streamRef.current = stream;

        const video = videoRef.current;
        if (!video) return;
        video.srcObject = stream;
        video.setAttribute('playsinline', 'true'); // wajib agar iOS tidak memaksa fullscreen
        video.muted = true;
        await video.play();

        // Daftar kamera (label baru tersedia setelah izin diberikan)
        try {
          const all = await navigator.mediaDevices.enumerateDevices();
          if (!cancelled) setDevices(all.filter((d) => d.kind === 'videoinput'));
        } catch { /* abaikan */ }

        const track = stream.getVideoTracks()[0];
        const caps: any = track?.getCapabilities?.() || {};
        if (!cancelled) setTorchSupported(!!caps.torch);

        if (!detectorRef.current) detectorRef.current = await createDetector();
        if (cancelled) return;
        setStatus('scanning');

        let busy = false;
        const tick = async () => {
          if (cancelled) return;
          if (!busy && video.readyState >= 2) {
            busy = true;
            try {
              const code = await detectorRef.current!(video, canvasRef.current!);
              if (code) handleHit(code);
            } catch { /* frame gagal dibaca, lanjut */ } finally {
              busy = false;
            }
          }
          timer = window.setTimeout(() => { rafId = requestAnimationFrame(tick); }, 140);
        };
        tick();
      } catch (err: any) {
        if (cancelled) return;
        stopStream();
        setStatus('error');
        setErrorMsg(describeCameraError(err));
      }
    };

    start();
    return () => {
      cancelled = true;
      cancelAnimationFrame(rafId);
      if (timer) clearTimeout(timer);
      stopStream();
    };
  }, [deviceId, handleHit, stopStream]);

  const toggleTorch = async () => {
    const track = streamRef.current?.getVideoTracks()[0];
    if (!track) return;
    try {
      await track.applyConstraints({ advanced: [{ torch: !torchOn } as any] });
      setTorchOn(!torchOn);
    } catch {
      setTorchSupported(false);
    }
  };

  const switchCamera = () => {
    if (devices.length < 2) return;
    const currentId = streamRef.current?.getVideoTracks()[0]?.getSettings().deviceId;
    const idx = devices.findIndex((d) => d.deviceId === currentId);
    setDeviceId(devices[(idx + 1) % devices.length].deviceId);
  };

  // Cadangan: foto barcode (jalan juga di HTTP / saat izin kamera ditolak)
  const handlePhoto = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    setPhotoBusy(true);
    setPhotoMsg(null);
    try {
      if (!detectorRef.current) detectorRef.current = await createDetector();
      const bmp = await createImageBitmap(file);
      const code = await detectorRef.current(bmp, canvasRef.current!);
      bmp.close?.();
      if (code) handleHit(code);
      else setPhotoMsg('Barcode tidak terbaca pada foto. Dekatkan kamera, pastikan terang & tidak blur, lalu coba lagi.');
    } catch {
      setPhotoMsg('Foto tidak dapat diproses. Coba lagi atau ketik kode secara manual.');
    } finally {
      setPhotoBusy(false);
    }
  };

  return (
    <div className="bg-slate-950 rounded-lg p-3 sm:p-4 text-white space-y-3 border border-indigo-500/60">
      <div className="relative mx-auto max-w-md aspect-[4/3] rounded-lg overflow-hidden bg-black">
        <video ref={videoRef} className="absolute inset-0 w-full h-full object-cover" playsInline muted autoPlay />

        {status === 'scanning' && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div className="w-3/4 aspect-square max-h-[80%] border-2 border-emerald-400 rounded-lg relative shadow-[0_0_0_9999px_rgba(0,0,0,0.45)]">
              <div className="absolute inset-x-0 h-0.5 bg-emerald-400/90 animate-pulse top-1/2" />
            </div>
          </div>
        )}

        {status === 'starting' && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 text-slate-300 text-xs">
            <Loader2 className="w-6 h-6 animate-spin" />
            Membuka kamera… izinkan akses kamera bila diminta browser.
          </div>
        )}

        {status === 'error' && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 p-4 text-center text-xs text-amber-200 bg-slate-900">
            <CameraOff className="w-7 h-7 text-amber-400" />
            <span>{errorMsg}</span>
          </div>
        )}

        <div className="absolute top-2 right-2 flex items-center gap-1.5">
          {torchSupported && status === 'scanning' && (
            <button type="button" onClick={toggleTorch} title="Senter"
              className={`p-2 rounded-full cursor-pointer ${torchOn ? 'bg-amber-400 text-slate-900' : 'bg-black/55 text-white'}`}>
              <Flashlight className="w-4 h-4" />
            </button>
          )}
          {devices.length > 1 && (
            <button type="button" onClick={switchCamera} title="Ganti kamera"
              className="p-2 rounded-full bg-black/55 text-white cursor-pointer">
              <FlipHorizontal className="w-4 h-4" />
            </button>
          )}
          <button type="button" onClick={onClose} title="Tutup kamera"
            className="p-2 rounded-full bg-black/55 text-white cursor-pointer">
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      <p className="text-center text-[11px] text-emerald-300 font-mono">
        {status === 'scanning' ? (hint || 'Arahkan kamera ke QR / Barcode pada alat') : ' '}
      </p>

      <div className="flex flex-col sm:flex-row items-center justify-center gap-2">
        <label className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded bg-slate-800 hover:bg-slate-700 text-[11px] font-semibold cursor-pointer">
          {photoBusy ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <ImagePlus className="w-3.5 h-3.5" />}
          Foto Barcode (kamera / galeri)
          <input type="file" accept="image/*" capture="environment" onChange={handlePhoto} className="hidden" />
        </label>
        <button type="button" onClick={onClose}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded bg-rose-600/80 hover:bg-rose-600 text-[11px] font-semibold cursor-pointer">
          <Camera className="w-3.5 h-3.5" /> Tutup Kamera
        </button>
      </div>

      {photoMsg && (
        <div className="flex items-start gap-1.5 text-[11px] text-amber-200 bg-amber-950/40 border border-amber-800/50 rounded p-2">
          <AlertCircle className="w-3.5 h-3.5 shrink-0 mt-0.5" /> {photoMsg}
        </div>
      )}
    </div>
  );
};
