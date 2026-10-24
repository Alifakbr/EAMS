export const formatRupiahAmount = (idrAmount: number | null | undefined): string => {
  if (typeof idrAmount !== 'number' || !Number.isFinite(idrAmount)) return 'Rp—';
  return `Rp${new Intl.NumberFormat('en-US', { maximumFractionDigits: 0 }).format(idrAmount)}`;
};
