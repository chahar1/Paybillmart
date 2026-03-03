import React, { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { CheckCircle, XCircle, Clock, ArrowUpCircle, RefreshCw } from 'lucide-react';

const STATUS_MAP: Record<string, { cls: string; badge: string; icon: React.ReactNode }> = {
    pending: { cls: 'enterprise-table-row', badge: 'badge-warning', icon: <Clock size={11} /> },
    approved: { cls: 'enterprise-table-row', badge: 'badge-success', icon: <CheckCircle size={11} /> },
    rejected: { cls: 'enterprise-table-row', badge: 'badge-danger', icon: <XCircle size={11} /> },
};

export default function Withdrawals() {
    const [requests, setRequests] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState<'all' | 'pending' | 'approved' | 'rejected'>('pending');
    const [processing, setProcessing] = useState<string | null>(null);

    useEffect(() => { fetchWithdrawals(); }, []);

    const fetchWithdrawals = async () => {
        setLoading(true);
        const { data, error } = await supabase
            .from('withdrawals')
            .select('*, users(full_name, email, phone)')
            .order('created_at', { ascending: false });
        if (!error) setRequests(data || []);
        setLoading(false);
    };

    const processRequest = async (id: string, status: 'approved' | 'rejected') => {
        if (!confirm(`${status === 'approved' ? 'SEND MONEY' : 'CANCEL'} this request?`)) return;
        setProcessing(id);
        const { data, error } = await supabase.rpc('process_withdrawal', {
            p_withdrawal_id: id,
            p_status: status,
            p_admin_notes: `Processed via Admin Panel at ${new Date().toLocaleString()}`
        });
        if (error) alert('Error: ' + error.message);
        else if (!data?.success) alert('Failed: ' + data?.error);
        setProcessing(null);
        fetchWithdrawals();
    };

    const filtered = requests.filter(r => filter === 'all' || r.status === filter);
    const pending = requests.filter(r => r.status === 'pending').length;
    const total = requests.reduce((s, r) => s + +r.amount, 0);

    return (
        <div className="space-y-6 animate-fade-up">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="page-title">Money Requests (Withdraw)</h1>
                    <p className="page-subtitle">Look at money requests and send money to users</p>
                </div>
                <button onClick={fetchWithdrawals} className="enterprise-btn-secondary text-xs gap-1.5">
                    <RefreshCw size={13} className={loading ? 'animate-spin' : ''} /> Refresh
                </button>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-3 gap-4">
                {[
                    { label: 'New Requests', value: pending.toString(), icon: <Clock size={16} />, color: 'text-amber-600', bg: 'bg-amber-50' },
                    { label: 'Total Money Sent', value: `₹${total.toLocaleString()}`, icon: <ArrowUpCircle size={16} />, color: 'text-indigo-600', bg: 'bg-indigo-50' },
                    { label: 'Total Requests', value: requests.length.toString(), icon: <CheckCircle size={16} />, color: 'text-slate-600', bg: 'bg-slate-100' },
                ].map(k => (
                    <div key={k.label} className="enterprise-card p-5 flex items-center gap-4">
                        <div className={`w-10 h-10 rounded-xl ${k.bg} ${k.color} flex items-center justify-center shrink-0`}>{k.icon}</div>
                        <div>
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{k.label}</p>
                            <p className="text-xl font-bold text-slate-900 tabular-nums tracking-tight">{k.value}</p>
                        </div>
                    </div>
                ))}
            </div>

            {/* Filter Tabs */}
            <div className="flex items-center gap-1 bg-white border border-slate-200 rounded-xl p-1 w-fit">
                {(['all', 'pending', 'approved', 'rejected'] as const).map(f => (
                    <button key={f} onClick={() => setFilter(f)}
                        className={`px-4 py-2 rounded-lg text-xs font-semibold capitalize transition-all ${filter === f ? 'bg-slate-900 text-white shadow-sm' : 'text-slate-500 hover:text-slate-800'}`}>
                        {f === 'approved' ? 'Success' : f === 'rejected' ? 'Cancelled' : f}
                        {f === 'pending' && pending > 0 && (
                            <span className="ml-1.5 inline-flex items-center justify-center w-4 h-4 rounded-full bg-amber-500 text-white text-[9px] font-bold">{pending}</span>
                        )}
                    </button>
                ))}
                <span className="ml-2 text-xs text-slate-400 font-medium pr-1">{filtered.length}</span>
            </div>

            {/* Table */}
            <div className="enterprise-card overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="min-w-full">
                        <thead>
                            <tr>
                                <th className="enterprise-table-header">User</th>
                                <th className="enterprise-table-header">Money (₹)</th>
                                <th className="enterprise-table-header">Send To (UPI/Bank)</th>
                                <th className="enterprise-table-header">Status</th>
                                <th className="enterprise-table-header">Date</th>
                                <th className="enterprise-table-header text-right">Action</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-slate-50">
                            {loading ? (
                                [...Array(5)].map((_, i) => (
                                    <tr key={i}>{[...Array(6)].map((_, j) => (
                                        <td key={j} className="px-5 py-4">
                                            <div className="h-3.5 rounded bg-slate-100 animate-pulse" style={{ width: `${[70, 40, 60, 35, 50, 60][j]}%` }} />
                                        </td>
                                    ))}</tr>
                                ))
                            ) : filtered.map(req => {
                                const sm = STATUS_MAP[req.status] ?? STATUS_MAP.pending;
                                const isProcessing = processing === req.id;
                                return (
                                    <tr key={req.id} className="enterprise-table-row group">
                                        <td className="px-5 py-3.5">
                                            <div className="flex items-center gap-3">
                                                <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center text-slate-600 font-bold text-xs uppercase group-hover:bg-indigo-50 group-hover:text-indigo-600 transition-colors">
                                                    {req.users?.full_name?.charAt(0) || '?'}
                                                </div>
                                                <div>
                                                    <p className="text-sm font-semibold text-slate-800">{req.users?.full_name || 'Unknown'}</p>
                                                    <p className="text-[10px] text-slate-400">{req.users?.phone}</p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-5 py-3.5">
                                            <span className="text-base font-bold text-slate-900 tabular-nums">₹{Number(req.amount).toLocaleString()}</span>
                                        </td>
                                        <td className="px-5 py-3.5">
                                            <div className="text-xs font-mono bg-slate-50 border border-slate-100 rounded-lg px-2.5 py-1.5 text-slate-600 max-w-[180px] truncate">
                                                {req.bank_details?.type === 'upi'
                                                    ? `UPI: ${req.bank_details.id}`
                                                    : JSON.stringify(req.bank_details)}
                                            </div>
                                        </td>
                                        <td className="px-5 py-3.5">
                                            <span className={`enterprise-badge ${sm.badge}`}>{sm.icon}{req.status === 'approved' ? 'Success' : req.status === 'rejected' ? 'Cancelled' : req.status}</span>
                                        </td>
                                        <td className="px-5 py-3.5">
                                            <p className="text-xs font-semibold text-slate-600 tabular-nums">{new Date(req.created_at).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })}</p>
                                            <p className="text-[10px] text-slate-400">{new Date(req.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
                                        </td>
                                        <td className="px-5 py-3.5">
                                            {req.status === 'pending' ? (
                                                <div className="flex justify-end gap-2">
                                                    <button onClick={() => processRequest(req.id, 'approved')} disabled={isProcessing}
                                                        className="px-3 py-1.5 bg-emerald-50 text-emerald-700 text-xs font-bold rounded-lg hover:bg-emerald-600 hover:text-white border border-emerald-100 transition-all disabled:opacity-50">
                                                        {isProcessing ? '...' : 'Send Money'}
                                                    </button>
                                                    <button onClick={() => processRequest(req.id, 'rejected')} disabled={isProcessing}
                                                        className="px-3 py-1.5 bg-red-50 text-red-600 text-xs font-bold rounded-lg hover:bg-red-600 hover:text-white border border-red-100 transition-all disabled:opacity-50">
                                                        Cancel
                                                    </button>
                                                </div>
                                            ) : (
                                                <span className="text-xs text-slate-300 text-right block pr-2">Processed</span>
                                            )}
                                        </td>
                                    </tr>
                                );
                            })}
                            {!loading && filtered.length === 0 && (
                                <tr><td colSpan={6} className="py-20 text-center">
                                    <ArrowUpCircle size={32} className="mx-auto text-slate-200 mb-3" />
                                    <p className="text-slate-400 text-sm font-medium">No money requests found</p>
                                </td></tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
