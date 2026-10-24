import React, { useCallback, useEffect, useState } from 'react';
import { Check, Eye, FileText, RefreshCw, X } from 'lucide-react';
import { api, ManagerApprovalItem } from '../services/api.ts';
import { RentalContract, SalesOrder } from '../types/index.ts';
import { formatRupiahAmount } from '../shared/currency.tsx';


const humanizeKey = (key: string) => key.replace(/([a-z0-9])([A-Z])/g, '$1 $2').replace(/[_-]+/g, ' ').replace(/^./, (c) => c.toUpperCase());
const displayValue = (value: unknown): string => {
  if (value === null || value === undefined || value === '') return '—';
  if (typeof value === 'boolean') return value ? 'Yes' : 'No';
  if (Array.isArray(value)) return value.length ? `${value.length} item(s)` : 'None';
  if (typeof value === 'object') return 'Details available';
  return String(value);
};
const RecordFields: React.FC<{ data: Record<string, unknown> }> = ({ data }) => {
  const preferred = ['id', 'reference', 'orderNumber', 'contractNumber', 'customerName', 'status', 'issueDate', 'startDate', 'expectedReturnDate', 'dueDate', 'grandTotal', 'total', 'paymentTerms', 'notes'];
  const entries = Object.entries(data || {}).sort(([a], [b]) => {
    const ai = preferred.indexOf(a); const bi = preferred.indexOf(b);
    return (ai < 0 ? 999 : ai) - (bi < 0 ? 999 : bi) || a.localeCompare(b);
  });
  return <dl className="grid grid-cols-1 gap-2 sm:grid-cols-2">{entries.map(([key, value]) => {
    const nested = value && typeof value === 'object' && !Array.isArray(value);
    const list = Array.isArray(value);
    return <div key={key} className="min-w-0 rounded-lg border border-slate-200 bg-white p-3">
      <dt className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">{humanizeKey(key)}</dt>
      <dd className="mt-1 break-words text-sm text-slate-900">
        {nested ? <details><summary className="cursor-pointer text-blue-700">Open details</summary><pre className="mt-2 max-h-48 overflow-auto whitespace-pre-wrap break-words rounded bg-slate-50 p-2 text-xs">{JSON.stringify(value, null, 2)}</pre></details>
          : list ? <details><summary className="cursor-pointer text-blue-700">View {value.length} item(s)</summary><pre className="mt-2 max-h-48 overflow-auto whitespace-pre-wrap break-words rounded bg-slate-50 p-2 text-xs">{JSON.stringify(value, null, 2)}</pre></details>
          : displayValue(value)}
      </dd>
    </div>;
  })}</dl>;
};


type ManagerRecord = {
  id: string;
  reference: string;
  customer: string;
  status: string;
  data: Record<string, unknown>;
};

const approvalLabels: Record<ManagerApprovalItem['type'], string> = {
  quotation: 'Quotation',
  sales: 'Sales order',
  rental: 'Rental contract',
  invoice: 'Invoice',
  procurement: 'Purchase order',
  delivery: 'Delivery',
  maintenance: 'Work order',
};

export const ManagerApprovalsView: React.FC = () => {
  const [approvals, setApprovals] = useState<ManagerApprovalItem[]>([]);
  const [contracts, setContracts] = useState<ManagerRecord[]>([]);
  const [selectedRecord, setSelectedRecord] = useState<ManagerRecord | null>(null);
  const [activeTab, setActiveTab] = useState<'approvals' | 'contracts'>('approvals');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [processingId, setProcessingId] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [queue, sales, rentals] = await Promise.all([
        api.getManagerApprovals(),
        api.getSalesOrders(),
        api.getRentals(),
      ]);
      setApprovals(queue.data);
      setContracts([
        ...sales.data.map((item: SalesOrder) => ({
          id: item.id, reference: item.orderNumber, customer: item.customerName,
          status: item.status, data: item as unknown as Record<string, unknown>,
        })),
        ...rentals.data.map((item: RentalContract) => ({
          id: item.id, reference: item.contractNumber, customer: item.customerName,
          status: item.status, data: item as unknown as Record<string, unknown>,
        })),
      ]);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to load Manager data.';
      setError(message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { void refresh(); }, [refresh]);

  const decide = async (item: ManagerApprovalItem, decision: 'approve' | 'reject') => {
    const action = decision === 'approve' ? 'approve' : 'reject';
    if (!window.confirm(`Are you sure you want to ${action} ${approvalLabels[item.type]} ${item.reference}?`)) return;
    setProcessingId(item.id);
    setError(null);
    try {
      await api.decideManagerApproval(item.type, item.id, decision);
      await refresh();
      setSelectedRecord(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to process approval.');
    } finally {
      setProcessingId(null);
    }
  };

  const showApprovalRecord = (item: ManagerApprovalItem) => setSelectedRecord({
    id: item.id,
    reference: item.reference,
    customer: item.customer,
    status: item.status,
    data: item.data,
  });

  return (
    <section className="space-y-4">
      <header className="rounded-xl bg-slate-900 p-4 text-white sm:p-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-amber-300">Manager Workspace</p>
            <h1 className="mt-1 text-xl font-bold sm:text-2xl">Approvals &amp; Contracts</h1>
            <p className="mt-1 text-sm text-slate-300">Review submissions, view details, then approve or reject.</p>
          </div>
          <button type="button" onClick={() => void refresh()} disabled={loading}
            className="inline-flex min-h-10 items-center gap-2 rounded-lg border border-slate-600 px-3 text-sm hover:bg-slate-800 disabled:opacity-60">
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} /> Refresh
          </button>
        </div>
        <div className="mt-4 flex gap-2">
          <button type="button" onClick={() => setActiveTab('approvals')}
            className={`min-h-10 rounded-lg px-3 text-sm font-semibold ${activeTab === 'approvals' ? 'bg-amber-400 text-slate-950' : 'bg-slate-800 text-slate-200'}`}>
            Pending approvals ({approvals.length})
          </button>
          <button type="button" onClick={() => setActiveTab('contracts')}
            className={`min-h-10 rounded-lg px-3 text-sm font-semibold ${activeTab === 'contracts' ? 'bg-amber-400 text-slate-950' : 'bg-slate-800 text-slate-200'}`}>
            Data &amp; contracts ({contracts.length})
          </button>
        </div>
      </header>

      {error && <div role="alert" className="rounded-lg border border-rose-200 bg-rose-50 p-3 text-sm text-rose-800">{error}</div>}

      {loading ? (
        <div className="rounded-xl border border-slate-200 bg-white p-6 text-sm text-slate-500">Loading data…</div>
      ) : activeTab === 'approvals' ? (
        approvals.length ? (
          <div className="grid gap-3 lg:grid-cols-2">
            {approvals.map((item) => (
              <article key={`${item.type}-${item.id}`} className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <span className="rounded-full bg-amber-50 px-2.5 py-1 text-xs font-semibold text-amber-800">{approvalLabels[item.type]}</span>
                    <h2 className="mt-2 truncate font-bold text-slate-900">{item.reference}</h2>
                    <p className="mt-1 truncate text-sm text-slate-600">{item.customer}</p>
                    <p className="mt-2 text-xs text-slate-500">Submitted: {item.submittedAt || '—'}</p>
                  </div>
                  {item.amount > 0 && <strong className="shrink-0 text-sm text-slate-900">{formatRupiahAmount(item.amount)}</strong>}
                </div>
                <div className="mt-4 flex flex-wrap gap-2 border-t border-slate-100 pt-3">
                  <button type="button" onClick={() => showApprovalRecord(item)}
                    className="inline-flex min-h-10 items-center gap-1.5 rounded-lg border border-slate-300 px-3 text-sm font-semibold text-slate-700 hover:bg-slate-50">
                    <Eye className="h-4 w-4" /> View details
                  </button>
                  <button type="button" onClick={() => void decide(item, 'approve')} disabled={processingId === item.id}
                    className="inline-flex min-h-10 items-center gap-1.5 rounded-lg bg-emerald-700 px-3 text-sm font-semibold text-white hover:bg-emerald-800 disabled:opacity-60">
                    <Check className="h-4 w-4" /> Approve
                  </button>
                  <button type="button" onClick={() => void decide(item, 'reject')} disabled={processingId === item.id}
                    className="inline-flex min-h-10 items-center gap-1.5 rounded-lg border border-rose-200 px-3 text-sm font-semibold text-rose-700 hover:bg-rose-50 disabled:opacity-60">
                    <X className="h-4 w-4" /> Reject
                  </button>
                </div>
              </article>
            ))}
          </div>
        ) : (
          <div className="rounded-xl border border-slate-200 bg-white p-8 text-center">
            <Check className="mx-auto h-8 w-8 text-emerald-600" />
            <h2 className="mt-2 font-semibold text-slate-900">No pending submissions</h2>
            <p className="mt-1 text-sm text-slate-500">New submissions will appear here when sent for approval.</p>
          </div>
        )
      ) : (
        <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
          {contracts.length ? (
            <div className="divide-y divide-slate-100">
              {contracts.map((record) => (
                <button key={record.id} type="button" onClick={() => setSelectedRecord(record)}
                  className="flex min-h-16 w-full items-center justify-between gap-3 px-4 py-3 text-left hover:bg-slate-50">
                  <span className="min-w-0">
                    <span className="block truncate font-semibold text-slate-900">{record.reference}</span>
                    <span className="block truncate text-sm text-slate-500">{record.customer}</span>
                  </span>
                  <span className="shrink-0 rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-700">{record.status}</span>
                </button>
              ))}
            </div>
          ) : <p className="p-6 text-sm text-slate-500">No contracts or orders yet.</p>}
        </div>
      )}

      {selectedRecord && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 p-3 sm:p-6">
          <section role="dialog" aria-modal="true" aria-labelledby="manager-record-title"
            className="max-h-[90dvh] w-full max-w-3xl overflow-y-auto rounded-xl bg-white p-4 shadow-2xl sm:p-6">
            <div className="flex items-start justify-between gap-3 border-b border-slate-200 pb-3">
              <div className="min-w-0">
                <h2 id="manager-record-title" className="truncate text-lg font-bold text-slate-900">{selectedRecord.reference}</h2>
                <p className="mt-1 text-sm text-slate-500">{selectedRecord.customer} · {selectedRecord.status.replaceAll('_', ' ')}</p>
              </div>
              <button type="button" onClick={() => setSelectedRecord(null)} aria-label="Close details"
                className="no-print flex h-10 w-10 shrink-0 items-center justify-center rounded-lg text-slate-500 hover:bg-slate-100"><X className="h-5 w-5" /></button>
            </div>
            <div className="my-4 flex items-center gap-2 text-sm font-semibold text-slate-700">
              <FileText className="h-4 w-4" /> Record Details
            </div>
            <div className="max-h-[55dvh] overflow-y-auto rounded-lg bg-slate-50 p-3 sm:p-4">
              <RecordFields data={selectedRecord.data} />
            </div>
            <div className="no-print mt-4 flex justify-end">
              <button type="button" onClick={() => window.print()} className="min-h-10 rounded-lg bg-slate-900 px-4 text-sm font-semibold text-white hover:bg-slate-800">Print This Record</button>
            </div>
          </section>
        </div>
      )}
    </section>
  );
};
