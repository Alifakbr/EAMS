/**
 * Penulis .xlsx minimal tanpa dependensi (ZIP "store" + SpreadsheetML).
 * Menghasilkan file Excel ASLI yang terbuka di Excel, LibreOffice, Google Sheets,
 * dan aplikasi spreadsheet di HP — berbeda dengan HTML yang dinamai ".xls".
 */
export type Cell = string | number | null | undefined | { v: string | number | null; bold?: boolean };

const enc = new TextEncoder();

// ---------- CRC32 ----------
let CRC_TABLE: Uint32Array | null = null;
function crc32(data: Uint8Array): number {
  if (!CRC_TABLE) {
    CRC_TABLE = new Uint32Array(256);
    for (let n = 0; n < 256; n++) {
      let c = n;
      for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
      CRC_TABLE[n] = c >>> 0;
    }
  }
  let crc = 0xffffffff;
  for (let i = 0; i < data.length; i++) crc = CRC_TABLE[(crc ^ data[i]) & 0xff] ^ (crc >>> 8);
  return (crc ^ 0xffffffff) >>> 0;
}

// ---------- ZIP (tanpa kompresi) ----------
function zip(files: { name: string; data: Uint8Array }[]): Uint8Array {
  const chunks: Uint8Array[] = [];
  const central: Uint8Array[] = [];
  let offset = 0;
  const u16 = (n: number) => new Uint8Array([n & 255, (n >>> 8) & 255]);
  const u32 = (n: number) => new Uint8Array([n & 255, (n >>> 8) & 255, (n >>> 16) & 255, (n >>> 24) & 255]);
  const cat = (...a: Uint8Array[]) => {
    const out = new Uint8Array(a.reduce((s, x) => s + x.length, 0));
    let o = 0;
    for (const x of a) { out.set(x, o); o += x.length; }
    return out;
  };
  const dosTime = 0, dosDate = (1 << 5) | 1 | ((2026 - 1980) << 9);

  for (const f of files) {
    const name = enc.encode(f.name);
    const crc = crc32(f.data);
    const local = cat(
      u32(0x04034b50), u16(20), u16(0x0800), u16(0), u16(dosTime), u16(dosDate),
      u32(crc), u32(f.data.length), u32(f.data.length), u16(name.length), u16(0), name, f.data,
    );
    chunks.push(local);
    central.push(cat(
      u32(0x02014b50), u16(20), u16(20), u16(0x0800), u16(0), u16(dosTime), u16(dosDate),
      u32(crc), u32(f.data.length), u32(f.data.length), u16(name.length), u16(0), u16(0),
      u16(0), u16(0), u32(0), u32(offset), name,
    ));
    offset += local.length;
  }
  const centralBytes = cat(...central);
  const end = cat(
    u32(0x06054b50), u16(0), u16(0), u16(files.length), u16(files.length),
    u32(centralBytes.length), u32(offset), u16(0),
  );
  return cat(...chunks, centralBytes, end);
}

// ---------- SpreadsheetML ----------
const xmlEsc = (s: string) =>
  s.replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F]/g, '')
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

function colName(i: number): string {
  let s = '';
  for (let n = i + 1; n > 0; n = Math.floor((n - 1) / 26)) s = String.fromCharCode(65 + ((n - 1) % 26)) + s;
  return s;
}

const normalize = (c: Cell): { v: string | number | null; bold: boolean } => {
  if (c !== null && typeof c === 'object') return { v: c.v ?? null, bold: !!c.bold };
  return { v: c ?? null, bold: false };
};

<<<<<<< HEAD
export function buildXlsx(rows: Cell[][], sheetName = 'Report'): Uint8Array {
=======
export function buildXlsx(rows: Cell[][], sheetName = 'Laporan'): Uint8Array {
>>>>>>> 2e64693bfb1fbb36a821a7a7248b397ac785b443
  const widths: number[] = [];
  const rowXml = rows.map((row, r) => {
    const cells = row.map((raw, c) => {
      const { v, bold } = normalize(raw);
      if (v === null || v === '') return '';
      const ref = `${colName(c)}${r + 1}`;
      const style = bold ? ' s="1"' : '';
      const len = String(v).length;
      widths[c] = Math.max(widths[c] || 8, Math.min(60, len + 2));
      if (typeof v === 'number' && Number.isFinite(v)) return `<c r="${ref}"${style}><v>${v}</v></c>`;
      return `<c r="${ref}" t="inlineStr"${style}><is><t xml:space="preserve">${xmlEsc(String(v))}</t></is></c>`;
    }).join('');
    return `<row r="${r + 1}">${cells}</row>`;
  }).join('');

  const cols = widths.length
    ? `<cols>${widths.map((w, i) => `<col min="${i + 1}" max="${i + 1}" width="${w}" customWidth="1"/>`).join('')}</cols>`
    : '';
<<<<<<< HEAD
  const safeName = xmlEsc(sheetName.replace(/[\\/?*[\]:]/g, ' ').slice(0, 31) || 'Report');
=======
  const safeName = xmlEsc(sheetName.replace(/[\\/?*[\]:]/g, ' ').slice(0, 31) || 'Laporan');
>>>>>>> 2e64693bfb1fbb36a821a7a7248b397ac785b443

  const files = [
    { name: '[Content_Types].xml', text: `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/><Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/><Override PartName="/xl/worksheets/sheet1.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/><Override PartName="/xl/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.styles+xml"/></Types>` },
    { name: '_rels/.rels', text: `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="xl/workbook.xml"/></Relationships>` },
    { name: 'xl/workbook.xml', text: `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships"><sheets><sheet name="${safeName}" sheetId="1" r:id="rId1"/></sheets></workbook>` },
    { name: 'xl/_rels/workbook.xml.rels', text: `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet1.xml"/><Relationship Id="rId2" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/></Relationships>` },
    { name: 'xl/styles.xml', text: `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><styleSheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main"><fonts count="2"><font><sz val="11"/><name val="Calibri"/></font><font><b/><sz val="11"/><name val="Calibri"/></font></fonts><fills count="2"><fill><patternFill patternType="none"/></fill><fill><patternFill patternType="gray125"/></fill></fills><borders count="1"><border><left/><right/><top/><bottom/><diagonal/></border></borders><cellStyleXfs count="1"><xf numFmtId="0" fontId="0" fillId="0" borderId="0"/></cellStyleXfs><cellXfs count="2"><xf numFmtId="0" fontId="0" fillId="0" borderId="0" xfId="0"/><xf numFmtId="0" fontId="1" fillId="0" borderId="0" xfId="0" applyFont="1"/></cellXfs><cellStyles count="1"><cellStyle name="Normal" xfId="0" builtinId="0"/></cellStyles></styleSheet>` },
    { name: 'xl/worksheets/sheet1.xml', text: `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">${cols}<sheetData>${rowXml}</sheetData></worksheet>` },
  ].map((f) => ({ name: f.name, data: enc.encode(f.text) }));

  return zip(files);
}

// ---------- HTML → baris sel (untuk laporan lama yang dibangun sebagai HTML) ----------
const NUM_RE = /^-?(0|[1-9]\d*)(\.\d+)?$/;
const toCell = (text: string, bold = false): Cell => {
  const t = text.replace(/\s+/g, ' ').trim();
  const v: string | number = NUM_RE.test(t) && t.length < 16 ? Number(t) : t;
  return bold ? { v, bold } : v;
};

export function htmlToRows(html: string): Cell[][] {
  const doc = new DOMParser().parseFromString(html, 'text/html');
  const rows: Cell[][] = [];
  const walk = (el: Element) => {
    for (const child of Array.from(el.children)) {
      const tag = child.tagName.toLowerCase();
      if (tag === 'table') {
        child.querySelectorAll('tr').forEach((tr) => {
          const out: Cell[] = [];
          tr.querySelectorAll(':scope > th, :scope > td').forEach((td) => {
            const isHead = td.tagName.toLowerCase() === 'th' || /font-weight:\s*bold/i.test(tr.getAttribute('style') || '');
            out.push(toCell(td.textContent || '', isHead));
            const span = parseInt(td.getAttribute('colspan') || '1', 10);
            for (let i = 1; i < span; i++) out.push(null);
          });
          if (out.length) rows.push(out);
        });
        rows.push([]);
      } else if (/^h[1-6]$/.test(tag)) {
        rows.push([toCell(child.textContent || '', true)]);
      } else if (tag === 'p' || tag === 'span') {
        const t = (child.textContent || '').trim();
        if (t) rows.push([toCell(t)]);
      } else if (['style', 'script', 'head', 'meta', 'title'].includes(tag)) {
        continue;
      } else {
        walk(child);
      }
    }
  };
  walk(doc.body);
  return rows;
}
