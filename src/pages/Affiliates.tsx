import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import {
    Plus, Trash2, Edit2, Search,
    ExternalLink, Loader2, Link2, Zap, RefreshCw, ArrowRight, ShieldCheck, Users
} from 'lucide-react';
import Modal from '../components/Modal';

const CATEGORIES = ['All', 'Shopping', 'Electronics', 'Fashion', 'Travel', 'Finance', 'Food'];

const EMPTY_FORM = { title: '', brand_name: '', brand_logo_url: '', cashback_rate: '', affiliate_link: '', category: 'Shopping' };

export default function Affiliates() {
    const [campaigns, setCampaigns] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [activeCategory, setActiveCategory] = useState('All');
    const [editingId, setEditingId] = useState<string | null>(null);
    const [form, setForm] = useState({ ...EMPTY_FORM });
    const [saving, setSaving] = useState(false);

    useEffect(() => { fetchCampaigns(); }, []);

    const fetchCampaigns = async () => {
        setLoading(true);
        const { data } = await supabase.from('affiliate_campaigns').select('*').order('display_order', { ascending: true }).order('created_at', { ascending: false });
        if (data) setCampaigns(data);
        setLoading(false);
    };

    const handleSave = async () => {
        if (!form.title || !form.brand_name || !form.affiliate_link) { alert('Title, Brand and Link required'); return; }
        setSaving(true);
        if (editingId) {
            await supabase.from('affiliate_campaigns').update(form).eq('id', editingId);
        } else {
            await supabase.from('affiliate_campaigns').insert(form);
        }
        setSaving(false);
        setShowModal(false);
        fetchCampaigns();
    };

    const handleEdit = (item: any) => {
        setEditingId(item.id);
        setForm({ title: item.title, brand_name: item.brand_name, brand_logo_url: item.brand_logo_url || '', cashback_rate: item.cashback_rate, affiliate_link: item.affiliate_link, category: item.category });
        setShowModal(true);
    };

    const handleDelete = async (id: string) => {
        if (!confirm('Remove this partner?')) return;
        await supabase.from('affiliate_campaigns').delete().eq('id', id);
        fetchCampaigns();
    };

    const filtered = campaigns.filter(c => {
        const q = searchTerm.toLowerCase();
        const matchQ = (c.brand_name + c.title).toLowerCase().includes(q);
        const matchCat = activeCategory === 'All' || c.category === activeCategory;
        return matchQ && matchCat;
    });

    const openNew = () => { setEditingId(null); setForm({ ...EMPTY_FORM }); setShowModal(true); };

    return (
        <div className="space-y-6 animate-fade-up">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="page-title">Affiliate Partners</h1>
                    <p className="page-subtitle">Manage your partners and cashback offers</p>
                </div>
                <div className="flex items-center gap-3">
                    <button onClick={fetchCampaigns} className="enterprise-btn-secondary text-xs gap-1.5">
                        <RefreshCw size={13} className={loading ? 'animate-spin' : ''} />
                    </button>
                    <button onClick={openNew} className="enterprise-btn-primary">
                        <Plus size={16} /> Add New Partner
                    </button>
                </div>
            </div>

            {/* KPI Strip - Ultra Minimal */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                {[
                    { label: 'Total Partners', value: campaigns.length, icon: Users },
                    { label: 'Shopping Partners', value: campaigns.filter(c => c.category === 'Shopping').length, icon: ShieldCheck, active: true },
                    { label: 'Other Partners', value: campaigns.filter(c => c.category !== 'Shopping').length, icon: Zap, velocity: true },
                    { label: 'New Updates', value: 0, icon: RefreshCw },
                ].map(({ label, value, icon: Icon, active, velocity }) => (
                    <div key={label} className="bg-white border border-slate-100 p-8 rounded-[20px] transition-all hover:border-slate-300">
                        <div className="flex justify-between items-start mb-4">
                            <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${active ? 'bg-emerald-50 text-emerald-600' : velocity ? 'bg-amber-50 text-amber-600' : 'bg-slate-50 text-slate-400'}`}>
                                <Icon size={18} strokeWidth={2} />
                            </div>
                        </div>
                        <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-400 mb-1">{label}</p>
                        <p className="text-3xl font-bold text-slate-950 tabular-nums">{loading ? '—' : value}</p>
                    </div>
                ))}
            </div>

            {/* Filters */}
            <div className="flex items-center gap-3 flex-wrap">
                <div className="relative">
                    <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-300" size={14} />
                    <input
                        type="text" placeholder="Search affiliates..."
                        className="enterprise-input pl-9 h-10 text-sm w-56"
                        value={searchTerm} onChange={e => setSearchTerm(e.target.value)}
                    />
                </div>
                <div className="flex gap-1 flex-wrap">
                    {CATEGORIES.map(cat => (
                        <button key={cat} onClick={() => setActiveCategory(cat)}
                            className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-all ${activeCategory === cat
                                ? 'bg-slate-900 text-white' : 'bg-white border border-slate-200 text-slate-500 hover:border-slate-300'}`}>
                            {cat}
                        </button>
                    ))}
                </div>
            </div>

            {/* Cards Grid - Ultra Minimal */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {loading ? (
                    [...Array(8)].map((_, i) => (
                        <div key={i} className="bg-white border border-slate-100 rounded-[20px] p-8 space-y-6">
                            <div className="flex items-center gap-4">
                                <div className="w-14 h-14 rounded-2xl bg-slate-50 animate-pulse" />
                                <div className="flex-1 space-y-2">
                                    <div className="h-4 bg-slate-50 rounded animate-pulse w-3/4" />
                                    <div className="h-2 bg-slate-50 rounded animate-pulse w-1/2" />
                                </div>
                            </div>
                            <div className="h-4 bg-slate-50 rounded animate-pulse" />
                            <div className="h-10 bg-slate-50 rounded-xl animate-pulse" />
                        </div>
                    ))
                ) : filtered.length === 0 ? (
                    <div className="col-span-full py-20 text-center bg-white border border-dashed border-slate-200 rounded-[32px]">
                        <RefreshCw size={40} className="mx-auto text-slate-200 mb-4" />
                        <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">No Partners Found</p>
                    </div>
                ) : filtered.map(cam => (
                    <div key={cam.id} className="bg-white border border-slate-100 rounded-[24px] p-8 transition-all hover:border-slate-300 group relative">
                        {/* Status Label */}
                        <div className="absolute top-8 right-8 px-3 py-1 bg-emerald-50 text-emerald-600 rounded-full text-[9px] font-black uppercase tracking-widest">
                            Active
                        </div>

                        <div className="flex items-center gap-5 mb-8">
                            <div className="w-14 h-14 bg-slate-50 border border-slate-100 rounded-2xl flex items-center justify-center p-2.5 shrink-0 group-hover:bg-slate-900 group-hover:text-white transition-all duration-300">
                                {cam.brand_logo_url ? (
                                    <img src={cam.brand_logo_url} alt={cam.brand_name} className="w-full h-full object-contain" />
                                ) : (
                                    <Zap size={20} />
                                )}
                            </div>
                            <div className="min-w-0 flex-1">
                                <h3 className="font-bold text-slate-950 tracking-tight text-lg leading-tight truncate">{cam.brand_name}</h3>
                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1.5">{cam.category}</p>
                            </div>
                        </div>

                        <p className="text-xs font-medium text-slate-600 line-clamp-2 mb-8 leading-relaxed h-8">{cam.title}</p>

                        <div className="pt-8 border-t border-slate-50 flex items-center justify-between">
                            <div className="space-y-1">
                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Cashback Amount</p>
                                <p className="text-lg font-bold text-slate-950">{cam.cashback_rate || '0% Cashback'}</p>
                            </div>
                            <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-all translate-x-4 group-hover:translate-x-0">
                                <button
                                    onClick={() => handleEdit(cam)}
                                    className="w-10 h-10 rounded-xl bg-slate-50 text-slate-400 flex items-center justify-center hover:bg-slate-900 hover:text-white transition-all"
                                >
                                    <Edit2 size={16} />
                                </button>
                                <button
                                    onClick={() => handleDelete(cam.id)}
                                    className="w-10 h-10 rounded-xl bg-slate-50 text-slate-400 flex items-center justify-center hover:bg-red-50 hover:text-red-500 transition-all"
                                >
                                    <Trash2 size={16} />
                                </button>
                                {cam.affiliate_link && (
                                    <a href={cam.affiliate_link} target="_blank" rel="noreferrer"
                                        className="w-10 h-10 bg-slate-950 text-white rounded-xl flex items-center justify-center hover:bg-black transition-all"
                                    >
                                        <ExternalLink size={16} strokeWidth={2.5} />
                                    </a>
                                )}
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {/* Affiliate Modal - Ultra Minimal */}
            <Modal
                isOpen={showModal}
                onClose={() => setShowModal(false)}
                title={editingId ? 'Edit Partner' : 'Add Partner'}
                subtitle="Partner Details"
                icon={<Link2 />}
                maxWidth="max-w-xl"
            >
                <div className="space-y-8">
                    <div className="space-y-6">
                        <div className="space-y-2">
                            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Partner Name</label>
                            <input
                                value={form.brand_name}
                                onChange={e => setForm({ ...form, brand_name: e.target.value })}
                                className="enterprise-input h-12"
                                placeholder="e.g. Amazon"
                            />
                        </div>

                        <div className="space-y-2">
                            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Offer Title</label>
                            <input
                                value={form.title}
                                onChange={e => setForm({ ...form, title: e.target.value })}
                                className="enterprise-input h-12"
                                placeholder="e.g. Big Summer Sale"
                            />
                        </div>

                        <div className="grid grid-cols-2 gap-6">
                            <div className="space-y-2">
                                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Category</label>
                                <select
                                    value={form.category}
                                    onChange={e => setForm({ ...form, category: e.target.value })}
                                    className="enterprise-input h-12"
                                >
                                    {CATEGORIES.filter(c => c !== 'All').map(c => <option key={c} value={c}>{c}</option>)}
                                </select>
                            </div>
                            <div className="space-y-2">
                                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Cashback Amount</label>
                                <input
                                    value={form.cashback_rate}
                                    onChange={e => setForm({ ...form, cashback_rate: e.target.value })}
                                    className="enterprise-input h-12"
                                    placeholder="e.g. 10%"
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Asset Uplink (Logo URL)</label>
                            <input
                                value={form.brand_logo_url}
                                onChange={e => setForm({ ...form, brand_logo_url: e.target.value })}
                                className="enterprise-input h-12 font-mono text-xs"
                                placeholder="https://assets.node/logo.png"
                            />
                        </div>

                        <div className="space-y-2">
                            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Protocol Gateway (Affiliate Link)</label>
                            <input
                                value={form.affiliate_link}
                                onChange={e => setForm({ ...form, affiliate_link: e.target.value })}
                                className="enterprise-input h-12 font-mono text-xs text-slate-500"
                                placeholder="https://external.gateway/..."
                            />
                        </div>
                    </div>

                    <div className="flex gap-4 pt-4 border-t border-slate-100 mt-4">
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
                            {saving ? <Loader2 className="animate-spin w-5 h-5" /> : <><ArrowRight size={18} strokeWidth={2.5} /> {editingId ? 'Push Synchronization' : 'Initialize Protocol'}</>}
                        </button>
                    </div>
                </div>
            </Modal>
        </div>
    );
}
