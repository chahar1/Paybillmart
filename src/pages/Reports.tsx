import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import {
    Download,
    CreditCard,
    Wallet,
    Zap,
    Users,
    Megaphone,
    TrendingUp,
    ArrowDownCircle,
    Search,
    Smartphone
} from 'lucide-react';

// Report Types
type ReportType =
    | 'admin_debit'
    | 'admin_earning'
    | 'wallet_summary'
    | 'recharge'
    | 'affiliate'
    | 'refer_earn'
    | 'gateway'
    | 'utility';

interface ReportConfig {
    id: ReportType;
    label: string;
    icon: any;
    description: string;
}

const REPORT_CONFIGS: ReportConfig[] = [
    { id: 'admin_debit', label: 'Admin Debit Report', icon: ArrowDownCircle, description: 'Direct wallet deductions by administrators' },
    { id: 'admin_earning', label: 'Admin Earning Report', icon: TrendingUp, description: 'Revenue from commissions and fees' },
    { id: 'wallet_summary', label: 'Wallet Summary', icon: Wallet, description: 'Overall system wallet balance overview' },
    { id: 'recharge', label: 'Recharge Report', icon: Smartphone, description: 'Details of all mobile and DTH recharges' },
    { id: 'affiliate', label: 'Affiliate Report', icon: Megaphone, description: 'Performance of affiliate campaign clicks' },
    { id: 'refer_earn', label: 'Refer & Earn Report', icon: Users, description: 'Referral rewards and conversions' },
    { id: 'gateway', label: 'UPI & Payment Gateway', icon: CreditCard, description: 'Add money transactions via external gateways' },
    { id: 'utility', label: 'Utility Report', icon: Zap, description: 'Bill payments for electricity, water, gas, etc.' },
];

export default function Reports() {
    const [activeReport, setActiveReport] = useState<ReportType>('admin_debit');
    const [data, setData] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [startDate, setStartDate] = useState(new Date(new Date().setDate(new Date().getDate() - 30)).toISOString().split('T')[0]);
    const [endDate, setEndDate] = useState(new Date().toISOString().split('T')[0]);
    const [searchTerm, setSearchTerm] = useState('');

    useEffect(() => {
        fetchReportData();
    }, [activeReport, startDate, endDate]);

    const fetchReportData = async () => {
        setLoading(true);
        try {
            let query: any;
            let start = `${startDate}T00:00:00Z`;
            let end = `${endDate}T23:59:59Z`;

            switch (activeReport) {
                case 'admin_debit':
                    query = supabase
                        .from('transactions')
                        .select('*, users(full_name, email, phone)')
                        .eq('category', 'admin_debit')
                        .gte('created_at', start)
                        .lte('created_at', end)
                        .order('created_at', { ascending: false });
                    break;
                case 'admin_earning':
                    query = supabase
                        .from('recharges')
                        .select('*, users(full_name), operators(name), services(name)')
                        .gt('commission', 0)
                        .gte('created_at', start)
                        .lte('created_at', end)
                        .order('created_at', { ascending: false });
                    break;
                case 'wallet_summary':
                    query = supabase
                        .from('wallets')
                        .select('*, users(full_name, email, phone, created_at)')
                        .order('balance', { ascending: false });
                    break;
                case 'recharge':
                    query = supabase
                        .from('recharges')
                        .select('*, users(full_name), operators(name), services(name)')
                        .gte('created_at', start)
                        .lte('created_at', end)
                        .order('created_at', { ascending: false });
                    break;
                case 'affiliate':
                    query = supabase
                        .from('affiliate_clicks')
                        .select('*, users(full_name), affiliate_campaigns(brand_name, title)')
                        .gte('clicked_at', start)
                        .lte('clicked_at', end)
                        .order('clicked_at', { ascending: false });
                    break;
                case 'refer_earn':
                    query = supabase
                        .from('transactions')
                        .select('*, users(full_name, email)')
                        .eq('category', 'referral')
                        .gte('created_at', start)
                        .lte('created_at', end)
                        .order('created_at', { ascending: false });
                    break;
                case 'gateway':
                    query = supabase
                        .from('transactions')
                        .select('*, users(full_name, email, phone)')
                        .eq('category', 'add_money')
                        .gte('created_at', start)
                        .lte('created_at', end)
                        .order('created_at', { ascending: false });
                    break;
                case 'utility':
                    query = supabase
                        .from('recharges')
                        .select('*, users(full_name), services!inner(name, slug), operators(name)')
                        .not('services.slug', 'in', '("mobile_prepaid","dth")')
                        .gte('created_at', start)
                        .lte('created_at', end)
                        .order('created_at', { ascending: false });
                    break;
            }

            const { data: reportData, error } = await query;
            if (error) throw error;
            setData(reportData || []);
        } catch (error) {
            console.error('Error fetching report data:', error);
        } finally {
            setLoading(false);
        }
    };

    const exportToCSV = () => {
        if (data.length === 0) return;

        let headers: string[] = [];
        let rows: any[] = [];

        // Dynamic header generation based on active report
        if (activeReport === 'admin_debit' || activeReport === 'gateway' || activeReport === 'refer_earn') {
            headers = ['Date', 'Transaction ID', 'User', 'Email', 'Amount', 'Status', 'Description'];
            rows = data.map(item => [
                new Date(item.created_at).toLocaleString(),
                item.id,
                item.users?.full_name,
                item.users?.email,
                item.amount,
                item.status,
                `"${item.description?.replace(/"/g, '""')}"`
            ]);
        } else if (activeReport === 'admin_earning' || activeReport === 'recharge' || activeReport === 'utility') {
            headers = ['Date', 'User', 'Service', 'Operator', 'Number', 'Amount', 'Commission', 'Status'];
            rows = data.map(item => [
                new Date(item.created_at).toLocaleString(),
                item.users?.full_name,
                item.services?.name,
                item.operators?.name,
                item.mobile_number || item.account_number,
                item.amount,
                item.commission,
                item.status
            ]);
        } else if (activeReport === 'wallet_summary') {
            headers = ['User Name', 'Email', 'Phone', 'Balance', 'Total Deposited', 'Total Withdrawn', 'Joined Date'];
            rows = data.map(item => [
                item.users?.full_name,
                item.users?.email,
                item.users?.phone,
                item.balance,
                item.total_deposited,
                item.total_withdrawn,
                new Date(item.users?.created_at).toLocaleDateString()
            ]);
        } else if (activeReport === 'affiliate') {
            headers = ['Time', 'User', 'Brand', 'Campaign', 'Details'];
            rows = data.map(item => [
                new Date(item.clicked_at).toLocaleString(),
                item.users?.full_name,
                item.affiliate_campaigns?.brand_name,
                item.affiliate_campaigns?.title,
                `"${JSON.stringify(item.metadata).replace(/"/g, '""')}"`
            ]);
        }

        const csvContent = "data:text/csv;charset=utf-8,"
            + headers.join(",") + "\n"
            + rows.map(e => e.join(",")).join("\n");

        const encodedUri = encodeURI(csvContent);
        const link = document.createElement("a");
        link.setAttribute("href", encodedUri);
        link.setAttribute("download", `${activeReport}_report_${startDate}_to_${endDate}.csv`);
        document.body.appendChild(link);
        link.click();
    };

    const filteredData = data.filter(item => {
        const searchInput = searchTerm.toLowerCase();
        const userName = item.users?.full_name?.toLowerCase() || '';
        const userEmail = item.users?.email?.toLowerCase() || '';
        const phone = item.users?.phone || '';
        const desc = item.description?.toLowerCase() || '';
        const id = item.id?.toLowerCase() || '';

        return userName.includes(searchInput) ||
            userEmail.includes(searchInput) ||
            phone.includes(searchInput) ||
            desc.includes(searchInput) ||
            id.includes(searchInput);
    });

    return (
        <div className="space-y-6 animate-fade-up">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="page-title">Reports</h1>
                    <p className="page-subtitle">Business intelligence and operational insights</p>
                </div>
                <div className="flex items-center gap-2">
                    <div className="flex items-center bg-white rounded-xl p-1 border border-slate-200 shadow-sm gap-1">
                        <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)}
                            className="bg-transparent border-none text-xs font-semibold text-slate-600 focus:ring-0 px-2 py-1.5 cursor-pointer" />
                        <span className="text-slate-300 text-xs">→</span>
                        <input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)}
                            className="bg-transparent border-none text-xs font-semibold text-slate-600 focus:ring-0 px-2 py-1.5 cursor-pointer" />
                    </div>
                    <button onClick={exportToCSV} className="enterprise-btn-secondary text-xs gap-1.5">
                        <Download size={13} /> Export CSV
                    </button>
                </div>
            </div>

            {/* KPI Strip */}
            <div className="grid grid-cols-4 gap-4">
                {REPORT_CONFIGS.map((cfg) => (
                    <button key={cfg.id} onClick={() => setActiveReport(cfg.id)}
                        className={`enterprise-card p-4 flex items-center gap-3 text-left transition-all ${activeReport === cfg.id ? 'ring-2 ring-indigo-500 ring-offset-1' : 'hover:border-slate-300'
                            }`}>
                        <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${activeReport === cfg.id ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-500'
                            }`}><cfg.icon size={16} /></div>
                        <div className="min-w-0">
                            <p className={`text-xs font-bold leading-tight truncate ${activeReport === cfg.id ? 'text-indigo-600' : 'text-slate-700'
                                }`}>{cfg.label}</p>
                        </div>
                    </button>
                ))}
            </div>

            {/* Search & Count */}
            <div className="flex items-center gap-3">
                <div className="relative">
                    <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-300" size={14} />
                    <input type="text" placeholder="Search records..."
                        className="enterprise-input pl-9 h-10 text-sm w-72"
                        value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
                </div>
                <span className="ml-auto text-xs font-semibold text-slate-400">{filteredData.length} records</span>
            </div>

            {/* Data Table */}
            <div className="enterprise-card overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="min-w-full">
                        <thead>
                            <tr>
                                {getTableHeaders(activeReport).map((header, i) => (
                                    <th key={i} className="enterprise-table-header">{header}</th>
                                ))}
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-slate-50">
                            {loading ? (
                                [...Array(6)].map((_, i) => (
                                    <tr key={i}>{[...Array(getTableHeaders(activeReport).length)].map((_, j) => (
                                        <td key={j} className="px-5 py-4">
                                            <div className="h-3.5 rounded bg-slate-100 animate-pulse" style={{ width: `${Math.random() * 40 + 30}%` }} />
                                        </td>
                                    ))}</tr>
                                ))
                            ) : filteredData.length === 0 ? (
                                <tr><td colSpan={10} className="py-16 text-center">
                                    <Search size={32} className="mx-auto text-slate-200 mb-3" />
                                    <p className="text-slate-400 text-sm font-medium">No records found. Try adjusting the date range.</p>
                                </td></tr>
                            ) : filteredData.map((item, idx) => (
                                <tr key={idx} className="enterprise-table-row">
                                    {renderTableRow(activeReport, item)}
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}

// Helper functions for dynamic UI
function getTableHeaders(type: ReportType): string[] {
    switch (type) {
        case 'admin_debit':
        case 'gateway':
        case 'refer_earn':
            return ['Time', 'Transaction ID', 'User Details', 'Amount', 'Status', 'Description'];
        case 'admin_earning':
            return ['Date', 'Service / Operator', 'User', 'Target', 'Amount', 'Earnings (Commission)', 'Status'];
        case 'recharge':
            return ['Date', 'Operator & Service', 'User Info', 'Number', 'Amount', 'Cashback', 'Status'];
        case 'wallet_summary':
            return ['User Portfolio', 'Current Balance', 'Deposited', 'Withdrawn', 'Earnings', 'Joined'];
        case 'affiliate':
            return ['Timestamp', 'Brand / Campaign', 'User Details', 'Status', 'Device Info'];
        case 'utility':
            return ['Date', 'Service Type', 'User Details', 'Account No.', 'Paid Amount', 'Commission', 'Status'];
        default: return [];
    }
}

function renderTableRow(type: ReportType, item: any) {
    const formatDate = (d: string) => {
        const date = new Date(d);
        return (
            <div className="whitespace-nowrap">
                <p className="text-sm text-slate-900 font-bold">{date.toLocaleDateString()}</p>
                <p className="text-[10px] text-slate-400 font-bold">{date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
            </div>
        );
    };

    const statusBadge = (status: string) => {
        const colors: any = {
            success: 'bg-emerald-50 text-emerald-700 border-emerald-100',
            pending: 'bg-amber-50 text-amber-700 border-amber-100',
            failed: 'bg-red-50 text-red-700 border-red-100',
            reversed: 'bg-slate-100 text-slate-600 border-slate-200'
        };
        const s = status ? status.toLowerCase() : 'pending';
        return (
            <div className="flex items-center space-x-2">
                {s === 'success' && <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />}
                {s === 'pending' && <div className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />}
                {s === 'failed' && <div className="w-1.5 h-1.5 rounded-full bg-red-500" />}
                <span className={`px-2 py-0.5 rounded text-[8px] font-black uppercase tracking-widest border transition-all ${colors[s] || 'bg-slate-50 text-slate-500'}`}>
                    {status || 'PENDING'}
                </span>
            </div>
        );
    };

    switch (type) {
        case 'admin_debit':
        case 'gateway':
        case 'refer_earn':
            return (
                <>
                    <td className="px-6 py-4">{formatDate(item.created_at)}</td>
                    <td className="px-6 py-4 font-mono text-[10px] font-bold text-slate-500">{item.id}</td>
                    <td className="px-6 py-4">
                        <p className="text-sm font-bold text-slate-900">{item.users?.full_name}</p>
                        <p className="text-xs text-slate-400 font-medium">{item.users?.phone}</p>
                    </td>
                    <td className="px-6 py-4 text-sm font-black text-slate-900">₹{parseFloat(item.amount).toLocaleString('en-IN')}</td>
                    <td className="px-6 py-4">{statusBadge(item.status)}</td>
                    <td className="px-6 py-4 text-xs font-medium text-slate-500 max-w-xs truncate">{item.description}</td>
                </>
            );
        case 'admin_earning':
            return (
                <>
                    <td className="px-6 py-4">{formatDate(item.created_at)}</td>
                    <td className="px-6 py-4">
                        <p className="text-sm font-bold text-slate-900">{item.services?.name}</p>
                        <p className="text-xs text-indigo-500 font-bold uppercase tracking-tighter">{item.operators?.name}</p>
                    </td>
                    <td className="px-6 py-4 text-sm font-bold text-slate-700">{item.users?.full_name}</td>
                    <td className="px-6 py-4 font-mono text-xs text-slate-500">{item.mobile_number || 'N/A'}</td>
                    <td className="px-6 py-4 text-sm font-bold text-slate-900">₹{item.amount}</td>
                    <td className="px-6 py-4">
                        <div className="px-3 py-1 bg-indigo-50 rounded-xl inline-block">
                            <span className="text-sm font-black text-indigo-600">₹{item.commission}</span>
                        </div>
                    </td>
                    <td className="px-6 py-4">{statusBadge(item.status)}</td>
                </>
            );
        case 'wallet_summary':
            return (
                <>
                    <td className="px-6 py-4">
                        <p className="text-sm font-black text-slate-900">{item.users?.full_name}</p>
                        <p className="text-xs text-slate-400 font-medium">{item.users?.email}</p>
                    </td>
                    <td className="px-6 py-4 text-sm font-black text-emerald-600">₹{parseFloat(item.balance).toFixed(2)}</td>
                    <td className="px-6 py-4 text-sm font-bold text-slate-900">₹{parseFloat(item.total_deposited).toFixed(2)}</td>
                    <td className="px-6 py-4 text-sm font-bold text-red-500">₹{parseFloat(item.total_withdrawn).toFixed(2)}</td>
                    <td className="px-6 py-4">
                        <p className="text-xs text-slate-700 font-bold">CB: ₹{parseFloat(item.cashback_earned).toFixed(2)}</p>
                        <p className="text-xs text-slate-700 font-bold">Ref: ₹{parseFloat(item.referral_earned).toFixed(2)}</p>
                    </td>
                    <td className="px-6 py-4 text-xs font-bold text-slate-500">{new Date(item.users?.created_at).toLocaleDateString()}</td>
                </>
            );
        case 'recharge':
        case 'utility':
            return (
                <>
                    <td className="px-6 py-4">{formatDate(item.created_at)}</td>
                    <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                            <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center font-black text-[10px] text-slate-500">
                                {item.operators?.name?.charAt(0)}
                            </div>
                            <div>
                                <p className="text-sm font-bold text-slate-900">{item.operators?.name}</p>
                                <p className="text-[10px] text-indigo-50 font-bold uppercase">{item.services?.name}</p>
                            </div>
                        </div>
                    </td>
                    <td className="px-6 py-4 font-bold text-slate-700 text-sm">{item.users?.full_name}</td>
                    <td className="px-6 py-4 font-mono text-xs text-slate-500">{item.mobile_number || item.account_number}</td>
                    <td className="px-6 py-4 text-sm font-black text-slate-900">₹{item.amount}</td>
                    <td className="px-6 py-4 text-sm font-bold text-emerald-600">₹{item.cashback || 0}</td>
                    <td className="px-6 py-4">{statusBadge(item.status)}</td>
                </>
            );
        case 'affiliate':
            return (
                <>
                    <td className="px-6 py-4">{formatDate(item.clicked_at)}</td>
                    <td className="px-6 py-4">
                        <p className="text-sm font-black text-slate-900">{item.affiliate_campaigns?.brand_name}</p>
                        <p className="text-xs text-indigo-500 font-medium">{item.affiliate_campaigns?.title}</p>
                    </td>
                    <td className="px-6 py-4">
                        <p className="text-sm font-bold text-slate-700">{item.users?.full_name || 'Guest'}</p>
                        <p className="text-[10px] text-slate-400 font-medium">{item.users?.email || item.ip_address}</p>
                    </td>
                    <td className="px-6 py-4">
                        <span className="px-2 py-1 rounded-lg bg-indigo-50 text-indigo-600 text-[10px] font-black uppercase tracking-widest">Clicked</span>
                    </td>
                    <td className="px-6 py-4 text-[10px] font-medium text-slate-400 max-w-[200px] truncate">
                        {item.user_agent}
                    </td>
                </>
            );
        default: return null;
    }
}
