import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import {
    Plus, Search, Megaphone, Trash2, Edit2, ExternalLink,
    Loader2, ToggleLeft, ToggleRight, RefreshCw, Filter, ArrowRight, Layout, Star
} from 'lucide-react';
import Modal from '../components/Modal';

const CATEGORIES = ['All', 'Shopping', 'Food', 'Travel', 'Services', 'Finance', 'Electronics', 'Fashion'];

const EMPTY_FORM = {
    title: '', brand_name: '', brand_logo_url: '', cashback_rate: '',
    affiliate_link: '', category: 'Shopping', is_active: true,
    display_order: 0, is_featured: false, featured_image_url: '', tracking_time: '24h tracking'
};

const Campaigns = () => {
    const [campaigns, setCampaigns] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [activeCategory, setActiveCategory] = useState('All');

    // Modal State
    const [showModal, setShowModal] = useState(false);
    const [editingCampaign, setEditingCampaign] = useState<any | null>(null);
    const [saving, setSaving] = useState(false);
    const [formData, setFormData] = useState({ ...EMPTY_FORM });

    useEffect(() => { fetchCampaigns(); }, []);

    const fetchCampaigns = async () => {
        setLoading(true);
        const { data } = await supabase
            .from('affiliate_campaigns')
            .select('*')
            .order('display_order', { ascending: true })
            .order('created_at', { ascending: false });
        if (data) setCampaigns(data);
        setLoading(false);
    };

    const toggleStatus = async (id: string, current: boolean) => {
        await supabase.from('affiliate_campaigns').update({ is_active: !current }).eq('id', id);
        fetchCampaigns();
    };

    const handleOpenModal = (camp?: any) => {
        setEditingCampaign(camp || null);
        setFormData(camp ? { ...EMPTY_FORM, ...camp } : { ...EMPTY_FORM });
        setShowModal(true);
    };

    const handleSave = async () => {
        if (!formData.title || !formData.brand_name || !formData.affiliate_link) {
            alert('Title, Brand Name, and Link are required');
            return;
        }
        setSaving(true);
        if (editingCampaign) {
            await supabase.from('affiliate_campaigns').update(formData).eq('id', editingCampaign.id);
        } else {
            await supabase.from('affiliate_campaigns').insert([formData]);
        }
        setSaving(false);
        setShowModal(false);
        fetchCampaigns();
    };

    const deleteCampaign = async (id: string) => {
        if (!window.confirm('Remove this offer?')) return;
        await supabase.from('affiliate_campaigns').delete().eq('id', id);
        fetchCampaigns();
    };

    const filtered = campaigns.filter(c => {
        const q = searchTerm.toLowerCase();
        const matchQ = c.title?.toLowerCase().includes(q) || c.brand_name?.toLowerCase().includes(q);
        const matchCat = activeCategory === 'All' || c.category === activeCategory;
        return matchQ && matchCat;
    });

    const stats = {
        total: campaigns.length,
        active: campaigns.filter(c => c.is_active).length,
        featured: campaigns.filter(c => c.is_featured).length,
        inactive: campaigns.filter(c => !c.is_active).length,
    };

    return (
        <div className="space-y-6 animate-fade-up">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="page-title">Offers & Ads</h1>
                    <p className="page-subtitle">Manage app banners and cashback offers</p>
                </div>
                <div className="flex items-center gap-3">
                    <button onClick={fetchCampaigns} className="enterprise-btn-secondary text-xs gap-1.5">
                        <RefreshCw size={13} className={loading ? 'animate-spin' : ''} /> Refresh
                    </button>
                    <button onClick={() => handleOpenModal()} className="enterprise-btn-primary">
                        <Plus size={16} /> Add New Offer
                    </button>
                </div>
            </div>

            {/* KPI Strip - Ultra Minimal */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                {[
                    { label: 'Total Banners', value: stats.total, icon: Layout },
                    { label: 'Currently Live', value: stats.active, icon: ToggleRight, active: true },
                    { label: 'Main Top Offers', value: stats.featured, icon: Star, featured: true },
                    { label: 'Hidden / Off', value: stats.inactive, icon: ToggleLeft },
                ].map(({ label, value, icon: Icon, active, featured }) => (
                    <div key={label} className="bg-white border border-slate-100 p-8 rounded-[20px] transition-all hover:border-slate-300">
                        <div className="flex justify-between items-start mb-4">
                            <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${active ? 'bg-emerald-50 text-emerald-600' : featured ? 'bg-amber-50 text-amber-600' : 'bg-slate-50 text-slate-400'}`}>
                                <Icon size={18} strokeWidth={2} />
                            </div>
                        </div>
                        <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-400 mb-1">{label}</p>
                        <p className="text-3xl font-bold text-slate-950 tabular-nums">{loading ? '—' : value}</p>
                    </div>
                ))}
            </div>

            {/* Filters */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
                <div className="relative flex-1 max-w-sm">
                    <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-300" size={14} />
                    <input
                        type="text"
                        placeholder="Search by title or brand..."
                        className="enterprise-input pl-9 h-10 text-sm"
                        value={searchTerm}
                        onChange={e => setSearchTerm(e.target.value)}
                    />
                </div>
                <div className="flex items-center gap-1 flex-wrap">
                    <Filter size={12} className="text-slate-400 mr-1" />
                    {CATEGORIES.map(cat => (
                        <button key={cat} onClick={() => setActiveCategory(cat)}
                            className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-all ${activeCategory === cat
                                ? 'bg-slate-900 text-white'
                                : 'bg-white text-slate-500 border border-slate-200 hover:border-slate-300'}`}>
                            {cat}
                        </button>
                    ))}
                </div>
            </div>

            {/* Table */}
            <div className="enterprise-card overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead>
                            <tr>
                                <th className="enterprise-table-header">Offer Name / Brand</th>
                                <th className="enterprise-table-header">Category</th>
                                <th className="enterprise-table-header">Cashback</th>
                                <th className="enterprise-table-header">Status</th>
                                <th className="enterprise-table-header">Featured</th>
                                <th className="enterprise-table-header text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-slate-50">
                            {loading ? (
                                [...Array(6)].map((_, i) => (
                                    <tr key={i}>{[...Array(6)].map((_, j) => (
                                        <td key={j} className="px-5 py-4">
                                            <div className="h-3.5 rounded bg-slate-100 animate-pulse" style={{ width: `${[70, 40, 30, 30, 25, 50][j]}%` }} />
                                        </td>
                                    ))}</tr>
                                ))
                            ) : filtered.length === 0 ? (
                                <tr><td colSpan={6} className="px-6 py-16 text-center">
                                    <Megaphone size={36} className="mx-auto text-slate-200 mb-3" />
                                    <p className="text-sm font-medium text-slate-400">No offers found</p>
                                </td></tr>
                            ) : filtered.map(camp => (
                                <tr key={camp.id} className="hover:bg-slate-50/80 transition-colors group">
                                    <td className="px-5 py-4">
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center border border-slate-200 overflow-hidden shrink-0">
                                                {camp.brand_logo_url
                                                    ? <img src={camp.brand_logo_url} alt="" className="w-8 h-8 object-contain" />
                                                    : <Megaphone size={16} className="text-slate-400" />}
                                            </div>
                                            <div>
                                                <p className="font-semibold text-slate-900 text-sm leading-tight">{camp.title}</p>
                                                <p className="text-xs text-slate-400 mt-0.5">{camp.brand_name}</p>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-5 py-4">
                                        <span className="inline-block px-2.5 py-1 bg-slate-100 text-slate-600 text-xs font-semibold rounded-lg">
                                            {camp.category}
                                        </span>
                                    </td>
                                    <td className="px-5 py-4">
                                        <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-emerald-50 text-emerald-700 border border-emerald-100 text-xs font-bold rounded-full">
                                            {camp.cashback_rate || '—'}
                                        </span>
                                    </td>
                                    <td className="px-5 py-4">
                                        <button onClick={() => toggleStatus(camp.id, camp.is_active)}
                                            className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold border transition-all ${camp.is_active
                                                ? 'bg-emerald-50 text-emerald-700 border-emerald-100 hover:bg-emerald-100'
                                                : 'bg-slate-50 text-slate-500 border-slate-200 hover:bg-slate-100'}`}>
                                            <span className={`w-1.5 h-1.5 rounded-full ${camp.is_active ? 'bg-emerald-500' : 'bg-slate-400'}`} />
                                            {camp.is_active ? 'Active' : 'Inactive'}
                                        </button>
                                    </td>
                                    <td className="px-5 py-4">
                                        {camp.is_featured
                                            ? <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-amber-50 text-amber-700 border border-amber-100 text-xs font-bold rounded-full"><Star size={10} /> Featured</span>
                                            : <span className="text-xs text-slate-300 font-medium">—</span>}
                                    </td>
                                    <td className="px-5 py-4">
                                        <div className="flex items-center justify-end gap-1">
                                            <button onClick={() => handleOpenModal(camp)}
                                                className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-all">
                                                <Edit2 size={15} />
                                            </button>
                                            <a href={camp.affiliate_link} target="_blank" rel="noreferrer"
                                                className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all">
                                                <ExternalLink size={15} />
                                            </a>
                                            <button onClick={() => deleteCampaign(camp.id)}
                                                className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all">
                                                <Trash2 size={15} />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
                {!loading && filtered.length > 0 && (
                    <div className="px-5 py-3 border-t border-slate-100 bg-slate-50/50 flex items-center justify-between">
                        <span className="text-xs text-slate-400">{filtered.length} campaign{filtered.length !== 1 ? 's' : ''}</span>
                    </div>
                )}
            </div>

            {/* Create/Edit Modal - Ultra Minimal */}
            <Modal
                isOpen={showModal}
                onClose={() => setShowModal(false)}
                title={editingCampaign ? 'Synchronize Campaign' : 'Initialize Campaign'}
                subtitle="Protocol Management"
                icon={<Megaphone />}
                maxWidth="max-w-3xl"
            >
                <div className="space-y-10">
                    <div className="grid grid-cols-2 gap-x-8 gap-y-6">
                        <div className="col-span-2 space-y-2">
                            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Campaign Title Descriptor</label>
                            <input
                                value={formData.title}
                                onChange={e => setFormData({ ...formData, title: e.target.value })}
                                className="enterprise-input h-12"
                                placeholder="e.g. Festival Season Protocol"
                            />
                        </div>

                        <div className="space-y-2">
                            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Merchant Identity</label>
                            <input
                                value={formData.brand_name}
                                onChange={e => setFormData({ ...formData, brand_name: e.target.value })}
                                className="enterprise-input h-12"
                                placeholder="Brand Name"
                            />
                        </div>

                        <div className="space-y-2">
                            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Primary Category</label>
                            <select
                                value={formData.category}
                                onChange={e => setFormData({ ...formData, category: e.target.value })}
                                className="enterprise-input h-12"
                            >
                                {CATEGORIES.filter(c => c !== 'All').map(c => <option key={c} value={c}>{c}</option>)}
                            </select>
                        </div>

                        <div className="space-y-2">
                            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Yield Quantum (Cashback)</label>
                            <input
                                value={formData.cashback_rate}
                                onChange={e => setFormData({ ...formData, cashback_rate: e.target.value })}
                                className="enterprise-input h-12"
                                placeholder="e.g. 10% Yield"
                            />
                        </div>

                        <div className="space-y-2">
                            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Display Sequence</label>
                            <input
                                type="number"
                                value={formData.display_order}
                                onChange={e => setFormData({ ...formData, display_order: parseInt(e.target.value) || 0 })}
                                className="enterprise-input h-12 font-bold"
                            />
                        </div>

                        <div className="col-span-2 space-y-2">
                            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Identity Asset (Logo URL)</label>
                            <input
                                value={formData.brand_logo_url}
                                onChange={e => setFormData({ ...formData, brand_logo_url: e.target.value })}
                                className="enterprise-input h-12 font-mono text-xs"
                                placeholder="https://assets.node/logo.png"
                            />
                        </div>

                        <div className="col-span-2 space-y-2">
                            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Uplink (Affiliate Link)</label>
                            <input
                                value={formData.affiliate_link}
                                onChange={e => setFormData({ ...formData, affiliate_link: e.target.value })}
                                className="enterprise-input h-12 font-mono text-xs text-slate-500"
                                placeholder="https://gateway.affiliate/..."
                            />
                        </div>

                        {/* Status Toggles */}
                        <div className="col-span-2 grid grid-cols-2 gap-4 pt-4">
                            {[
                                { key: 'is_active', label: 'Protocol Operational', sub: 'Visible to endpoint' },
                                { key: 'is_featured', label: 'Priority Matrix', sub: 'High visibility node' },
                            ].map(({ key, label, sub }) => (
                                <div key={key} className="flex items-center justify-between p-6 bg-slate-50/50 rounded-2xl border border-slate-100">
                                    <div>
                                        <p className="text-xs font-bold text-slate-900 uppercase tracking-tight">{label}</p>
                                        <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-0.5">{sub}</p>
                                    </div>
                                    <label className="relative inline-flex items-center cursor-pointer">
                                        <input type="checkbox" checked={(formData as any)[key]}
                                            onChange={e => setFormData({ ...formData, [key]: e.target.checked })} className="sr-only peer" />
                                        <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-slate-900" />
                                    </label>
                                </div>
                            ))}
                        </div>

                        {formData.is_featured && (
                            <div className="col-span-2 space-y-2 animate-in slide-in-from-top-2">
                                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Matrix Banner (URL)</label>
                                <input
                                    value={formData.featured_image_url}
                                    onChange={e => setFormData({ ...formData, featured_image_url: e.target.value })}
                                    className="enterprise-input h-12 font-mono text-xs"
                                    placeholder="https://assets.node/banner.png"
                                />
                            </div>
                        )}
                    </div>

                    <div className="flex gap-4 pt-4">
                        <button
                            onClick={() => setShowModal(false)}
                            className="flex-1 h-14 rounded-2xl border border-slate-200 text-slate-500 font-bold text-xs uppercase tracking-[0.2em] hover:bg-slate-50 transition-all active:scale-95"
                        >
                            Abort
                        </button>
                        <button
                            onClick={handleSave}
                            disabled={saving}
                            className="flex-[2] h-14 bg-slate-900 text-white rounded-2xl font-bold text-xs uppercase tracking-[0.2em] hover:bg-black transition-all active:scale-95 flex items-center justify-center gap-3 disabled:opacity-50"
                        >
                            {saving ? <Loader2 className="animate-spin w-5 h-5" /> : <><ArrowRight size={18} strokeWidth={2.5} /> {editingCampaign ? 'Synchronize Changes' : 'Deploy Protocol'}</>}
                        </button>
                    </div>
                </div>
            </Modal>
        </div>
    );
};

export default Campaigns;
