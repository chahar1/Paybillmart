import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import {
    Search, RefreshCw, ArrowUpCircle, ArrowDownCircle,
    Clock, CheckCircle2, XCircle, Info,
    TrendingUp, TrendingDown, Activity
} from 'lucide-react';
import Modal from '../components/Modal';

interface Transaction {
    id: string;
    user_id: string;
    amount: number;
    type: 'credit' | 'debit';
    category: string;
    status: string;
    description: string;
    metadata: any;
    created_at: string;
    users: { full_name: string; email: string; phone: string } | null;
}

const STATUS_CONFIG: Record<string, { label: string; cls: string; icon: React.ReactNode }> = {
    success: { label: 'Success', cls: 'badge-success', icon: <CheckCircle2 size={11} /> },
    completed: { label: 'Completed', cls: 'badge-success', icon: <CheckCircle2 size={11} /> },
    pending: { label: 'Pending', cls: 'badge-warning', icon: <Clock size={11} /> },
    failed: { label: 'Failed', cls: 'badge-danger', icon: <XCircle size={11} /> },
};

export default function Transactions() {
    const [transactions, setTransactions] = useState<Transaction[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState('all');
    const [typeFilter, setTypeFilter] = useState('all');
    const [selectedTx, setSelectedTx] = useState<Transaction | null>(null);

    useEffect(() => { fetchTransactions(); }, []);

    const fetchTransactions = async () => {
        setLoading(true);
        try {
            const { data, error } = await supabase
                .from('transactions')
                .select(`*, users(full_name, email, phone)`)
                .order('created_at', { ascending: false })
                .limit(200);
            if (error) throw error;
            setTransactions(data || []);
        } catch (err) { console.error(err); }
        finally { setLoading(false); }
    };

    // Realtime Updates
    useEffect(() => {
        const channel = supabase
            .channel('realtime_transactions')
            .on('postgres_changes', { event: '*', table: 'transactions', schema: 'public' }, () => {
                fetchTransactions();
            })
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, []);

    const filtered = transactions.filter(tx => {
        const q = searchTerm.toLowerCase();
        const matchSearch =
            tx.users?.full_name?.toLowerCase().includes(q) ||
            tx.users?.phone?.includes(q) ||
            tx.description?.toLowerCase().includes(q) ||
            tx.id.toLowerCase().includes(q);
        return matchSearch &&
            (statusFilter === 'all' || tx.status === statusFilter) &&
            (typeFilter === 'all' || tx.type === typeFilter);
    });

    // Live summary counters
    const credits = transactions.filter(t => t.type === 'credit').reduce((s, t) => s + +t.amount, 0);
    const debits = transactions.filter(t => t.type === 'debit').reduce((s, t) => s + +t.amount, 0);
    const pending = transactions.filter(t => t.status === 'pending').length;

    const statusCfg = (s: string) => STATUS_CONFIG[s] ?? { label: s, cls: 'badge-neutral', icon: <Info size={11} /> };

    return (
        <div className="space-y-6 animate-fade-up">
            {/* Page Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="page-title">Transactions</h1>
                    <p className="page-subtitle">List of all money coming in and going out</p>
                </div>
                <button onClick={fetchTransactions} className="enterprise-btn-secondary text-xs gap-1.5">
                    <RefreshCw size={13} className={loading ? 'animate-spin' : ''} /> Refresh
                </button>
            </div>

            {/* KPI Strip */}
            <div className="grid grid-cols-3 gap-4">
                {[
                    { label: 'Total Money In', value: `₹${credits.toLocaleString()}`, icon: <TrendingUp size={16} />, color: 'text-emerald-600', bg: 'bg-emerald-50' },
                    { label: 'Total Money Out', value: `₹${debits.toLocaleString()}`, icon: <TrendingDown size={16} />, color: 'text-red-600', bg: 'bg-red-50' },
                    { label: 'Pending', value: pending.toString(), icon: <Activity size={16} />, color: 'text-amber-600', bg: 'bg-amber-50' },
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

            {/* Filters */}
            <div className="flex flex-wrap gap-3 items-center">
                <div className="relative flex-1 min-w-[200px] max-w-sm">
                    <Search size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-300" />
                    <input type="text" placeholder="Search user, description, ID…"
                        className="enterprise-input pl-9 h-10 text-sm"
                        value={searchTerm} onChange={e => setSearchTerm(e.target.value)} />
                </div>
                <div className="flex items-center gap-1 bg-white border border-slate-200 rounded-xl p-1">
                    {['all', 'credit', 'debit'].map(t => (
                        <button key={t} onClick={() => setTypeFilter(t)}
                            className={`px-3 py-1.5 rounded-lg text-xs font-semibold capitalize transition-all ${typeFilter === t ? 'bg-slate-900 text-white shadow-sm' : 'text-slate-500 hover:text-slate-800'}`}>
                            {t === 'all' ? 'All Types' : t}
                        </button>
                    ))}
                </div>
                <div className="flex items-center gap-1 bg-white border border-slate-200 rounded-xl p-1">
                    {['all', 'pending', 'success', 'failed'].map(s => (
                        <button key={s} onClick={() => setStatusFilter(s)}
                            className={`px-3 py-1.5 rounded-lg text-xs font-semibold capitalize transition-all ${statusFilter === s ? 'bg-slate-900 text-white shadow-sm' : 'text-slate-500 hover:text-slate-800'}`}>
                            {s === 'all' ? 'All Status' : s}
                        </button>
                    ))}
                </div>
                <span className="ml-auto text-xs font-semibold text-slate-400">{filtered.length} records</span>
            </div>

            {/* Table */}
            <div className="enterprise-card overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="min-w-full">
                        <thead>
                            <tr>
                                <th className="enterprise-table-header">User</th>
                                <th className="enterprise-table-header">Type</th>
                                <th className="enterprise-table-header">Category</th>
                                <th className="enterprise-table-header">Amount</th>
                                <th className="enterprise-table-header">Status</th>
                                <th className="enterprise-table-header text-right">Date</th>
                                <th className="enterprise-table-header w-10"></th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-slate-50">
                            {loading ? (
                                [...Array(6)].map((_, i) => (
                                    <tr key={i}>
                                        {[100, 60, 70, 40, 50, 60, 20].map((w, j) => (
                                            <td key={j} className="px-5 py-4">
                                                <div className="h-3.5 rounded bg-slate-100 animate-pulse" style={{ width: `${w}%` }} />
                                            </td>
                                        ))}
                                    </tr>
                                ))
                            ) : filtered.map(tx => {
                                const sc = statusCfg(tx.status);
                                const isCredit = tx.type === 'credit';
                                return (
                                    <tr key={tx.id}
                                        className="enterprise-table-row cursor-pointer group"
                                        onClick={() => setSelectedTx(tx)}>
                                        <td className="px-5 py-3.5">
                                            <div className="flex items-center gap-3">
                                                <div className="w-8 h-8 rounded-lg bg-slate-100 text-slate-600 flex items-center justify-center font-bold text-xs group-hover:bg-indigo-50 group-hover:text-indigo-600 transition-colors uppercase">
                                                    {tx.users?.full_name?.charAt(0) || '?'}
                                                </div>
                                                <div>
                                                    <p className="text-sm font-semibold text-slate-800 leading-tight">{tx.users?.full_name || 'Unknown'}</p>
                                                    <p className="text-[10px] text-slate-400 font-mono">{tx.users?.phone || tx.users?.email}</p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-5 py-3.5">
                                            <div className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold border ${isCredit ? 'bg-emerald-50 text-emerald-700 border-emerald-100' : 'bg-rose-50 text-rose-700 border-rose-100'}`}>
                                                {isCredit ? <ArrowUpCircle size={11} /> : <ArrowDownCircle size={11} />}
                                                {tx.type}
                                            </div>
                                        </td>
                                        <td className="px-5 py-3.5">
                                            <span className="text-xs text-slate-500 font-medium capitalize">{tx.category?.replace(/_/g, ' ')}</span>
                                        </td>
                                        <td className="px-5 py-3.5">
                                            <span className={`text-sm font-bold tabular-nums ${isCredit ? 'text-emerald-700' : 'text-slate-900'}`}>
                                                {isCredit ? '+' : '-'}₹{Number(tx.amount).toLocaleString()}
                                            </span>
                                        </td>
                                        <td className="px-5 py-3.5">
                                            <span className={`enterprise-badge ${sc.cls}`}>{sc.icon}{sc.label}</span>
                                        </td>
                                        <td className="px-5 py-3.5 text-right">
                                            <p className="text-xs font-semibold text-slate-600 tabular-nums">{new Date(tx.created_at).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: '2-digit' })}</p>
                                            <p className="text-[10px] text-slate-400">{new Date(tx.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
                                        </td>
                                        <td className="px-5 py-3.5">
                                            <Info size={14} className="text-slate-300 group-hover:text-indigo-500 transition-colors" />
                                        </td>
                                    </tr>
                                );
                            })}
                            {!loading && filtered.length === 0 && (
                                <tr><td colSpan={7} className="py-20 text-center">
                                    <Activity size={32} className="mx-auto text-slate-200 mb-3" />
                                    <p className="text-slate-400 text-sm font-medium">No transactions found</p>
                                </td></tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Detail Modal */}
            {selectedTx && (
                <Modal isOpen={!!selectedTx} onClose={() => setSelectedTx(null)} title="Transaction Details" subtitle="View more info about this payment below">
                    <div className="space-y-4">
                        <div className="grid grid-cols-2 gap-3">
                            {[
                                ['User Name', selectedTx.users?.full_name || 'Unknown'],
                                ['Mobile No.', selectedTx.users?.phone || '—'],
                                ['Total Amount', `₹${Number(selectedTx.amount).toLocaleString()}`],
                                ['Money Type', selectedTx.type === 'credit' ? 'Money In' : 'Money Out'],
                                ['Payment Status', selectedTx.status],
                                ['Payment Category', selectedTx.category],
                                ['Date & Time', new Date(selectedTx.created_at).toLocaleString()],
                                ['Notes / Desc', selectedTx.description || '—'],
                            ].map(([label, value]) => (
                                <div key={label} className="bg-slate-50 rounded-xl p-3 border border-slate-100">
                                    <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wider mb-1">{label}</p>
                                    <p className="text-sm font-semibold text-slate-800 truncate">{value}</p>
                                </div>
                            ))}
                        </div>
                        {selectedTx.metadata && (
                            <div className="bg-slate-900 rounded-xl p-4">
                                <p className="text-[9px] font-bold text-slate-500 uppercase tracking-wider mb-2">Technical Details</p>
                                <pre className="text-[10px] text-slate-300 font-mono overflow-x-auto">{JSON.stringify(selectedTx.metadata, null, 2)}</pre>
                            </div>
                        )}
                    </div>
                </Modal>
            )}
        </div>
    );
}
