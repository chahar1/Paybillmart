import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import {
    Plus, Search, Trash2, Edit2, Loader2, Smartphone, Type,
    RefreshCw, ToggleLeft, ToggleRight, Monitor, ShieldCheck
} from 'lucide-react';
import Modal from '../components/Modal';

const SCREENS = ['dth', 'mobile_prepaid', 'mobile_postpaid', 'electricity', 'fasttag', 'cable_tv', 'google_play'];

const EMPTY = {
    title: '', description: '', gradient_start: '#1E3A8A', gradient_end: '#3B82F6',
    target_screen: 'dth', is_active: true, display_order: 0
};

const Banners = () => {
    const [banners, setBanners] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [showModal, setShowModal] = useState(false);
    const [editingBanner, setEditingBanner] = useState<any | null>(null);
    const [saving, setSaving] = useState(false);
    const [formData, setFormData] = useState({ ...EMPTY });

    useEffect(() => { fetchBanners(); }, []);

    const fetchBanners = async () => {
        setLoading(true);
        const { data } = await supabase.from('promotional_banners').select('*').order('display_order', { ascending: true }).order('created_at', { ascending: false });
        if (data) setBanners(data);
        setLoading(false);
    };

    const toggleStatus = async (id: string, cur: boolean) => {
        await supabase.from('promotional_banners').update({ is_active: !cur }).eq('id', id);
        fetchBanners();
    };

    const handleOpenModal = (banner?: any) => {
        setEditingBanner(banner || null);
        setFormData(banner ? { ...EMPTY, ...banner } : { ...EMPTY });
        setShowModal(true);
    };

    const handleSave = async () => {
        if (!formData.title) { alert('Title is required'); return; }
        setSaving(true);
        if (editingBanner) {
            await supabase.from('promotional_banners').update(formData).eq('id', editingBanner.id);
        } else {
            await supabase.from('promotional_banners').insert([formData]);
        }
        setSaving(false);
        setShowModal(false);
        fetchBanners();
    };

    const deleteBanner = async (id: string) => {
        if (!confirm('Delete this banner?')) return;
        await supabase.from('promotional_banners').delete().eq('id', id);
        fetchBanners();
    };

    const filtered = banners.filter(b =>
        b.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        b.target_screen?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const stats = {
        total: banners.length,
        active: banners.filter(b => b.is_active).length,
        inactive: banners.filter(b => !b.is_active).length,
    };

    return (
        <div className="space-y-6 animate-fade-up">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="page-title">Banners</h1>
                    <p className="page-subtitle">Manage home screen promotional banners</p>
                </div>
                <div className="flex items-center gap-2">
                    <button onClick={fetchBanners} className="enterprise-btn-secondary text-xs gap-1.5">
                        <RefreshCw size={13} className={loading ? 'animate-spin' : ''} /> Refresh
                    </button>
                    <button onClick={() => handleOpenModal()} className="enterprise-btn-primary">
                        <Plus size={16} /> Add Banner
                    </button>
                </div>
            </div>

            {/* KPI Strip */}
            <div className="grid grid-cols-3 gap-4">
                {[
                    { label: 'Total Banners', value: stats.total, icon: <Monitor size={16} />, color: 'text-indigo-600', bg: 'bg-indigo-50' },
                    { label: 'Active', value: stats.active, icon: <ToggleRight size={16} />, color: 'text-emerald-600', bg: 'bg-emerald-50' },
                    { label: 'Inactive', value: stats.inactive, icon: <ToggleLeft size={16} />, color: 'text-slate-500', bg: 'bg-slate-100' },
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

            {/* Search */}
            <div className="flex items-center gap-3">
                <div className="relative max-w-sm">
                    <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-300" size={14} />
                    <input type="text" placeholder="Search banners..."
                        className="enterprise-input pl-9 h-10 text-sm"
                        value={searchTerm} onChange={e => setSearchTerm(e.target.value)} />
                </div>
                <span className="ml-auto text-xs font-semibold text-slate-400">{filtered.length} records</span>
            </div>

            {/* Table */}
            <div className="enterprise-card overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="min-w-full">
                        <thead>
                            <tr>
                                <th className="enterprise-table-header">Preview</th>
                                <th className="enterprise-table-header">Title</th>
                                <th className="enterprise-table-header">Target Screen</th>
                                <th className="enterprise-table-header">Order</th>
                                <th className="enterprise-table-header">Status</th>
                                <th className="enterprise-table-header text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-slate-50">
                            {loading ? (
                                [...Array(5)].map((_, i) => (
                                    <tr key={i}>{[...Array(6)].map((_, j) => (
                                        <td key={j} className="px-5 py-4">
                                            <div className="h-3.5 rounded bg-slate-100 animate-pulse" style={{ width: `${[60, 50, 40, 20, 30, 40][j]}%` }} />
                                        </td>
                                    ))}</tr>
                                ))
                            ) : filtered.length === 0 ? (
                                <tr><td colSpan={6} className="py-16 text-center">
                                    <Monitor size={32} className="mx-auto text-slate-200 mb-3" />
                                    <p className="text-slate-400 text-sm font-medium">No banners found</p>
                                </td></tr>
                            ) : filtered.map(banner => (
                                <tr key={banner.id} className="enterprise-table-row group">
                                    <td className="px-5 py-4">
                                        <div className="h-12 w-36 rounded-lg flex flex-col justify-center px-3 shadow-sm shrink-0"
                                            style={{ background: `linear-gradient(to right, ${banner.gradient_start}, ${banner.gradient_end})` }}>
                                            <p className="text-white text-[9px] font-bold uppercase opacity-80 truncate">{banner.title}</p>
                                            <p className="text-white text-xs font-black truncate">{banner.description}</p>
                                        </div>
                                    </td>
                                    <td className="px-5 py-3.5">
                                        <p className="text-sm font-semibold text-slate-800">{banner.title}</p>
                                        <p className="text-[10px] text-slate-400">{banner.description}</p>
                                    </td>
                                    <td className="px-5 py-3.5">
                                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-slate-100 text-slate-600 text-xs font-semibold rounded-lg">
                                            <Smartphone size={10} /> {banner.target_screen}
                                        </span>
                                    </td>
                                    <td className="px-5 py-3.5">
                                        <span className="text-xs font-mono text-slate-500">#{banner.display_order}</span>
                                    </td>
                                    <td className="px-5 py-3.5">
                                        <button onClick={() => toggleStatus(banner.id, banner.is_active)}
                                            className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold border transition-all ${banner.is_active
                                                ? 'bg-emerald-50 text-emerald-700 border-emerald-100 hover:bg-emerald-100'
                                                : 'bg-slate-50 text-slate-500 border-slate-200 hover:bg-slate-100'}`}>
                                            <span className={`w-1.5 h-1.5 rounded-full ${banner.is_active ? 'bg-emerald-500' : 'bg-slate-400'}`} />
                                            {banner.is_active ? 'Active' : 'Inactive'}
                                        </button>
                                    </td>
                                    <td className="px-5 py-3.5">
                                        <div className="flex justify-end gap-1">
                                            <button onClick={() => handleOpenModal(banner)} className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition"><Edit2 size={14} /></button>
                                            <button onClick={() => deleteBanner(banner.id)} className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition"><Trash2 size={14} /></button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Banner Modal */}
            <Modal
                isOpen={showModal}
                onClose={() => setShowModal(false)}
                title={editingBanner ? 'Edit Banner' : 'Add Banner'}
                subtitle="Marketing Campaign"
                icon={editingBanner ? <Edit2 size={28} strokeWidth={2.5} /> : <Plus size={28} strokeWidth={2.5} />}
                maxWidth="max-w-2xl"
            >
                <div className="space-y-6">
                    {/* Live Preview */}
                    <div className="space-y-2">
                        <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1 italic">Vantage Live Preview</label>
                        <div className="h-24 w-full rounded-2xl flex items-center px-8 shadow-xl shadow-indigo-500/10 border border-white/20"
                            style={{ background: `linear-gradient(135deg, ${formData.gradient_start}, ${formData.gradient_end})` }}>
                            <div>
                                <p className="text-white text-[10px] font-black tracking-[0.2em] opacity-80 mb-0.5 drop-shadow-sm">{formData.title.toUpperCase() || 'PROMO TAG'}</p>
                                <h3 className="text-white text-xl font-extrabold drop-shadow-md leading-tight">{formData.description || 'Campaign Headline'}</h3>
                            </div>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-6">
                        <div className="col-span-2 space-y-2">
                            <label className="text-xs font-semibold text-slate-500 ml-1">Tagline (Small Text)</label>
                            <div className="relative group">
                                <Type className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-indigo-500 transition-colors" size={16} />
                                <input value={formData.title} onChange={e => setFormData({ ...formData, title: e.target.value })}
                                    className="enterprise-input h-12 pl-11 font-semibold" placeholder="e.g. LIMITED OFFER" />
                            </div>
                        </div>
                        <div className="col-span-2 space-y-2">
                            <label className="text-xs font-semibold text-slate-500 ml-1">Headline (Main Message)</label>
                            <input value={formData.description} onChange={e => setFormData({ ...formData, description: e.target.value })}
                                className="enterprise-input h-12 font-bold text-base" placeholder="e.g. 5% Cashback on DTH" />
                        </div>

                        <div className="space-y-2">
                            <label className="text-xs font-semibold text-slate-500 ml-1">Gradient Start</label>
                            <div className="flex items-center gap-3 enterprise-input h-12 py-0 border-slate-200">
                                <input type="color" value={formData.gradient_start} onChange={e => setFormData({ ...formData, gradient_start: e.target.value })}
                                    className="w-8 h-8 rounded-lg cursor-pointer border-none bg-transparent" />
                                <span className="text-xs font-mono font-bold text-slate-600 uppercase tracking-tighter">{formData.gradient_start}</span>
                            </div>
                        </div>
                        <div className="space-y-2">
                            <label className="text-xs font-semibold text-slate-500 ml-1">Gradient End</label>
                            <div className="flex items-center gap-3 enterprise-input h-12 py-0 border-slate-200">
                                <input type="color" value={formData.gradient_end} onChange={e => setFormData({ ...formData, gradient_end: e.target.value })}
                                    className="w-8 h-8 rounded-lg cursor-pointer border-none bg-transparent" />
                                <span className="text-xs font-mono font-bold text-slate-600 uppercase tracking-tighter">{formData.gradient_end}</span>
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label className="text-xs font-semibold text-slate-500 ml-1">Target Screen</label>
                            <div className="relative">
                                <select value={formData.target_screen} onChange={e => setFormData({ ...formData, target_screen: e.target.value })}
                                    className="enterprise-input h-12 pl-11 appearance-none bg-white font-semibold">
                                    {SCREENS.map(s => <option key={s} value={s}>{s.replace(/_/g, ' ')}</option>)}
                                </select>
                                <Smartphone className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={16} />
                                <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">
                                    <svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="2"><path d="m3 4.5 3 3 3-3" /></svg>
                                </div>
                            </div>
                        </div>
                        <div className="space-y-2">
                            <label className="text-xs font-semibold text-slate-500 ml-1">Display Priority</label>
                            <input type="number" value={formData.display_order} onChange={e => setFormData({ ...formData, display_order: parseInt(e.target.value) || 0 })}
                                className="enterprise-input h-12 font-bold tabular-nums" />
                        </div>

                        <div className="col-span-2 flex items-center justify-between p-5 bg-slate-50 rounded-2xl border border-slate-100 mt-2">
                            <div className="flex items-center gap-3">
                                <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${formData.is_active ? 'bg-emerald-100 text-emerald-600' : 'bg-slate-200 text-slate-500'}`}>
                                    {formData.is_active ? <ToggleRight size={20} /> : <ToggleLeft size={20} />}
                                </div>
                                <div>
                                    <p className="text-sm font-bold text-slate-800">Banner Visibility</p>
                                    <p className="text-[10px] font-medium text-slate-400 uppercase tracking-wider">Live on application</p>
                                </div>
                            </div>
                            <label className="relative inline-flex items-center cursor-pointer">
                                <input type="checkbox" checked={formData.is_active} onChange={e => setFormData({ ...formData, is_active: e.target.checked })} className="sr-only peer" />
                                <div className="w-12 h-6.5 bg-slate-200 rounded-full peer peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-[2.5px] after:left-[3px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600" />
                            </label>
                        </div>
                    </div>

                    <button onClick={handleSave} disabled={saving}
                        className="w-full mt-4 enterprise-btn-primary justify-center h-12 text-base disabled:opacity-50">
                        {saving ? <Loader2 className="animate-spin w-5 h-5" /> : <><ShieldCheck size={18} strokeWidth={2.5} /> Deploy Banner Instance</>}
                    </button>
                </div>
            </Modal>
        </div>
    );
};

export default Banners;
