import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { BarChart3, TrendingUp, DollarSign, Download, Calendar, CheckCircle } from 'lucide-react';

export default function AffiliateReports() {
    const [stats, setStats] = useState({
        totalClicks: 0,
        totalPending: 0,
        totalApproved: 0,
        conversionRate: 0
    });
    const [clicks, setClicks] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchReports();
    }, []);

    const fetchReports = async () => {
        setLoading(true);

        // 1. Fetch Clicks (Last 30 days usually, but fetching all for now)
        const { data: clickData } = await supabase
            .from('affiliate_clicks')
            .select(`
                *,
                user:users(full_name, email),
                campaign:affiliate_campaigns(brand_name, title)
            `)
            .order('clicked_at', { ascending: false })
            .limit(100);

        // 2. Fetch Aggregated Stats
        const { count: clickCount } = await supabase.from('affiliate_clicks').select('*', { count: 'exact', head: true });

        // Manual Claims Stats
        const { data: claims } = await supabase.from('manual_cashback_requests').select('amount, status');

        const pendingAmount = claims
            ?.filter(c => c.status === 'pending')
            .reduce((sum, c) => sum + c.amount, 0) || 0;

        const approvedAmount = claims
            ?.filter(c => c.status === 'approved')
            .reduce((sum, c) => sum + c.amount, 0) || 0;

        // Calculate simple conversion rate (Claims / Clicks) - Rough estimate
        const totalClaims = claims?.length || 0;
        const totalClicks = clickCount || 1; // Avoid div by zero
        const convRate = ((totalClaims / totalClicks) * 100).toFixed(1);

        setStats({
            totalClicks: clickCount || 0,
            totalPending: pendingAmount,
            totalApproved: approvedAmount,
            conversionRate: parseFloat(convRate)
        });

        if (clickData) setClicks(clickData);
        setLoading(false);
    };

    const downloadCSV = () => {
        const headers = ['Date', 'User', 'Brand', 'Campaign', 'Status'];
        const rows = clicks.map(c => [
            new Date(c.clicked_at).toLocaleString(),
            c.user?.full_name || 'Guest',
            c.campaign?.brand_name,
            c.campaign?.title,
            'Clicked'
        ]);

        const csvContent = "data:text/csv;charset=utf-8,"
            + headers.join(",") + "\n"
            + rows.map(e => e.join(",")).join("\n");

        const encodedUri = encodeURI(csvContent);
        const link = document.createElement("a");
        link.setAttribute("href", encodedUri);
        link.setAttribute("download", "affiliate_report.csv");
        document.body.appendChild(link);
        link.click();
    };

    return (
        <div className="space-y-6 animate-fade-up">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="page-title">Affiliate Reports</h1>
                    <p className="page-subtitle">Click analytics and cashback performance</p>
                </div>
                <button onClick={downloadCSV} className="enterprise-btn-secondary text-xs gap-1.5">
                    <Download size={13} /> Export CSV
                </button>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                <StatsCard
                    title="Total Clicks"
                    value={stats.totalClicks.toLocaleString()}
                    icon={BarChart3}
                    trend="+12% vs last week"
                    color="blue"
                />
                <StatsCard
                    title="Conversion Rate"
                    value={stats.conversionRate + '%'}
                    icon={TrendingUp}
                    trend="Based on claims"
                    color="emerald"
                />
                <StatsCard
                    title="Pending Payouts"
                    value={'₹' + stats.totalPending.toLocaleString()}
                    icon={DollarSign}
                    trend={`${(stats.totalPending / (stats.totalApproved + stats.totalPending || 1) * 100).toFixed(0)}% of total`}
                    color="amber"
                />
                <StatsCard
                    title="Total Approved"
                    value={'₹' + stats.totalApproved.toLocaleString()}
                    icon={CheckCircle}
                    trend="Lifetime earnings"
                    color="indigo"
                />
            </div>

            {/* Recent Activity Table */}
            <div className="enterprise-card overflow-hidden">
                <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center">
                    <h3 className="font-bold text-slate-800">Recent Clicks</h3>
                    <div className="flex items-center gap-2 text-slate-400 text-sm">
                        <Calendar size={14} /> Last 100 records
                    </div>
                </div>
                <table className="w-full text-left">
                    <thead className="bg-slate-50 border-b border-slate-200">
                        <tr>
                            <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Time</th>
                            <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">User</th>
                            <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Affiliate</th>
                            <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Details</th>
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-slate-50">
                        {loading ? (
                            [...Array(5)].map((_, i) => (
                                <tr key={i}>{[...Array(4)].map((_, j) => (
                                    <td key={j} className="px-6 py-4">
                                        <div className="h-3.5 rounded bg-slate-100 animate-pulse" style={{ width: `${[50, 65, 40, 80][j]}%` }} />
                                    </td>
                                ))}</tr>
                            ))
                        ) : clicks.map((click, i) => (
                            <tr key={i} className="hover:bg-slate-50 transition-colors">
                                <td className="px-6 py-4 text-sm text-slate-600 font-mono">
                                    {new Date(click.clicked_at).toLocaleString()}
                                </td>
                                <td className="px-6 py-4">
                                    <div className="font-medium text-slate-900">{click.user?.full_name || 'Guest'}</div>
                                    <div className="text-xs text-slate-400">{click.user?.email}</div>
                                </td>
                                <td className="px-6 py-4">
                                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-md text-xs font-bold bg-slate-100 text-slate-700">
                                        {click.campaign?.brand_name}
                                    </span>
                                </td>
                                <td className="px-6 py-4 text-sm text-slate-600">
                                    {click.campaign?.title}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}

function StatsCard({ title, value, icon: Icon, trend, color }: any) {
    const colors: any = {
        blue: 'bg-blue-50 text-blue-600',
        emerald: 'bg-emerald-50 text-emerald-600',
        amber: 'bg-amber-50 text-amber-600',
        indigo: 'bg-indigo-50 text-indigo-600'
    };

    return (
        <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
            <div className="flex justify-between items-start mb-4">
                <div className={`p-3 rounded-xl ${colors[color]}`}>
                    <Icon size={24} />
                </div>
                {/* Visual sparkline placeholder or menu could go here */}
            </div>
            <p className="text-slate-500 text-sm font-medium">{title}</p>
            <h3 className="text-2xl font-bold text-slate-900 mt-1">{value}</h3>
            <p className="text-slate-400 text-xs mt-2 flex items-center gap-1">
                {trend}
            </p>
        </div>
    );
}

