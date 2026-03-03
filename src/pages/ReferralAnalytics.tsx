import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import {
    Users,
    TrendingUp,
    DollarSign,
    Clock,
    Download,
    CheckCircle,
    Settings,
    Save,
    Info,
    LayoutDashboard,
    Loader2,
    AlertCircle
} from 'lucide-react';

export default function ReferralAnalytics() {
    const [activeTab, setActiveTab] = useState<'analytics' | 'configuration'>('analytics');
    const [stats, setStats] = useState({
        totalReferrals: 0,
        completedReferrals: 0,
        pendingReferrals: 0,
        totalRewards: 0,
        conversionRate: 0
    });
    const [referrals, setReferrals] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    // Config State
    const [editForm, setEditForm] = useState<any>({});
    const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'success' | 'error'>('idle');

    useEffect(() => {
        if (activeTab === 'analytics') {
            fetchData();
        } else {
            fetchConfig();
        }
    }, [activeTab]);

    const fetchData = async () => {
        setLoading(true);
        const { data } = await supabase
            .from('referral_stats')
            .select('*')
            .order('created_at', { ascending: false })
            .limit(100);

        if (data) {
            setReferrals(data);
            const completed = data.filter(r => r.status === 'completed');
            const totalRewards = completed.reduce((sum, r) =>
                sum + (r.referrer_reward_amount || 0) + (r.referee_reward_amount || 0), 0
            );
            const convRate = data.length > 0 ? (completed.length / data.length * 100).toFixed(1) : 0;

            setStats({
                totalReferrals: data.length,
                completedReferrals: completed.length,
                pendingReferrals: data.filter(r => r.status === 'pending').length,
                totalRewards,
                conversionRate: parseFloat(convRate.toString())
            });
        }
        setLoading(false);
    };

    const fetchConfig = async () => {
        setLoading(true);
        const { data } = await supabase
            .from('system_configs')
            .select('*')
            .eq('key', 'referral_screen_config')
            .single();

        if (data?.value) {
            setEditForm(data.value);
        }
        setLoading(false);
    };

    const handleSaveConfig = async () => {
        setSaveStatus('saving');
        try {
            const { data, error } = await supabase.rpc('update_system_config', {
                p_key: 'referral_screen_config',
                p_value: editForm,
                p_description: 'Updated via Admin Portal Referral Settings'
            });

            if (error) throw error;
            if (data?.error) throw new Error(data.error);

            setSaveStatus('success');
            setTimeout(() => setSaveStatus('idle'), 3000);
        } catch (err: any) {
            console.error('Error saving config:', err);
            setSaveStatus('error');
            alert(err.message || 'Failed to update settings');
        }
    };

    const downloadCSV = () => {
        const headers = ['Referrer Name', 'Referrer Email', 'Referee Name', 'Referee Email', 'Status', 'Created At', 'Completed At', 'Reward Amount'];
        const rows = referrals.map(r => [
            r.referrer_name,
            r.referrer_email,
            r.referee_name,
            r.referee_email,
            r.status,
            new Date(r.created_at).toLocaleString(),
            r.completed_at ? new Date(r.completed_at).toLocaleString() : 'N/A',
            r.referrer_reward_amount
        ]);

        const csvContent = "data:text/csv;charset=utf-8,"
            + headers.join(",") + "\n"
            + rows.map(e => e.join(",")).join("\n");

        const encodedUri = encodeURI(csvContent);
        const link = document.createElement("a");
        link.setAttribute("href", encodedUri);
        link.setAttribute("download", "referral_analytics.csv");
        document.body.appendChild(link);
        link.click();
    };

    return (
        <div className="space-y-6 animate-fade-up">
            {/* Header Section */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="page-title">Refer & Earn</h1>
                    <p className="page-subtitle">Analytics and configuration for the referral program</p>
                </div>

                {/* Tab Switcher */}
                <div className="flex items-center gap-1 bg-white border border-slate-200 rounded-xl p-1">
                    {(['analytics', 'configuration'] as const).map(tab => (
                        <button key={tab} onClick={() => setActiveTab(tab)}
                            className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-semibold capitalize transition-all ${activeTab === tab ? 'bg-slate-900 text-white shadow-sm' : 'text-slate-500 hover:text-slate-800'
                                }`}>
                            {tab === 'analytics' ? <><LayoutDashboard size={12} />Analytics</> : <><Settings size={12} />Settings</>}
                        </button>
                    ))}
                </div>
            </div>

            {activeTab === 'analytics' ? (
                <div className="space-y-6">
                    <div className="flex justify-end">
                        <button onClick={downloadCSV} className="enterprise-btn-secondary text-xs gap-1.5">
                            <Download size={13} /> Export CSV
                        </button>
                    </div>

                    {/* KPI Strip */}
                    <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                        {[
                            { label: 'Total Referrals', value: stats.totalReferrals.toString(), icon: <Users size={16} />, color: 'text-indigo-600', bg: 'bg-indigo-50' },
                            { label: 'Completed', value: stats.completedReferrals.toString(), icon: <CheckCircle size={16} />, color: 'text-emerald-600', bg: 'bg-emerald-50' },
                            { label: 'Pending', value: stats.pendingReferrals.toString(), icon: <Clock size={16} />, color: 'text-amber-600', bg: 'bg-amber-50' },
                            { label: 'Conversion Rate', value: `${stats.conversionRate}%`, icon: <TrendingUp size={16} />, color: 'text-violet-600', bg: 'bg-violet-50' },
                            { label: 'Total Rewards', value: `₹${stats.totalRewards.toLocaleString()}`, icon: <DollarSign size={16} />, color: 'text-slate-600', bg: 'bg-slate-100' },
                        ].map(k => (
                            <div key={k.label} className="enterprise-card p-5 flex items-center gap-4">
                                <div className={`w-10 h-10 rounded-xl ${k.bg} ${k.color} flex items-center justify-center shrink-0`}>{k.icon}</div>
                                <div>
                                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{k.label}</p>
                                    <p className="text-xl font-bold text-slate-900 tabular-nums tracking-tight">{loading ? '—' : k.value}</p>
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* Referrals Table */}
                    <div className="enterprise-card overflow-hidden">
                        <div className="overflow-x-auto">
                            <table className="min-w-full">
                                <thead>
                                    <tr>
                                        <th className="enterprise-table-header">Referred By</th>
                                        <th className="enterprise-table-header">New User</th>
                                        <th className="enterprise-table-header">Code</th>
                                        <th className="enterprise-table-header">Status</th>
                                        <th className="enterprise-table-header">Reward</th>
                                        <th className="enterprise-table-header text-right">Date</th>
                                    </tr>
                                </thead>
                                <tbody className="bg-white divide-y divide-slate-50">
                                    {loading ? (
                                        [...Array(5)].map((_, i) => (
                                            <tr key={i}>{[...Array(6)].map((_, j) => (
                                                <td key={j} className="px-5 py-4">
                                                    <div className="h-3.5 rounded bg-slate-100 animate-pulse" style={{ width: `${[70, 70, 40, 40, 30, 45][j]}%` }} />
                                                </td>
                                            ))}</tr>
                                        ))
                                    ) : referrals.map((ref) => (
                                        <tr key={ref.id} className="enterprise-table-row">
                                            <td className="px-5 py-3.5">
                                                <p className="text-sm font-semibold text-slate-800">{ref.referrer_name || 'Unknown'}</p>
                                                <p className="text-[10px] text-slate-400">{ref.referrer_email}</p>
                                            </td>
                                            <td className="px-5 py-3.5">
                                                <p className="text-sm font-semibold text-slate-800">{ref.referee_name || 'Unknown'}</p>
                                                <p className="text-[10px] text-slate-400">{ref.referee_email}</p>
                                            </td>
                                            <td className="px-5 py-3.5">
                                                <span className="px-2 py-1 rounded-lg text-[10px] font-mono font-bold bg-slate-100 text-slate-600 border border-slate-200">
                                                    {ref.referral_code}
                                                </span>
                                            </td>
                                            <td className="px-5 py-3.5">
                                                <span className={`enterprise-badge ${ref.status === 'completed' ? 'badge-success' : 'badge-warning'}`}>
                                                    {ref.status === 'completed' ? <CheckCircle size={11} /> : <Clock size={11} />}
                                                    {ref.status}
                                                </span>
                                            </td>
                                            <td className="px-5 py-3.5">
                                                <span className="text-sm font-bold text-slate-900 tabular-nums">₹{ref.referrer_reward_amount || 0}</span>
                                            </td>
                                            <td className="px-5 py-3.5 text-right">
                                                <p className="text-xs font-semibold text-slate-600 tabular-nums">{new Date(ref.created_at).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: '2-digit' })}</p>
                                            </td>
                                        </tr>
                                    ))}
                                    {!loading && referrals.length === 0 && (
                                        <tr><td colSpan={6} className="py-16 text-center">
                                            <p className="text-slate-400 text-sm font-medium">No referrals found</p>
                                        </td></tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            ) : (
                <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                        {/* Configuration Form */}
                        <div className="lg:col-span-2 space-y-6">
                            <div className="enterprise-card p-8 bg-white max-w-none">
                                <div className="flex items-center gap-3 mb-8 border-b border-slate-100 pb-6">
                                    <div className="w-12 h-12 rounded-2xl bg-indigo-50 flex items-center justify-center text-indigo-600 shadow-sm border border-indigo-100/50">
                                        <Settings size={22} />
                                    </div>
                                    <div>
                                        <h2 className="text-xl font-black text-slate-900 italic tracking-tight">Referral Settings</h2>
                                        <p className="text-xs text-slate-500 font-bold uppercase tracking-widest mt-0.5">Set rewards and text</p>
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-2">Referrer Reward (\u20B9)</label>
                                        <input
                                            type="number"
                                            value={editForm?.referrer_amount || ''}
                                            onChange={e => setEditForm({ ...editForm, referrer_amount: Number(e.target.value) })}
                                            className="enterprise-input h-14 font-black text-indigo-600"
                                            placeholder="50"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-2">Referee Reward (\u20B9)</label>
                                        <input
                                            type="number"
                                            value={editForm?.referee_amount || ''}
                                            onChange={e => setEditForm({ ...editForm, referee_amount: Number(e.target.value) })}
                                            className="enterprise-input h-14 font-black text-emerald-600"
                                            placeholder="100"
                                        />
                                    </div>
                                    <div className="md:col-span-2 space-y-2">
                                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-2">Main Promo Title</label>
                                        <input
                                            value={editForm?.promo_title || ''}
                                            onChange={e => setEditForm({ ...editForm, promo_title: e.target.value })}
                                            className="enterprise-input h-14 font-bold"
                                            placeholder="Invite friends, earn real cash"
                                        />
                                    </div>
                                    <div className="md:col-span-2 space-y-2">
                                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-2">Promo Subtitle Template</label>
                                        <input
                                            value={editForm?.promo_subtitle || ''}
                                            onChange={e => setEditForm({ ...editForm, promo_subtitle: e.target.value })}
                                            className="enterprise-input h-14 font-medium"
                                            placeholder="Earn {{referrer_amount}} for every friend..."
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-2">Step 1 Description Template</label>
                                        <textarea
                                            value={editForm?.step_1_desc || ''}
                                            onChange={e => setEditForm({ ...editForm, step_1_desc: e.target.value })}
                                            className="enterprise-input min-h-[100px] py-4 text-sm font-medium"
                                            placeholder="Your friends get..."
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-2">Step 2 Description Template</label>
                                        <textarea
                                            value={editForm?.step_2_desc || ''}
                                            onChange={e => setEditForm({ ...editForm, step_2_desc: e.target.value })}
                                            className="enterprise-input min-h-[100px] py-4 text-sm font-medium"
                                            placeholder="You get..."
                                        />
                                    </div>
                                    <div className="md:col-span-2 space-y-2">
                                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-2">Share Message Template</label>
                                        <textarea
                                            value={editForm?.share_message_template || ''}
                                            onChange={e => setEditForm({ ...editForm, share_message_template: e.target.value })}
                                            className="enterprise-input min-h-[120px] py-4 text-sm font-medium leading-relaxed"
                                            placeholder="🎁 Join Paybilmart & get ₹{{referee_amount}}..."
                                        />
                                        <p className="text-[9px] font-black text-slate-400 italic">Valid Placeholders: {'{{CODE}}, {{referrer_amount}}, {{referee_amount}}'}</p>
                                    </div>
                                </div>

                                <button
                                    onClick={handleSaveConfig}
                                    disabled={saveStatus === 'saving'}
                                    className="w-full bg-slate-950 text-white py-5 rounded-[28px] font-black text-lg mt-12 hover:bg-slate-900 active:scale-[0.98] shadow-2xl transition-all flex items-center justify-center gap-3 disabled:opacity-50 group border border-white/5 italic"
                                >
                                    {saveStatus === 'saving' ? (
                                        <Loader2 className="animate-spin w-6 h-6" />
                                    ) : saveStatus === 'success' ? (
                                        <><CheckCircle size={22} className="text-emerald-400" /> Values Updated Successfully</>
                                    ) : (
                                        <><Save size={22} className="group-hover:scale-110 transition-transform" /> Save Changes</>
                                    )}
                                </button>
                            </div>
                        </div>

                        {/* Helper / Info Panel */}
                        <div className="space-y-6">
                            <div className="bg-indigo-600 rounded-[32px] p-8 text-white shadow-xl shadow-indigo-200 relative overflow-hidden group">
                                <div className="relative z-10">
                                    <div className="bg-white/20 w-12 h-12 rounded-2xl flex items-center justify-center mb-6 backdrop-blur-md">
                                        <Info size={24} />
                                    </div>
                                    <h3 className="text-xl font-black italic mb-4">Dynamic Text</h3>
                                    <p className="text-indigo-100 text-sm font-bold leading-relaxed mb-6 opacity-90">
                                        Use these placeholders to automatically insert values.
                                    </p>
                                    <div className="space-y-4">
                                        <PlaceholderBadge label="{{CODE}}" desc="User's unique referral ID" />
                                        <PlaceholderBadge label="{{referrer_amount}}" desc="Current reward for inviter" />
                                        <PlaceholderBadge label="{{referee_amount}}" desc="Current reward for invitee" />
                                    </div>
                                </div>
                                {/* Decorative elements */}
                                <div className="absolute -bottom-8 -right-8 w-32 h-32 bg-white/10 rounded-full blur-3xl group-hover:scale-150 transition-transform duration-700" />
                                <div className="absolute -top-8 -left-8 w-24 h-24 bg-white/5 rounded-full blur-2xl" />
                            </div>

                            <div className="enterprise-card p-6 border-dashed border-2 border-slate-200 bg-slate-50">
                                <h4 className="flex items-center gap-2 font-black text-xs text-slate-700 uppercase tracking-widest mb-4">
                                    <AlertCircle size={16} className="text-amber-500" /> Quality Check
                                </h4>
                                <ul className="space-y-3">
                                    <li className="flex gap-3 text-xs text-slate-500 font-bold leading-none">
                                        <div className="w-1.5 h-1.5 rounded-full bg-indigo-400 mt-1 shrink-0" />
                                        Verify all placeholders are enclosed in double curly braces.
                                    </li>
                                    <li className="flex gap-3 text-xs text-slate-500 font-bold leading-none">
                                        <div className="w-1.5 h-1.5 rounded-full bg-indigo-400 mt-1 shrink-0" />
                                        Rewards are automatically displayed with currency symbols in the app.
                                    </li>
                                    <li className="flex gap-3 text-xs text-slate-500 font-bold leading-none">
                                        <div className="w-1.5 h-1.5 rounded-full bg-indigo-400 mt-1 shrink-0" />
                                        Changes are immediate across all user sessions.
                                    </li>
                                </ul>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

function PlaceholderBadge({ label, desc }: { label: string, desc: string }) {
    return (
        <div className="flex items-center gap-3 bg-white/10 p-3 rounded-2xl border border-white/10 hover:bg-white/20 transition-colors cursor-help">
            <span className="text-[10px] font-mono font-black bg-white text-indigo-600 px-2 py-1 rounded-lg shadow-sm">{label}</span>
            <span className="text-[10px] font-bold text-indigo-50 leading-none">{desc}</span>
        </div>
    );
}



