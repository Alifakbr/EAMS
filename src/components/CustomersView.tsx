import React, { useState } from 'react';
import { Customer } from '../types/index.ts';
import { api } from '../services/api.ts';
import { formatRupiahAmount } from '../shared/currency.tsx';
import {
  Users,
  Search,
  Plus,
  FileSpreadsheet,
  Building2,
  User as UserIcon,
  X,
  Phone,
  Mail,
  MapPin,
  FileText,
} from 'lucide-react';

interface CustomersViewProps {
  customers: Customer[];
  onRefresh: () => void;
}

export const CustomersView: React.FC<CustomersViewProps> = ({ customers, onRefresh }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);
  const [savingCustomer, setSavingCustomer] = useState(false);
  const [selectedStatementCustomer, setSelectedStatementCustomer] = useState<Customer | null>(null);
  const [statementData, setStatementData] = useState<any | null>(null);
  const [loadingStatement, setLoadingStatement] = useState(false);

  // Form State
  const [formData, setFormData] = useState({
    name: '',
    type: 'COMPANY' as 'COMPANY' | 'INDIVIDUAL',
    taxId: '',
    contactName: '',
    contactTitle: '',
    contactEmail: '',
    contactPhone: '',
    billingStreet: '',
    billingCity: '',
    billingState: 'TX',
    billingZip: '',
    creditLimit: '100000',
    paymentTermsDays: '30',
    status: 'ACTIVE' as Customer['status'],
    notes: '',
  });

  const filtered = customers.filter((c) => {
    const matchSearch =
      c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.customerCode.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.taxId.toLowerCase().includes(searchTerm.toLowerCase());
    const matchStatus = statusFilter === 'ALL' || c.status === statusFilter;
    return matchSearch && matchStatus;
  });

  const handleOpenStatement = async (cust: Customer) => {
    setSelectedStatementCustomer(cust);
    setLoadingStatement(true);
    try {
      const data = await api.getCustomerStatement(cust.id);
      setStatementData(data);
    } catch (err: any) {
      alert(`Failed to load statement: ${err.message}`);
    } finally {
      setLoadingStatement(false);
    }
  };

  const handleSaveCustomer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.taxId) {
      alert('Customer Name and Tax ID are required.');
      return;
    }

    try {
      const payload = {
        name: formData.name.trim(),
        type: formData.type,
        taxId: formData.taxId,
        contacts: [
          {
            name: formData.contactName || formData.name,
            title: formData.contactTitle || 'Primary Contact',
            email: formData.contactEmail,
            phone: formData.contactPhone,
            isPrimary: true,
          },
        ],
        billingAddress: {
          street: formData.billingStreet,
          city: formData.billingCity,
          state: formData.billingState,
          postalCode: formData.billingZip,
          country: 'United States',
        },
        deliveryAddress: {
          street: formData.billingStreet,
          city: formData.billingCity,
          state: formData.billingState,
          postalCode: formData.billingZip,
          country: 'United States',
        },
        creditLimit: parseFloat(formData.creditLimit) || 100000,
        paymentTermsDays: parseInt(formData.paymentTermsDays, 10) || 30,
        status: editingCustomer ? formData.status : 'ACTIVE',
        notes: formData.notes,
      };
      setSavingCustomer(true);
      if (editingCustomer) {
        await api.updateCustomer(editingCustomer.id, payload);
        alert(`Customer ${formData.name} updated successfully.`);
      } else {
        await api.createCustomer(payload);
        alert(`Customer ${formData.name} created successfully.`);
      }
      setShowCreateModal(false);
      setEditingCustomer(null);
      onRefresh();
    } catch (err: any) {
      alert(`Failed to ${editingCustomer ? 'update' : 'create'} customer: ${err.message}`);
    } finally {
      setSavingCustomer(false);
    }
  };

  const openCustomerEditor = (customer: Customer) => {
    const primary = customer.contacts?.[0];
    setEditingCustomer(customer);
    setFormData({
      name: customer.name || '', type: customer.type || 'COMPANY', taxId: customer.taxId || '',
      contactName: primary?.name || '', contactTitle: primary?.title || '', contactEmail: primary?.email || '', contactPhone: primary?.phone || '',
      billingStreet: customer.billingAddress?.street || '', billingCity: customer.billingAddress?.city || '', billingState: customer.billingAddress?.state || '', billingZip: customer.billingAddress?.postalCode || '',
      creditLimit: String(customer.creditLimit ?? 0), paymentTermsDays: String(customer.paymentTermsDays ?? 30), status: customer.status || 'ACTIVE', notes: customer.notes || '',
    });
    setShowCreateModal(true);
  };

  const handleDeleteCustomer = async (customer: Customer) => {
    if (!window.confirm(`Delete customer ${customer.name}? This is only allowed when no sales, rental, quotation, invoice, or payment records depend on this account.`)) return;
    try {
      await api.deleteCustomer(customer.id);
      alert(`Customer ${customer.name} deleted successfully.`);
      onRefresh();
    } catch (err: any) {
      alert(`Failed to delete customer: ${err.message}`);
    }
  };

  return (
    <div className="space-y-4">
      {/* Action Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-3.5 border border-slate-200 rounded-md">
        <div className="flex items-center gap-2">
          <Users className="w-5 h-5 text-slate-700" />
          <h2 className="text-base font-bold text-slate-900">Commercial Customer Database</h2>
          <span className="text-xs text-slate-400">({customers.length} accounts)</span>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          {/* Search Box */}
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-2.5 top-2.5" />
            <input
              type="text"
              placeholder="Search code, name, tax ID..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-8 pr-3 py-1.5 text-xs border border-slate-200 rounded bg-slate-50 focus:bg-white focus:outline-none focus:border-slate-400 w-52"
            />
          </div>

          {/* Filter Status */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="py-1.5 px-2.5 text-xs border border-slate-200 rounded bg-white text-slate-700 outline-none"
          >
            <option value="ALL">All Statuses</option>
            <option value="ACTIVE">Active</option>
            <option value="ON_HOLD">On Hold</option>
            <option value="INACTIVE">Inactive</option>
          </select>

          <button
            onClick={() => { setEditingCustomer(null); setFormData({ name: '', type: 'COMPANY', taxId: '', contactName: '', contactTitle: '', contactEmail: '', contactPhone: '', billingStreet: '', billingCity: '', billingState: '', billingZip: '', creditLimit: '100000', paymentTermsDays: '30', status: 'ACTIVE', notes: '' }); setShowCreateModal(true); }}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded transition-colors"
          >
            <Plus className="w-4 h-4" />
            Add Customer
          </button>
        </div>
      </div>

      {/* Customer Data Table */}
      <div className="bg-white border border-slate-200 rounded-md overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-50/80 border-b border-slate-200 text-slate-500 font-semibold uppercase tracking-wider text-[11px]">
                <th className="py-2.5 px-4">Code / Account</th>
                <th className="py-2.5 px-4">Type</th>
                <th className="py-2.5 px-4">Tax ID / Contacts</th>
                <th className="py-2.5 px-4">Billing Location</th>
                <th className="py-2.5 px-4 text-right">Credit Limit</th>
                <th className="py-2.5 px-4 text-right">Outstanding Balance</th>
                <th className="py-2.5 px-4 text-center">Status</th>
                <th className="py-2.5 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {filtered.map((customer) => {
                const primary = customer.contacts?.[0];
                const isOverLimit = customer.outstandingBalance > customer.creditLimit;
                return (
                  <tr key={customer.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="py-3 px-4">
                      <div className="font-semibold text-slate-900">{customer.name}</div>
                      <div className="text-[11px] font-mono text-slate-400">{customer.customerCode}</div>
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-1.5 text-slate-600">
                        {customer.type === 'COMPANY' ? (
                          <Building2 className="w-3.5 h-3.5 text-slate-400" />
                        ) : (
                          <UserIcon className="w-3.5 h-3.5 text-slate-400" />
                        )}
                        <span>{customer.type === 'COMPANY' ? 'Corporate' : 'Individual'}</span>
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <div className="font-mono text-slate-800">{customer.taxId}</div>
                      {primary && (
                        <div className="text-[11px] text-slate-500 flex items-center gap-2 mt-0.5">
                          <span>{primary.name}</span>
                          {primary.phone && <span>· {primary.phone}</span>}
                        </div>
                      )}
                    </td>
                    <td className="py-3 px-4 text-slate-600">
                      <div>{customer.billingAddress.street || 'Address on file'}</div>
                      <div className="text-[11px] text-slate-400">
                        {customer.billingAddress.city}, {customer.billingAddress.state} {customer.billingAddress.postalCode}
                      </div>
                    </td>
                    <td className="py-3 px-4 text-right font-mono-numbers text-slate-800">
                      {formatRupiahAmount(customer.creditLimit)}
                    </td>
                    <td className="py-3 px-4 text-right font-mono-numbers">
                      <span className={`font-semibold ${customer.outstandingBalance > 0 ? (isOverLimit ? 'text-rose-600' : 'text-amber-700') : 'text-slate-500'}`}>
                        {formatRupiahAmount(customer.outstandingBalance)}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-center">
                      <span
                        className={`text-[10px] font-semibold uppercase px-2 py-0.5 rounded ${
                          customer.status === 'ACTIVE'
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                            : customer.status === 'ON_HOLD'
                            ? 'bg-amber-50 text-amber-700 border border-amber-200'
                            : 'bg-slate-100 text-slate-600'
                        }`}
                      >
                        {customer.status}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right">
                      <button
                        onClick={() => handleOpenStatement(customer)}
                        className="text-xs font-medium text-slate-700 hover:text-slate-900 underline flex items-center gap-1 justify-end ml-auto"
                      >
                        <FileSpreadsheet className="w-3.5 h-3.5" />
                        Statement
                      </button>
                      <div className="mt-2 flex items-center justify-end gap-3">
                        <button type="button" onClick={() => openCustomerEditor(customer)} className="text-xs font-semibold text-blue-700 hover:text-blue-900 underline">Edit</button>
                        <button type="button" onClick={() => void handleDeleteCustomer(customer)} className="text-xs font-semibold text-rose-700 hover:text-rose-900 underline">Delete</button>
                      </div>
                      <div className="mt-2 flex items-center justify-end gap-3">
                        <button type="button" onClick={() => openCustomerEditor(customer)} className="text-xs font-semibold text-blue-700 hover:text-blue-900 underline">Edit</button>
                        <button type="button" onClick={() => void handleDeleteCustomer(customer)} className="text-xs font-semibold text-rose-700 hover:text-rose-900 underline">Delete</button>
                      </div>
                    </td>
                  </tr>
                );
              })}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={8} className="py-8 text-center text-slate-400">
                    No customers found matching filter.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Customer Statement Modal */}
      {selectedStatementCustomer && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-xl border border-slate-200 max-w-4xl w-full max-h-[90vh] flex flex-col">
            <div className="flex items-center justify-between p-4 border-b border-slate-200">
              <div>
                <h3 className="text-base font-bold text-slate-900">Customer Statement of Account</h3>
                <p className="text-xs text-slate-500 font-mono">
                  {selectedStatementCustomer.name} · Tax ID: {selectedStatementCustomer.taxId}
                </p>
              </div>
              <button
                onClick={() => setSelectedStatementCustomer(null)}
                className="p-1 text-slate-400 hover:text-slate-700 rounded"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 overflow-y-auto space-y-6">
              {loadingStatement ? (
                <div className="text-center py-12 text-slate-500">Generating statement...</div>
              ) : statementData ? (
                <>
                  {/* Summary Header */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 bg-slate-50 p-4 rounded border border-slate-200 text-xs">
                    <div>
                      <div className="text-slate-500 font-medium">Total Invoiced (All-Time)</div>
                      <div className="text-lg font-bold font-mono-numbers text-slate-900 mt-1">
                        {formatRupiahAmount(statementData.totalInvoiced)}
                      </div>
                    </div>
                    <div>
                      <div className="text-slate-500 font-medium">Total Payments Settled</div>
                      <div className="text-lg font-bold font-mono-numbers text-emerald-600 mt-1">
                        {formatRupiahAmount(statementData.totalPaid)}
                      </div>
                    </div>
                    <div>
                      <div className="text-slate-500 font-medium">Current Outstanding Balance</div>
                      <div className="text-lg font-bold font-mono-numbers text-amber-700 mt-1">
                        {formatRupiahAmount(statementData.outstandingBalance)}
                      </div>
                    </div>
                  </div>

                  {/* Open Invoices */}
                  <div>
                    <h4 className="text-xs font-semibold uppercase text-slate-600 mb-2">Invoices Issued</h4>
                    <table className="w-full text-left text-xs border border-slate-200 rounded">
                      <thead className="bg-slate-100 text-slate-600 font-semibold">
                        <tr>
                          <th className="py-2 px-3">Invoice #</th>
                          <th className="py-2 px-3">Date</th>
                          <th className="py-2 px-3">Due Date</th>
                          <th className="py-2 px-3 text-right">Grand Total</th>
                          <th className="py-2 px-3 text-right">Balance</th>
                          <th className="py-2 px-3 text-center">Status</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {statementData.invoices?.map((inv: any) => (
                          <tr key={inv.id}>
                            <td className="py-2 px-3 font-mono font-medium">{inv.invoiceNumber}</td>
                            <td className="py-2 px-3 text-slate-500">{inv.issueDate}</td>
                            <td className="py-2 px-3 text-slate-500">{inv.dueDate}</td>
                            <td className="py-2 px-3 text-right font-mono-numbers">{formatRupiahAmount(inv.grandTotal)}</td>
                            <td className="py-2 px-3 text-right font-mono-numbers font-semibold text-slate-900">
                              {formatRupiahAmount(inv.outstandingBalance)}
                            </td>
                            <td className="py-2 px-3 text-center">
                              <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded bg-slate-100 text-slate-700">
                                {inv.status}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  {/* Payments Received */}
                  <div>
                    <h4 className="text-xs font-semibold uppercase text-slate-600 mb-2">Settled Payments</h4>
                    <table className="w-full text-left text-xs border border-slate-200 rounded">
                      <thead className="bg-slate-100 text-slate-600 font-semibold">
                        <tr>
                          <th className="py-2 px-3">Receipt #</th>
                          <th className="py-2 px-3">Payment Date</th>
                          <th className="py-2 px-3">Method</th>
                          <th className="py-2 px-3">Reference</th>
                          <th className="py-2 px-3 text-right">Amount</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {statementData.payments?.map((pmt: any) => (
                          <tr key={pmt.id}>
                            <td className="py-2 px-3 font-mono font-medium">{pmt.paymentNumber}</td>
                            <td className="py-2 px-3 text-slate-500">{pmt.paymentDate}</td>
                            <td className="py-2 px-3 text-slate-700">{pmt.method}</td>
                            <td className="py-2 px-3 font-mono text-slate-500">{pmt.referenceNumber}</td>
                            <td className="py-2 px-3 text-right font-mono-numbers font-bold text-emerald-700">
                              {formatRupiahAmount(pmt.amount)}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </>
              ) : null}
            </div>

            <div className="no-print p-4 border-t border-slate-200 flex justify-end gap-2">
              <button
                onClick={() => window.print()}
                className="px-3.5 py-1.5 text-xs font-medium text-slate-700 border border-slate-300 rounded hover:bg-slate-50"
              >
                Print Customer Statement
              </button>
              <button
                onClick={() => setSelectedStatementCustomer(null)}
                className="px-4 py-1.5 text-xs font-semibold text-white bg-slate-900 rounded hover:bg-slate-800"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Create / Edit Customer Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-xl border border-slate-200 max-w-xl w-full flex flex-col">
            <div className="flex items-center justify-between p-4 border-b border-slate-200">
              <h3 className="text-base font-bold text-slate-900">{editingCustomer ? 'Edit Commercial Customer Account' : 'Create Commercial Customer Account'}</h3>
              <button
                onClick={() => { setShowCreateModal(false); setEditingCustomer(null); }}
                className="p-1 text-slate-400 hover:text-slate-700 rounded"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveCustomer} className="p-5 space-y-4 text-xs max-h-[80dvh] overflow-y-auto">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-600 font-semibold mb-1">Customer / Entity Name *</label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="e.g. Acme Industrial Corp"
                    className="w-full p-2 border border-slate-300 rounded focus:border-slate-500 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-slate-600 font-semibold mb-1">Account Type</label>
                  <select
                    value={formData.type}
                    onChange={(e) => setFormData({ ...formData, type: e.target.value as any })}
                    className="w-full p-2 border border-slate-300 rounded focus:border-slate-500 outline-none"
                  >
                    <option value="COMPANY">Company / Enterprise</option>
                    <option value="INDIVIDUAL">Individual Contractor</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-600 font-semibold mb-1">Tax ID / EIN / VAT *</label>
                  <input
                    type="text"
                    required
                    value={formData.taxId}
                    onChange={(e) => setFormData({ ...formData, taxId: e.target.value })}
                    placeholder="e.g. US-EIN-88-29401"
                    className="w-full p-2 border border-slate-300 rounded focus:border-slate-500 outline-none font-mono"
                  />
                </div>
                <div>
                  <label className="block text-slate-600 font-semibold mb-1">Credit Limit (IDR)</label>
                  <input
                    type="number"
                    value={formData.creditLimit}
                    onChange={(e) => setFormData({ ...formData, creditLimit: e.target.value })}
                    className="w-full p-2 border border-slate-300 rounded focus:border-slate-500 outline-none font-mono"
                  />
                </div>
                {editingCustomer && <div>
                  <label className="block text-slate-600 font-semibold mb-1">Account Status</label>
                  <select value={formData.status} onChange={(e) => setFormData({ ...formData, status: e.target.value as Customer['status'] })} className="w-full p-2 border border-slate-300 rounded focus:border-slate-500 outline-none">
                    <option value="ACTIVE">Active</option><option value="ON_HOLD">On Hold</option><option value="INACTIVE">Inactive</option>
                  </select>
                </div>}
              </div>

              <div className="border-t border-slate-100 pt-3">
                <h4 className="font-semibold text-slate-700 mb-2">Primary Contact Information</h4>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <input
                      type="text"
                      placeholder="Contact Full Name"
                      value={formData.contactName}
                      onChange={(e) => setFormData({ ...formData, contactName: e.target.value })}
                      className="w-full p-2 border border-slate-300 rounded focus:border-slate-500 outline-none"
                    />
                  </div>
                  <div>
                    <input
                      type="text"
                      placeholder="Job Title"
                      value={formData.contactTitle}
                      onChange={(e) => setFormData({ ...formData, contactTitle: e.target.value })}
                      className="w-full p-2 border border-slate-300 rounded focus:border-slate-500 outline-none"
                    />
                  </div>
                  <div>
                    <input
                      type="email"
                      placeholder="Email Address"
                      value={formData.contactEmail}
                      onChange={(e) => setFormData({ ...formData, contactEmail: e.target.value })}
                      className="w-full p-2 border border-slate-300 rounded focus:border-slate-500 outline-none"
                    />
                  </div>
                  <div>
                    <input
                      type="text"
                      placeholder="Phone Number"
                      value={formData.contactPhone}
                      onChange={(e) => setFormData({ ...formData, contactPhone: e.target.value })}
                      className="w-full p-2 border border-slate-300 rounded focus:border-slate-500 outline-none"
                    />
                  </div>
                </div>
              </div>

              <div className="border-t border-slate-100 pt-3">
                <h4 className="font-semibold text-slate-700 mb-2">Billing &amp; Delivery Address</h4>
                <div className="space-y-2">
                  <input
                    type="text"
                    placeholder="Street Address"
                    value={formData.billingStreet}
                    onChange={(e) => setFormData({ ...formData, billingStreet: e.target.value })}
                    className="w-full p-2 border border-slate-300 rounded focus:border-slate-500 outline-none"
                  />
                  <div className="grid grid-cols-3 gap-2">
                    <input
                      type="text"
                      placeholder="City"
                      value={formData.billingCity}
                      onChange={(e) => setFormData({ ...formData, billingCity: e.target.value })}
                      className="p-2 border border-slate-300 rounded focus:border-slate-500 outline-none"
                    />
                    <input
                      type="text"
                      placeholder="State"
                      value={formData.billingState}
                      onChange={(e) => setFormData({ ...formData, billingState: e.target.value })}
                      className="p-2 border border-slate-300 rounded focus:border-slate-500 outline-none"
                    />
                    <input
                      type="text"
                      placeholder="Postal Code"
                      value={formData.billingZip}
                      onChange={(e) => setFormData({ ...formData, billingZip: e.target.value })}
                      className="p-2 border border-slate-300 rounded focus:border-slate-500 outline-none"
                    />
                  </div>
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => { setShowCreateModal(false); setEditingCustomer(null); }}
                  className="px-4 py-2 border border-slate-300 text-slate-700 rounded hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit" disabled={savingCustomer}
                  className="px-4 py-2 bg-slate-900 text-white rounded font-semibold hover:bg-slate-800 disabled:opacity-60"
                >
                  {savingCustomer ? 'Saving...' : editingCustomer ? 'Update Customer Account' : 'Save Customer Account'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
