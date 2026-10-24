import { buildXlsx, htmlToRows, type Cell } from './xlsx.ts';

/** Nama file aman untuk semua OS. */
export const safeFilename = (name: string) =>
  name.replace(/[\\/:*?"<>|\u0000-\u001F]/g, '_').replace(/\s+/g, '_').slice(0, 150) || 'download';

/**
 * Menyimpan Blob sebagai file. Perbaikan atas kode lama:
 *  - anchor DIPASANG ke DOM sebelum click (Firefox/Safari butuh ini),
 *  - URL TIDAK di-revoke seketika (revoke sinkron membatalkan unduhan → file kosong/gagal),
 *  - fallback membuka tab baru bila browser tidak mendukung atribut download.
 */
export function saveBlob(blob: Blob, filename: string): void {
  const name = safeFilename(filename);
  const url = URL.createObjectURL(blob);
  const supportsDownload = 'download' in HTMLAnchorElement.prototype;
  if (!supportsDownload) {
    window.open(url, '_blank');
    setTimeout(() => URL.revokeObjectURL(url), 60_000);
    return;
  }
  const a = document.createElement('a');
  a.href = url;
  a.download = name;
  a.rel = 'noopener';
  a.style.display = 'none';
  document.body.appendChild(a);
  a.click();
  setTimeout(() => {
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }, 10_000);
}

// ---------- CSV ----------
const csvCell = (v: unknown, sep: string): string => {
  let s = v === null || v === undefined ? '' : String(v);
  // Cegah "CSV/formula injection" bila file dibuka di Excel.
  if (/^[=+\-@\t\r]/.test(s) && !/^-?\d+([.,]\d+)?$/.test(s)) s = `'${s}`;
  if (s.includes('"') || s.includes(sep) || /[\r\n]/.test(s)) s = `"${s.replace(/"/g, '""')}"`;
  return s;
};

/**
 * CSV yang terbuka benar di Excel (termasuk Excel berlokalisasi Indonesia):
 *  - BOM UTF-8 agar huruf/simbol tidak rusak,
 *  - petunjuk "sep=;" agar kolom terpisah apa pun pengaturan regional.
 */
export function exportCsv(filename: string, headers: string[], rows: unknown[][]): void {
  const sep = ';';
  const lines = [`sep=${sep}`, headers.map((h) => csvCell(h, sep)).join(sep), ...rows.map((r) => r.map((c) => csvCell(c, sep)).join(sep))];
  const blob = new Blob(['\uFEFF' + lines.join('\r\n')], { type: 'text/csv;charset=utf-8' });
  saveBlob(blob, filename.endsWith('.csv') ? filename : `${filename}.csv`);
}

// ---------- Excel (.xlsx asli) ----------
export function exportXlsx(filename: string, rows: Cell[][], sheetName?: string): void {
  const bytes = buildXlsx(rows, sheetName);
  const blob = new Blob([bytes as BlobPart], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
  saveBlob(blob, filename.replace(/\.xls$/i, '') .replace(/\.xlsx$/i, '') + '.xlsx');
}

/** Untuk laporan yang dibangun sebagai HTML: dikonversi menjadi file .xlsx asli. */
export function exportExcelFromHtml(html: string, filename: string, sheetName?: string): void {
  exportXlsx(filename, htmlToRows(html), sheetName);
}

export function exportJson(filename: string, data: unknown): void {
  saveBlob(new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' }), filename);
}
