import React, { useMemo, useState } from 'react';
import { Calculator, X, CalendarDays, ArrowRightLeft } from 'lucide-react';
import { formatRupiahAmount } from '../shared/currency.tsx';

type Basis = 'MONTHLY' | 'DAILY' | 'HOURLY' | 'LUMPSUM';
type PriceKind = 'STANDARD' | 'REFERENCE';

export interface RentalRateCalculatorProps {
  onClose: () => void;
  onApplyRate: (rate: number, rateModel: 'REGULAR' | 'LUMPSUM') => void;
}

const num = (value: string, fallback = 0) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
};
const dateKey = (date: Date) =>
  `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;

function countCalendar(startDate: string, endDate: string, saturdayWorks: boolean, sundayWorks: boolean, holidays: string[]) {
  if (!startDate || !endDate) return { total: 0, weekdays: 0, saturdays: 0, sundays: 0, holidays: 0, billable: 0 };
  const start = new Date(`${startDate}T12:00:00`);
  const end = new Date(`${endDate}T12:00:00`);
  if (!Number.isFinite(start.getTime()) || !Number.isFinite(end.getTime()) || end < start) {
    return { total: 0, weekdays: 0, saturdays: 0, sundays: 0, holidays: 0, billable: 0 };
  }
  const holidaySet = new Set(holidays.map((item) => item.trim()).filter(Boolean));
  let weekdays = 0, saturdays = 0, sundays = 0, holidayCount = 0, billable = 0, total = 0;
  const current = new Date(start);
  while (current <= end) {
    total++;
    const key = dateKey(current);
    const day = current.getDay();
    if (holidaySet.has(key)) {
      holidayCount++;
    } else if (day === 0) {
      sundays++;
      if (sundayWorks) billable++;
    } else if (day === 6) {
      saturdays++;
      if (saturdayWorks) billable++;
    } else {
      weekdays++;
      billable++;
    }
    current.setDate(current.getDate() + 1);
  }
  return { total, weekdays, saturdays, sundays, holidays: holidayCount, billable };
}

const fieldClass = 'w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500';
const labelClass = 'mb-1 block text-xs font-semibold text-slate-600';

export const RentalRateCalculator: React.FC<RentalRateCalculatorProps> = ({ onClose, onApplyRate }) => {
  const [monthlyLumpsum, setMonthlyLumpsum] = useState('100000000');
  const [contractDaysPerMonth, setContractDaysPerMonth] = useState('30');
  const [contractHoursPerMonth, setContractHoursPerMonth] = useState('240');
  const [workingHoursPerDay, setWorkingHoursPerDay] = useState('8');
  const [contractMonths, setContractMonths] = useState('3');
  const [quantity, setQuantity] = useState('1');
  const [multiplierMonthly, setMultiplierMonthly] = useState('1');
  const [multiplierDaily, setMultiplierDaily] = useState('1');
  const [multiplierHourly, setMultiplierHourly] = useState('1.2');
  const [multiplierSaturday, setMultiplierSaturday] = useState('1');
  const [multiplierSunday, setMultiplierSunday] = useState('1.5');
  const [multiplierLumpsum, setMultiplierLumpsum] = useState('1.1');
  const [startDate, setStartDate] = useState(new Date().toISOString().slice(0, 10));
  const [endDate, setEndDate] = useState(new Date(Date.now() + 89 * 86400000).toISOString().slice(0, 10));
  const [saturdayWorks, setSaturdayWorks] = useState(false);
  const [sundayWorks, setSundayWorks] = useState(false);
  const [holidaysText, setHolidaysText] = useState('');
  const [selectedBasis, setSelectedBasis] = useState<Basis>('MONTHLY');
  const [priceKind, setPriceKind] = useState<PriceKind>('REFERENCE');
  const [error, setError] = useState('');

  const values = {
    monthly: num(monthlyLumpsum, NaN),
    days: num(contractDaysPerMonth, NaN),
    hours: num(contractHoursPerMonth, NaN),
    hoursDay: num(workingHoursPerDay, NaN),
    months: num(contractMonths, NaN),
    quantity: num(quantity, NaN),
    mm: num(multiplierMonthly, NaN),
    md: num(multiplierDaily, NaN),
    mh: num(multiplierHourly, NaN),
    msat: num(multiplierSaturday, NaN),
    msun: num(multiplierSunday, NaN),
    ml: num(multiplierLumpsum, NaN),
  };
  const calendar = useMemo(() => countCalendar(startDate, endDate, saturdayWorks, sundayWorks, holidaysText.split(/[,\n]/)), [startDate, endDate, saturdayWorks, sundayWorks, holidaysText]);
  const validationError = useMemo(() => {
    if (Object.values(values).some((value) => !Number.isFinite(value))) return 'Semua input harus berupa angka valid.';
    if (values.monthly < 0 || values.days <= 0 || values.hours <= 0 || values.hoursDay <= 0 || values.months < 0 || values.quantity <= 0) return 'Nilai kontrak, quantity, dan denominator tidak valid.';
    if ([values.mm, values.md, values.mh, values.msat, values.msun, values.ml].some((value) => value < 0)) return 'Multiplier tidak boleh negatif.';
    if (calendar.total === 0) return 'Periode kontrak tidak valid. Periksa tanggal mulai dan akhir.';
    return '';
  }, [monthlyLumpsum, contractDaysPerMonth, contractHoursPerMonth, workingHoursPerDay, contractMonths, quantity, multiplierMonthly, multiplierDaily, multiplierHourly, multiplierSaturday, multiplierSunday, multiplierLumpsum, calendar.total]);

  const rates = {
    monthly: values.monthly,
    daily: values.monthly / values.days,
    hourly: values.monthly / values.hours,
    lumpsum: values.monthly * values.months,
  };
  const reference = {
    monthly: rates.monthly * values.mm,
    daily: rates.daily * values.md,
    hourly: rates.hourly * values.mh,
    saturday: rates.hourly * values.msat,
    sunday: rates.hourly * values.msun,
    lumpsum: rates.lumpsum * values.ml,
  };
  const selectedRate = (() => {
    const standardByBasis: Record<Basis, number> = { MONTHLY: rates.monthly, DAILY: rates.daily, HOURLY: rates.hourly, LUMPSUM: rates.lumpsum };
    const referenceByBasis: Record<Basis, number> = { MONTHLY: reference.monthly, DAILY: reference.daily, HOURLY: reference.hourly, LUMPSUM: reference.lumpsum };
    return priceKind === 'STANDARD' ? standardByBasis[selectedBasis] : referenceByBasis[selectedBasis];
  })();

  const apply = () => {
    if (validationError) {
      setError(validationError);
      return;
    }
    if (!Number.isFinite(selectedRate) || selectedRate < 0) {
      setError('Rate yang akan diterapkan tidak valid.');
      return;
    }
    setError('');
    onApplyRate(selectedRate, selectedBasis === 'LUMPSUM' ? 'LUMPSUM' : 'REGULAR');
    onClose();
  };

  const money = (value: number) => formatRupiahAmount(Number.isFinite(value) ? value : 0);
  const holidays = holidaysText.split(/[,\n]/).map((item) => item.trim()).filter(Boolean);

  return (
    <div className="fixed inset-0 z-[100] flex items-start justify-center overflow-y-auto bg-slate-950/60 p-3 sm:p-6" role="dialog" aria-modal="true" aria-labelledby="rental-rate-calculator-title">
      <div className="my-3 w-full max-w-6xl overflow-hidden rounded-2xl bg-slate-50 shadow-2xl">
        <div className="flex items-center justify-between gap-3 bg-slate-900 px-5 py-4 text-white">
          <div className="flex items-center gap-3">
            <div className="rounded-xl bg-indigo-500/20 p-2"><Calculator className="h-5 w-5 text-indigo-200" /></div>
            <div>
              <h2 id="rental-rate-calculator-title" className="text-lg font-bold">Equipment Rental Rate Calculator</h2>
              <p className="text-xs text-slate-300">Standard Rate · Reference Rate · Contract Calendar</p>
            </div>
          </div>
          <button type="button" onClick={onClose} className="rounded-lg p-2 hover:bg-white/10" aria-label="Close calculator"><X className="h-5 w-5" /></button>
        </div>

        <div className="grid gap-4 p-4 md:grid-cols-2 lg:grid-cols-3">
          <section className="rounded-xl border border-slate-200 bg-white p-4">
            <h3 className="mb-3 text-sm font-bold text-slate-900">1. Contract Basis</h3>
            <div className="grid grid-cols-2 gap-3">
              <label><span className={labelClass}>Monthly contract value (Rp)</span><input type="number" min="0" value={monthlyLumpsum} onChange={(e) => setMonthlyLumpsum(e.target.value)} className={fieldClass} /></label>
              <label><span className={labelClass}>Contract months</span><input type="number" min="0" step="0.5" value={contractMonths} onChange={(e) => setContractMonths(e.target.value)} className={fieldClass} /></label>
              <label><span className={labelClass}>Rate days / month</span><input type="number" min="1" value={contractDaysPerMonth} onChange={(e) => setContractDaysPerMonth(e.target.value)} className={fieldClass} /></label>
              <label><span className={labelClass}>Contract hours / month</span><input type="number" min="1" value={contractHoursPerMonth} onChange={(e) => setContractHoursPerMonth(e.target.value)} className={fieldClass} /></label>
              <label><span className={labelClass}>Working hours / day</span><input type="number" min="0.1" step="0.5" value={workingHoursPerDay} onChange={(e) => setWorkingHoursPerDay(e.target.value)} className={fieldClass} /></label>
              <label><span className={labelClass}>Quantity (unit)</span><input type="number" min="1" value={quantity} onChange={(e) => setQuantity(e.target.value)} className={fieldClass} /></label>
            </div>
            <p className="mt-3 text-[11px] leading-relaxed text-slate-500">Daily = monthly value ÷ rate days. Hourly = monthly value ÷ contract hours. Lumpsum total = monthly value × contract months. Quantity ditampilkan terpisah dan tidak mengubah rate satu unit.</p>
          </section>

          <section className="rounded-xl border border-slate-200 bg-white p-4">
            <h3 className="mb-3 text-sm font-bold text-slate-900">2. Reference Multipliers</h3>
            <div className="grid grid-cols-2 gap-3">
              <label><span className={labelClass}>Monthly multiplier</span><input type="number" min="0" step="0.05" value={multiplierMonthly} onChange={(e) => setMultiplierMonthly(e.target.value)} className={fieldClass} /></label>
              <label><span className={labelClass}>Daily multiplier</span><input type="number" min="0" step="0.05" value={multiplierDaily} onChange={(e) => setMultiplierDaily(e.target.value)} className={fieldClass} /></label>
              <label><span className={labelClass}>Hourly multiplier</span><input type="number" min="0" step="0.05" value={multiplierHourly} onChange={(e) => setMultiplierHourly(e.target.value)} className={fieldClass} /></label>
              <label><span className={labelClass}>Saturday multiplier</span><input type="number" min="0" step="0.05" value={multiplierSaturday} onChange={(e) => setMultiplierSaturday(e.target.value)} className={fieldClass} /></label>
              <label><span className={labelClass}>Sunday multiplier</span><input type="number" min="0" step="0.05" value={multiplierSunday} onChange={(e) => setMultiplierSunday(e.target.value)} className={fieldClass} /></label>
              <label><span className={labelClass}>Lumpsum multiplier</span><input type="number" min="0" step="0.05" value={multiplierLumpsum} onChange={(e) => setMultiplierLumpsum(e.target.value)} className={fieldClass} /></label>
            </div>
            <p className="mt-3 text-[11px] leading-relaxed text-slate-500">Multiplier bernilai 1 berarti 100% dari standard rate. Nilai 1,5 berarti 150%. Simpan kebijakan final di kontrak/konfigurasi perusahaan sebelum dipakai untuk penagihan.</p>
          </section>

          <section className="rounded-xl border border-slate-200 bg-white p-4">
            <h3 className="mb-3 flex items-center gap-2 text-sm font-bold text-slate-900"><CalendarDays className="h-4 w-4" /> 3. Contract Calendar</h3>
            <div className="grid grid-cols-2 gap-3">
              <label><span className={labelClass}>Start date</span><input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} className={fieldClass} /></label>
              <label><span className={labelClass}>End date</span><input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} className={fieldClass} /></label>
            </div>
            <div className="mt-3 space-y-2 text-sm">
              <label className="flex items-center gap-2"><input type="checkbox" checked={saturdayWorks} onChange={(e) => setSaturdayWorks(e.target.checked)} /> Sabtu dihitung sebagai hari kerja</label>
              <label className="flex items-center gap-2"><input type="checkbox" checked={sundayWorks} onChange={(e) => setSundayWorks(e.target.checked)} /> Minggu dihitung sebagai hari kerja</label>
            </div>
            <label className="mt-3 block"><span className={labelClass}>Hari libur (YYYY-MM-DD, pisahkan koma/baris)</span><textarea rows={2} value={holidaysText} onChange={(e) => setHolidaysText(e.target.value)} className={fieldClass} placeholder="2026-12-25, 2027-01-01" /></label>
            <div className="mt-3 grid grid-cols-3 gap-2 text-center text-[11px]">
              <div className="rounded-lg bg-slate-100 p-2"><b className="block text-base">{calendar.weekdays}</b>Weekdays</div>
              <div className="rounded-lg bg-slate-100 p-2"><b className="block text-base">{calendar.saturdays}</b>Saturday</div>
              <div className="rounded-lg bg-slate-100 p-2"><b className="block text-base">{calendar.sundays}</b>Sunday</div>
              <div className="rounded-lg bg-slate-100 p-2"><b className="block text-base">{calendar.holidays}</b>Holiday dates</div>
              <div className="rounded-lg bg-indigo-50 p-2"><b className="block text-base text-indigo-700">{calendar.billable}</b>Billable days</div>
              <div className="rounded-lg bg-indigo-50 p-2"><b className="block text-base text-indigo-700">{calendar.billable * values.hoursDay}</b>Scheduled hours</div>
            </div>
            {holidays.some((holiday) => !/^\d{4}-\d{2}-\d{2}$/.test(holiday)) && <p className="mt-2 text-xs text-rose-600">Format tanggal libur harus YYYY-MM-DD.</p>}
          </section>

          <section className="rounded-xl border border-slate-200 bg-white p-4 lg:col-span-2">
            <h3 className="mb-3 text-sm font-bold text-slate-900">4. Rate Results (per unit)</h3>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              {[
                ['Monthly', rates.monthly, reference.monthly],
                ['Daily', rates.daily, reference.daily],
                ['Hourly', rates.hourly, reference.hourly],
                ['Lumpsum total', rates.lumpsum, reference.lumpsum],
              ].map(([label, standard, ref]) => (
                <div key={String(label)} className="rounded-xl border border-slate-200 p-3">
                  <div className="text-xs font-semibold text-slate-500">{label}</div>
                  <div className="mt-2 text-sm font-bold text-slate-900">{money(Number(standard))}</div>
                  <div className="mt-1 text-[11px] text-indigo-700">Reference: {money(Number(ref))}</div>
                </div>
              ))}
            </div>
            <div className="mt-3 grid gap-3 sm:grid-cols-2">
              <div className="rounded-lg bg-amber-50 p-3"><span className="text-xs font-semibold text-amber-800">Reference Saturday hourly</span><div className="mt-1 font-bold text-amber-900">{money(reference.saturday)}</div></div>
              <div className="rounded-lg bg-rose-50 p-3"><span className="text-xs font-semibold text-rose-800">Reference Sunday hourly</span><div className="mt-1 font-bold text-rose-900">{money(reference.sunday)}</div></div>
            </div>
          </section>

          <section className="rounded-xl border border-indigo-200 bg-indigo-50/70 p-4">
            <h3 className="mb-3 text-sm font-bold text-slate-900">5. Apply to Quotation</h3>
            <label><span className={labelClass}>Rate basis</span><select value={selectedBasis} onChange={(e) => setSelectedBasis(e.target.value as Basis)} className={fieldClass}><option value="MONTHLY">Monthly rate</option><option value="DAILY">Daily rate</option><option value="HOURLY">Hourly rate</option><option value="LUMPSUM">Lumpsum total</option></select></label>
            <label className="mt-3 block"><span className={labelClass}>Price used</span><select value={priceKind} onChange={(e) => setPriceKind(e.target.value as PriceKind)} className={fieldClass}><option value="STANDARD">Standard rate</option><option value="REFERENCE">Reference rate (multiplier)</option></select></label>
            <div className="mt-3 rounded-xl bg-white p-3"><div className="text-xs text-slate-500">Selected rate</div><div className="mt-1 text-xl font-extrabold text-indigo-800">{money(selectedRate)}</div><div className="text-[11px] text-slate-500">Quantity: {values.quantity} · Total indikatif: {money(selectedRate * values.quantity)}</div></div>
            {error && <p className="mt-3 text-xs font-semibold text-rose-700">{error}</p>}
            {validationError && <p className="mt-3 text-xs text-rose-700">{validationError}</p>}
            <button type="button" disabled={Boolean(validationError)} onClick={apply} className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-lg bg-indigo-700 px-4 py-2.5 text-sm font-bold text-white hover:bg-indigo-800 disabled:cursor-not-allowed disabled:opacity-50"><ArrowRightLeft className="h-4 w-4" /> Apply rate to first quotation item</button>
            <p className="mt-2 text-[11px] leading-relaxed text-slate-500">Aplikasi hanya menyalin nilai ke baris pertama quotation yang sedang dibuat. Basis harian/jam/bulanan tetap harus dicantumkan pada terms/remarks karena model quotation saat ini menyimpan REGULAR atau LUMPSUM.</p>
          </section>
        </div>
        <div className="flex flex-col-reverse gap-2 border-t border-slate-200 bg-white px-4 py-3 sm:flex-row sm:justify-end">
          <button type="button" onClick={onClose} className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50">Close</button>
        </div>
      </div>
    </div>
  );
};
