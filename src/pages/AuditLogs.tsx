import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { Search, FileText, Shield, Wallet, UserX, UserCheck, Settings, Filter } from 'lucide-react';

const LOG_TYPES: Record<string, { badge: string; label: string; icon: React.ReactNode }> = {
    admin_create: { badge: 'bg-violet-50 text-violet-700 border-violet-100', label: 'Admin Created', icon: <Shield size={10} /> },
    block_user: { badge: 'bg-red-50 text-red-700 border-red-100', label: 'User Blocked', icon: <UserX size={10} /> },
    unblock_user: { badge: 'bg-emerald-50 text-emerald-700 border-emerald-100', label: 'Unblocked', icon: <UserCheck size={10} /> },
    wallet_credit: { badge: 'bg-emerald-50 text-emerald-700 border-emerald-100', label: 'Wallet Credit', icon: <Wallet size={10} /> },
    wallet_debit: { badge: 'bg-orange-50 text-orange-700 border-orange-100', label: 'Wallet Debit', icon: <Wallet size={10} /> },
    manual_approval: { badge: 'bg-blue-50 text-blue-700 border-blue-100', label: 'Claim Approved', icon: <UserCheck size={10} /> },
    manual_rejection: { badge: 'bg-slate-100 text-slate-600 border-slate-200', label: 'Claim Rejected', icon: <UserX size={10} /> },
    update_setting: { badge: 'bg-indigo-50 text-indigo-700 border-indigo-100', label: 'Setting Updated', icon: <Settings size={10} /> },
};

const getLogStyle = (type: string) =>
    LOG_TYPES[type as keyof typeof LOG_TYPES] ?? { badge: 'badge-neutral', label: type.replace(/_/g, ' '), icon: <Filter size={10} /> };

export default function AuditLogs() {
    const [logs, setLogs] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [filterType, setFilterType] = useState('all');

    useEffect(() => { fetchLogs(); }, [filterType]);

    const fetchLogs = async () => {
        setLoading(true);
        try {
            let q = supabase
                .from('admin_action_logs')
                .select(`id, action_type, details, created_at,
                    admin_users!admin_action_logs_admin_id_fkey(role, users(full_name, email))`)
                .order('created_at', { ascending: false })
                .limit(200);
            if (filterType !== 'all') q = q.eq('action_type', filterType);
            const { data, error } = await q;
            if (error) throw error;
            setLogs(data || []);
        } catch (err) { console.error(err); }
        finally { setLoading(false); }
    };

    const filtered = logs.filter(log => {
        if (!searchQuery) return true;
        const q = searchQuery.toLowerCase();
        return (
            log.admin_users?.users?.full_name?.toLowerCase().includes(q) ||
            log.admin_users?.users?.email?.toLowerCase().includes(q) ||
            log.action_type?.includes(q)
        );
    });

    return (
        <div className="space-y-6 animate-fade-up">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="page-title">Audit Logs</h1>
                    <p className="page-subtitle">Complete trail of admin actions and system events</p>
                </div>
                <span className="enterprise-badge badge-neutral">{filtered.length} entries</span>
            </div>

            {/* Filters */}
            <div className="flex flex-wrap gap-3 items-center">
                <div className="relative flex-1 min-w-[200px] max-w-sm">
                    <Search size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-300" />
                    <input type="text" placeholder="Search by admin name or email…"
                        className="enterprise-input pl-9 h-10 text-sm"
                        value={searchQuery} onChange={e => setSearchQuery(e.target.value)} />
                </div>
                <select
                    value={filterType}
                    onChange={e => setFilterType(e.target.value)}
                    className="enterprise-input h-10 text-sm w-auto pr-8">
                    <option value="all">All Actions</option>
                    <option value="wallet_credit">Wallet Credits</option>
                    <option value="wallet_debit">Wallet Debits</option>
                    <option value="block_user">User Blocks</option>
                    <option value="unblock_user">User Unblocks</option>
                    <option value="admin_create">Admin Changes</option>
                    <option value="update_setting">Setting Changes</option>
                </select>
            </div>

            {/* Log Timeline */}
            <div className="enterprise-card overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="min-w-full">
                        <thead>
                            <tr>
                                <th className="enterprise-table-header">Admin</th>
                                <th className="enterprise-table-header">Action</th>
                                <th className="enterprise-table-header">Details</th>
                                <th className="enterprise-table-header text-right">Timestamp</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-slate-50">
                            {loading ? (
                                [...Array(7)].map((_, i) => (
                                    <tr key={i}>{[...Array(4)].map((_, j) => (
                                        <td key={j} className="px-5 py-4">
                                            <div className="h-3.5 rounded bg-slate-100 animate-pulse" style={{ width: `${[65, 40, 100, 50][j]}%` }} />
                                        </td>
                                    ))}</tr>
                                ))
                            ) : filtered.map(log => {
                                const style = getLogStyle(log.action_type);
                                return (
                                    <tr key={log.id} className="enterprise-table-row group">
                                        <td className="px-5 py-3.5">
                                            <div className="flex items-center gap-3">
                                                <div className="w-8 h-8 rounded-lg bg-slate-900 text-white flex items-center justify-center font-bold text-xs uppercase shrink-0">
                                                    {log.admin_users?.users?.full_name?.charAt(0) || '?'}
                                                </div>
                                                <div>
                                                    <p className="text-sm font-semibold text-slate-800">{log.admin_users?.users?.full_name || 'System'}</p>
                                                    <p className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold">{log.admin_users?.role?.replace('_', ' ')}</p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-5 py-3.5">
                                            <span className={`enterprise-badge border text-[10px] gap-1 ${style.badge}`}>
                                                {style.icon}{style.label}
                                            </span>
                                        </td>
                                        <td className="px-5 py-3.5 max-w-xs">
                                            <code className="text-[10px] font-mono text-slate-500 bg-slate-50 border border-slate-100 rounded px-2 py-1 block truncate">
                                                {JSON.stringify(log.details)}
                                            </code>
                                        </td>
                                        <td className="px-5 py-3.5 text-right">
                                            <p className="text-xs font-semibold text-slate-600 tabular-nums">{new Date(log.created_at).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: '2-digit' })}</p>
                                            <p className="text-[10px] text-slate-400 tabular-nums">{new Date(log.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}</p>
                                        </td>
                                    </tr>
                                );
                            })}
                            {!loading && filtered.length === 0 && (
                                <tr><td colSpan={4} className="py-20 text-center">
                                    <FileText size={32} className="mx-auto text-slate-200 mb-3" />
                                    <p className="text-slate-400 text-sm font-medium">No audit logs found</p>
                                </td></tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
