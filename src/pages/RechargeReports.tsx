import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import {
    Search, RefreshCw, Download, CheckCircle2, Clock, XCircle,
    Smartphone, TrendingUp, BarChart3, Zap
} from 'lucide-react';

interface RechargeReport {
    id: string;
    mobile_number: string;
    amount: number;
    commission: number;
    cashback: number;
    status: string;
    created_at: string;
    users: { full_name: string; email: string };
    operators: { name: string };
    services: { name: string };
}

const STATUS_MAP: Record<string, { cls: string; icon: React.ReactNode }> = {
    success: { cls: 'badge-success', icon: <CheckCircle2 size={11} /> },
    pending: { cls: 'badge-warning', icon: <Clock size={11} /> },
    failed: { cls: 'badge-danger', icon: <XCircle size={11} /> },
};

export default function RechargeReports() {
    const [recharges, setRecharges] = useState<RechargeReport[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState('all');

    useEffect(() => { fetchRecharges(); }, []);

    // Real-time synchronization
    useEffect(() => {
        const channel = supabase
            .channel('realtime_recharges')
            .on('postgres_changes', { event: '*', table: 'recharges', schema: 'public' }, () => {
                fetchRecharges();
            })
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, []);

    const fetchRecharges = async () => {
        setLoading(true);
        try {
            const { data, error } = await supabase
                .from('recharges')
                .select('*, users(full_name, email), operators(name), services(name)')
                .order('created_at', { ascending: false })
                .limit(200);
            if (error) throw error;
            setRecharges(data || []);
        } catch (err) { console.error(err); }
        finally { setLoading(false); }
    };

    const filtered = recharges.filter(r => {
        const q = searchTerm.toLowerCase();
        return (
            (r.mobile_number?.includes(q) || r.users?.full_name?.toLowerCase().includes(q) || r.operators?.name?.toLowerCase().includes(q)) &&
            (statusFilter === 'all' || r.status === statusFilter)
        );
    });

    const stats = {
        total: recharges.length,
        success: recharges.filter(r => r.status === 'success').length,
        revenue: recharges.filter(r => r.status === 'success').reduce((s, r) => s + +r.amount, 0),
        cashback: recharges.reduce((s, r) => s + +r.cashback, 0),
        commission: recharges.reduce((s, r) => s + +r.commission, 0),
    };
    const rate = stats.total > 0 ? ((stats.success / stats.total) * 100).toFixed(1) : '0';

    return (
        <div className="space-y-6 animate-fade-up">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="page-title">Recharge History</h1>
                    <p className="page-subtitle">All mobile and utility recharge transactions</p>
                </div>
                <div className="flex items-center gap-2">
                    <button onClick={fetchRecharges} className="enterprise-btn-secondary text-xs gap-1.5">
                        <RefreshCw size={13} className={loading ? 'animate-spin' : ''} /> Refresh
                    </button>
                    <button className="enterprise-btn-secondary text-xs gap-1.5">
                        <Download size={13} /> Export
                    </button>
                </div>
            </div>

            {/* KPI Strip */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {[
                    { label: 'Total Recharges', value: stats.total.toString(), icon: <Smartphone size={16} />, color: 'text-indigo-600', bg: 'bg-indigo-50' },
                    { label: 'Success Rate', value: `${rate}%`, icon: <TrendingUp size={16} />, color: 'text-emerald-600', bg: 'bg-emerald-50' },
                    { label: 'Total Revenue', value: `₹${stats.revenue.toLocaleString()}`, icon: <BarChart3 size={16} />, color: 'text-violet-600', bg: 'bg-violet-50' },
                    { label: 'Cashback Issued', value: `₹${stats.cashback.toFixed(2)}`, icon: <Zap size={16} />, color: 'text-amber-600', bg: 'bg-amber-50' },
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
                    <input type="text" placeholder="Search mobile, user or operator…"
                        className="enterprise-input pl-9 h-10 text-sm"
                        value={searchTerm} onChange={e => setSearchTerm(e.target.value)} />
                </div>
                <div className="flex items-center gap-1 bg-white border border-slate-200 rounded-xl p-1">
                    {['all', 'success', 'pending', 'failed'].map(s => (
                        <button key={s} onClick={() => setStatusFilter(s)}
                            className={`px-3 py-1.5 rounded-lg text-xs font-semibold capitalize transition-all ${statusFilter === s ? 'bg-slate-900 text-white shadow-sm' : 'text-slate-500 hover:text-slate-800'}`}>
                            {s === 'all' ? 'All' : s}
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
                                <th className="enterprise-table-header">Service</th>
                                <th className="enterprise-table-header">Operator</th>
                                <th className="enterprise-table-header">Mobile</th>
                                <th className="enterprise-table-header">Amount</th>
                                <th className="enterprise-table-header">Cashback</th>
                                <th className="enterprise-table-header">Status</th>
                                <th className="enterprise-table-header text-right">Date</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-slate-50">
                            {loading ? (
                                [...Array(6)].map((_, i) => (
                                    <tr key={i}>{[...Array(8)].map((_, j) => (
                                        <td key={j} className="px-5 py-4">
                                            <div className="h-3.5 rounded bg-slate-100 animate-pulse" style={{ width: `${[80, 60, 60, 55, 35, 30, 45, 55][j]}%` }} />
                                        </td>
                                    ))}</tr>
                                ))
                            ) : filtered.map(r => {
                                const sc = STATUS_MAP[r.status] ?? { cls: 'badge-neutral', icon: <Clock size={11} /> };
                                return (
                                    <tr key={r.id} className="enterprise-table-row group">
                                        <td className="px-5 py-3.5">
                                            <div>
                                                <p className="text-sm font-semibold text-slate-800">{r.users?.full_name || 'Unknown'}</p>
                                                <p className="text-[10px] text-slate-400">{r.users?.email}</p>
                                            </div>
                                        </td>
                                        <td className="px-5 py-3.5">
                                            <span className="text-xs text-slate-600 font-medium">{r.services?.name || '—'}</span>
                                        </td>
                                        <td className="px-5 py-3.5">
                                            <span className="enterprise-badge badge-info">{r.operators?.name || '—'}</span>
                                        </td>
                                        <td className="px-5 py-3.5">
                                            <span className="text-xs font-mono text-slate-600">{r.mobile_number}</span>
                                        </td>
                                        <td className="px-5 py-3.5">
                                            <span className="text-sm font-bold text-slate-900 tabular-nums">₹{Number(r.amount).toLocaleString()}</span>
                                        </td>
                                        <td className="px-5 py-3.5">
                                            <span className="text-xs font-bold text-emerald-600 tabular-nums">₹{Number(r.cashback).toFixed(2)}</span>
                                        </td>
                                        <td className="px-5 py-3.5">
                                            <span className={`enterprise-badge ${sc.cls}`}>{sc.icon}{r.status}</span>
                                        </td>
                                        <td className="px-5 py-3.5 text-right">
                                            <p className="text-xs font-semibold text-slate-600 tabular-nums">{new Date(r.created_at).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: '2-digit' })}</p>
                                            <p className="text-[10px] text-slate-400">{new Date(r.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
                                        </td>
                                    </tr>
                                );
                            })}
                            {!loading && filtered.length === 0 && (
                                <tr><td colSpan={8} className="py-20 text-center">
                                    <Smartphone size={32} className="mx-auto text-slate-200 mb-3" />
                                    <p className="text-slate-400 text-sm font-medium">No recharges found</p>
                                </td></tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
