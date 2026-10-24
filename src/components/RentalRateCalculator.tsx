import React, { useMemo, useState } from 'react';
import { Calculator, X, CalendarDays } from 'lucide-react';
import { formatRupiahAmount } from '../shared/currency.tsx';

type Basis = 'MONTHLY' | 'DAILY' | 'HOURLY' | 'LUMPSUM';
type Props = { onClose: () => void; onApplyRate: (rate: number, model: 'REGULAR' | 'LUMPSUM') => void };
const money = (n: number) => formatRupiahAmount(Number.isFinite(n) ? n : 0);
const field = 'w-full min-w-0 rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500';
const label = 'mb-1 block text-xs font-semibold text-slate-600';

export const RentalRateCalculator: React.FC<Props> = ({ onClose, onApplyRate }) => {
  const [monthly, setMonthly] = useState('100000000');
  const [days, setDays] = useState('30');
  const [hours, setHours] = useState('240');
  const [hoursPerDay, setHoursPerDay] = useState('8');
  const [months, setMonths] = useState('3');
  const [quantity, setQuantity] = useState('1');
  const [mMonthly, setMMonthly] = useState('1');
  const [mDaily, setMDaily] = useState('1');
  const [mHourly, setMHourly] = useState('1.2');
  const [mSaturday, setMSaturday] = useState('1');
  const [mSunday, setMSunday] = useState('1.5');
  const [mLumpsum, setMLumpsum] = useState('1.1');
  const [start, setStart] = useState(new Date().toISOString().slice(0, 10));
  const [end, setEnd] = useState(new Date(Date.now() + 89 * 86400000).toISOString().slice(0, 10));
  const [saturdayWorks, setSaturdayWorks] = useState(false);
  const [sundayWorks, setSundayWorks] = useState(false);
  const [holidaysText, setHolidaysText] = useState('');
  const [basis, setBasis] = useState<Basis>('MONTHLY');
  const [priceType, setPriceType] = useState<'STANDARD' | 'REFERENCE'>('REFERENCE');
  const [error, setError] = useState('');

  const v = {
    monthly: Number(monthly), days: Number(days), hours: Number(hours), hoursPerDay: Number(hoursPerDay),
    months: Number(months), quantity: Number(quantity), mMonthly: Number(mMonthly), mDaily: Number(mDaily),
    mHourly: Number(mHourly), mSaturday: Number(mSaturday), mSunday: Number(mSunday), mLumpsum: Number(mLumpsum)
  };
  const holidays = holidaysText.split(/[,\n]/).map(x => x.trim()).filter(Boolean);
  const calendar = useMemo(() => {
    const zero = { total: 0, weekdays: 0, saturdays: 0, sundays: 0, holidayCount: 0, billable: 0 };
    if (!start || !end) return zero;
    const a = new Date(start + 'T12:00:00'), b = new Date(end + 'T12:00:00');
    if (!Number.isFinite(a.getTime()) || !Number.isFinite(b.getTime()) || b < a) return zero;
    let total=0, weekdays=0, saturdays=0, sundays=0, holidayCount=0, billable=0;
    const holidaySet = new Set(holidays);
    for (const h of holidays) if (!/^\d{4}-\d{2}-\d{2}$/.test(h) || Number.isNaN(new Date(h+'T12:00:00').getTime())) return zero;
    for (const d = new Date(a); d <= b; d.setDate(d.getDate()+1)) {
      total++;
      const key = `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
      if (holidaySet.has(key)) { holidayCount++; continue; }
      const day = d.getDay();
      if (day === 0) { sundays++; if (sundayWorks) billable++; }
      else if (day === 6) { saturdays++; if (saturdayWorks) billable++; }
      else { weekdays++; billable++; }
    }
    return { total, weekdays, saturdays, sundays, holidayCount, billable };
  }, [start, end, saturdayWorks, sundayWorks, holidaysText]);

  const standard = { monthly: v.monthly, daily: v.monthly/v.days, hourly: v.monthly/v.hours, lumpsum: v.monthly*v.months };
  const reference = {
    monthly: standard.monthly*v.mMonthly, daily: standard.daily*v.mDaily, hourly: standard.hourly*v.mHourly,
    saturday: standard.hourly*v.mSaturday, sunday: standard.hourly*v.mSunday, lumpsum: standard.lumpsum*v.mLumpsum
  };
  const values = Object.values(v);
  let validation = '';
  if (values.some(x => !Number.isFinite(x))) validation = 'Semua input harus berupa angka valid.';
  else if (v.monthly < 0 || v.days <= 0 || v.hours <= 0 || v.hoursPerDay <= 0 || v.months < 0 || v.quantity <= 0) validation = 'Nilai kontrak, quantity, dan denominator tidak valid.';
  else if ([v.mMonthly,v.mDaily,v.mHourly,v.mSaturday,v.mSunday,v.mLumpsum].some(x => x < 0)) validation = 'Multiplier tidak boleh negatif.';
  else if (!calendar.total) validation = 'Periode atau tanggal hari libur tidak valid.';
  const selected = (priceType === 'STANDARD'
    ? { MONTHLY: standard.monthly, DAILY: standard.daily, HOURLY: standard.hourly, LUMPSUM: standard.lumpsum }
    : { MONTHLY: reference.monthly, DAILY: reference.daily, HOURLY: reference.hourly, LUMPSUM: reference.lumpsum })[basis];

  const apply = () => {
    if (validation) { setError(validation); return; }
    setError('');
    onApplyRate(selected, basis === 'LUMPSUM' ? 'LUMPSUM' : 'REGULAR');
    onClose();
  };

  return <div className="fixed inset-0 z-[120] overflow-y-auto bg-slate-950/60 p-2 sm:p-5" role="dialog" aria-modal="true" aria-labelledby="rate-calc-title">
    <div className="mx-auto my-2 w-full max-w-6xl overflow-hidden rounded-xl bg-slate-50 shadow-2xl">
      <header className="flex items-center justify-between gap-3 bg-slate-900 px-4 py-4 text-white sm:px-6">
        <div className="flex min-w-0 items-center gap-3"><Calculator className="h-6 w-6 shrink-0 text-indigo-300"/><div className="min-w-0"><h2 id="rate-calc-title" className="text-base font-bold sm:text-lg">Equipment Rental Rate Calculator</h2><p className="text-xs text-slate-300">Standard Rate · Reference Rate · Contract Calendar</p></div></div>
        <button type="button" onClick={onClose} aria-label="Close calculator" className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-lg hover:bg-white/10"><X className="h-5 w-5"/></button>
      </header>
      <div className="grid min-w-0 grid-cols-1 gap-3 p-3 sm:gap-4 sm:p-5 lg:grid-cols-3">
        <section className="min-w-0 rounded-xl border bg-white p-3 sm:p-4">
          <h3 className="mb-3 text-sm font-bold">1. Contract Basis</h3>
          <div className="grid grid-cols-1 gap-3 min-[420px]:grid-cols-2">
            <label><span className={label}>Monthly contract value (Rp)</span><input className={field} type="number" min="0" value={monthly} onChange={e=>setMonthly(e.target.value)}/></label>
            <label><span className={label}>Contract months</span><input className={field} type="number" min="0" step="0.5" value={months} onChange={e=>setMonths(e.target.value)}/></label>
            <label><span className={label}>Rate days / month</span><input className={field} type="number" min="1" value={days} onChange={e=>setDays(e.target.value)}/></label>
            <label><span className={label}>Contract hours / month</span><input className={field} type="number" min="1" value={hours} onChange={e=>setHours(e.target.value)}/></label>
            <label><span className={label}>Working hours / day</span><input className={field} type="number" min="0.1" step="0.5" value={hoursPerDay} onChange={e=>setHoursPerDay(e.target.value)}/></label>
            <label><span className={label}>Quantity (unit)</span><input className={field} type="number" min="1" value={quantity} onChange={e=>setQuantity(e.target.value)}/></label>
          </div>
          <p className="mt-3 text-xs leading-relaxed text-slate-500">Daily = monthly ÷ rate days. Hourly = monthly ÷ contract hours. Lumpsum = monthly × contract months. Rate tetap per unit.</p>
        </section>
        <section className="min-w-0 rounded-xl border bg-white p-3 sm:p-4">
          <h3 className="mb-3 text-sm font-bold">2. Reference Multipliers</h3>
          <div className="grid grid-cols-1 gap-3 min-[420px]:grid-cols-2">
            <label><span className={label}>Monthly</span><input className={field} type="number" min="0" step=".05" value={mMonthly} onChange={e=>setMMonthly(e.target.value)}/></label>
            <label><span className={label}>Daily</span><input className={field} type="number" min="0" step=".05" value={mDaily} onChange={e=>setMDaily(e.target.value)}/></label>
            <label><span className={label}>Hourly</span><input className={field} type="number" min="0" step=".05" value={mHourly} onChange={e=>setMHourly(e.target.value)}/></label>
            <label><span className={label}>Saturday</span><input className={field} type="number" min="0" step=".05" value={mSaturday} onChange={e=>setMSaturday(e.target.value)}/></label>
            <label><span className={label}>Sunday</span><input className={field} type="number" min="0" step=".05" value={mSunday} onChange={e=>setMSunday(e.target.value)}/></label>
            <label><span className={label}>Lumpsum</span><input className={field} type="number" min="0" step=".05" value={mLumpsum} onChange={e=>setMLumpsum(e.target.value)}/></label>
          </div>
          <p className="mt-3 text-xs leading-relaxed text-slate-500">1 = 100%; 1,5 = 150%. Multiplier di sini belum tersimpan sebagai pengaturan database.</p>
        </section>
        <section className="min-w-0 rounded-xl border bg-white p-3 sm:p-4">
          <h3 className="mb-3 flex items-center gap-2 text-sm font-bold"><CalendarDays className="h-4 w-4"/>3. Contract Calendar</h3>
          <div className="grid grid-cols-1 gap-3 min-[420px]:grid-cols-2">
            <label><span className={label}>Start date</span><input className={field} type="date" value={start} onChange={e=>setStart(e.target.value)}/></label>
            <label><span className={label}>End date</span><input className={field} type="date" value={end} onChange={e=>setEnd(e.target.value)}/></label>
          </div>
          <div className="mt-3 space-y-2 text-sm"><label className="flex items-center gap-2"><input type="checkbox" checked={saturdayWorks} onChange={e=>setSaturdayWorks(e.target.checked)}/>Sabtu hari kerja</label><label className="flex items-center gap-2"><input type="checkbox" checked={sundayWorks} onChange={e=>setSundayWorks(e.target.checked)}/>Minggu hari kerja</label></div>
          <label className="mt-3 block"><span className={label}>Hari libur (YYYY-MM-DD)</span><textarea rows={2} className={field} value={holidaysText} onChange={e=>setHolidaysText(e.target.value)} placeholder="2026-12-25, 2027-01-01"/></label>
          <div className="mt-3 grid grid-cols-2 gap-2 text-center text-xs sm:grid-cols-3">
            {[[calendar.weekdays,'Weekdays'],[calendar.saturdays,'Saturday'],[calendar.sundays,'Sunday'],[calendar.holidayCount,'Holiday dates'],[calendar.billable,'Billable days'],[calendar.billable*v.hoursPerDay,'Scheduled hours']].map(([value,name])=><div key={String(name)} className="rounded-lg bg-slate-100 p-2"><b className="block text-base">{value}</b>{name}</div>)}
          </div>
        </section>
        <section className="min-w-0 rounded-xl border bg-white p-3 sm:col-span-2 sm:p-4 lg:col-span-2">
          <h3 className="mb-3 text-sm font-bold">4. Rate Results (per unit)</h3>
          <div className="grid grid-cols-1 gap-3 min-[420px]:grid-cols-2 lg:grid-cols-4">
            {([['Monthly',standard.monthly,reference.monthly],['Daily',standard.daily,reference.daily],['Hourly',standard.hourly,reference.hourly],['Lumpsum total',standard.lumpsum,reference.lumpsum]] as [string,number,number][]).map(([name,std,ref])=><div key={name} className="min-w-0 rounded-xl border p-3"><div className="text-xs font-semibold text-slate-500">{name}</div><div className="mt-2 break-words text-sm font-bold">{money(std)}</div><div className="mt-1 break-words text-xs text-indigo-700">Reference: {money(ref)}</div></div>)}
          </div>
          <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2"><div className="rounded-lg bg-amber-50 p-3"><span className="text-xs font-semibold text-amber-800">Reference Saturday hourly</span><div className="mt-1 break-words font-bold">{money(reference.saturday)}</div></div><div className="rounded-lg bg-rose-50 p-3"><span className="text-xs font-semibold text-rose-800">Reference Sunday hourly</span><div className="mt-1 break-words font-bold">{money(reference.sunday)}</div></div></div>
        </section>
        <section className="min-w-0 rounded-xl border border-indigo-200 bg-indigo-50/70 p-3 sm:p-4">
          <h3 className="mb-3 text-sm font-bold">5. Apply to Quotation</h3>
          <label><span className={label}>Rate basis</span><select className={field} value={basis} onChange={e=>setBasis(e.target.value as Basis)}><option value="MONTHLY">Monthly</option><option value="DAILY">Daily</option><option value="HOURLY">Hourly</option><option value="LUMPSUM">Lumpsum total</option></select></label>
          <label className="mt-3 block"><span className={label}>Price used</span><select className={field} value={priceType} onChange={e=>setPriceType(e.target.value as 'STANDARD'|'REFERENCE')}><option value="STANDARD">Standard rate</option><option value="REFERENCE">Reference rate</option></select></label>
          <div className="mt-3 rounded-xl bg-white p-3"><div className="text-xs text-slate-500">Selected rate</div><div className="mt-1 break-words text-lg font-extrabold text-indigo-800 sm:text-xl">{money(selected)}</div><div className="text-xs text-slate-500">Quantity: {v.quantity} · Indicative total: {money(selected*v.quantity)}</div></div>
          {error && <p className="mt-3 text-xs font-semibold text-rose-700">{error}</p>}{validation && <p className="mt-2 text-xs text-rose-700">{validation}</p>}
          <button type="button" disabled={!!validation} onClick={apply} className="mt-4 flex min-h-11 w-full items-center justify-center rounded-lg bg-indigo-700 px-3 py-2 text-sm font-bold text-white hover:bg-indigo-800 disabled:opacity-50">Apply rate to first quotation item</button>
          <p className="mt-2 text-xs leading-relaxed text-slate-500">Basis hourly/daily/monthly belum tersimpan sebagai field terpisah pada model quotation. Cantumkan satuan rate di terms/remarks.</p>
        </section>
      </div>
      <footer className="flex flex-col-reverse gap-2 border-t bg-white p-3 sm:flex-row sm:justify-end sm:px-5"><button type="button" onClick={onClose} className="min-h-11 rounded-lg border border-slate-300 px-4 py-2 text-sm font-semibold">Close</button></footer>
    </div>
  </div>;
};
