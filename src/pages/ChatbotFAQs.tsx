import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { Plus, Edit2, Trash2, Search, RefreshCw, MessageCircle, CheckCircle, XCircle, Hash, ShieldCheck } from 'lucide-react';
import Modal from '../components/Modal';

const CATEGORIES = ['all', 'general', 'wallet', 'recharge', 'cashback', 'referral', 'technical'];

export default function ChatbotFAQs() {
    const [faqs, setFaqs] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [modalVisible, setModalVisible] = useState(false);
    const [filterCategory, setFilterCategory] = useState('all');
    const [searchTerm, setSearchTerm] = useState('');

    const [editingId, setEditingId] = useState<string | null>(null);
    const [category, setCategory] = useState('general');
    const [question, setQuestion] = useState('');
    const [answer, setAnswer] = useState('');
    const [keywords, setKeywords] = useState('');
    const [priority, setPriority] = useState('5');
    const [isActive, setIsActive] = useState(true);

    useEffect(() => { fetchFAQs(); }, []);

    const fetchFAQs = async () => {
        setLoading(true);
        const { data } = await supabase.from('chatbot_faqs').select('*').order('priority', { ascending: false }).order('created_at', { ascending: false });
        if (data) setFaqs(data);
        setLoading(false);
    };

    const handleSave = async () => {
        if (!question || !answer) { alert('Question and Answer are required'); return; }
        const payload = { category, question, answer, keywords: keywords.split(',').map(k => k.trim()).filter(Boolean), priority: parseInt(priority), is_active: isActive, updated_at: new Date().toISOString() };
        if (editingId) {
            await supabase.from('chatbot_faqs').update(payload).eq('id', editingId);
        } else {
            await supabase.from('chatbot_faqs').insert(payload);
        }
        setModalVisible(false);
        resetForm();
        fetchFAQs();
    };

    const handleEdit = (faq: any) => {
        setEditingId(faq.id); setCategory(faq.category); setQuestion(faq.question);
        setAnswer(faq.answer); setKeywords(faq.keywords?.join(', ') || '');
        setPriority(faq.priority.toString()); setIsActive(faq.is_active);
        setModalVisible(true);
    };

    const handleDelete = async (id: string) => {
        if (!confirm('Delete this FAQ?')) return;
        await supabase.from('chatbot_faqs').delete().eq('id', id);
        fetchFAQs();
    };

    const resetForm = () => { setEditingId(null); setCategory('general'); setQuestion(''); setAnswer(''); setKeywords(''); setPriority('5'); setIsActive(true); };

    const filtered = faqs.filter(f => {
        const q = searchTerm.toLowerCase();
        const matchQ = f.question?.toLowerCase().includes(q) || f.answer?.toLowerCase().includes(q);
        const matchCat = filterCategory === 'all' || f.category === filterCategory;
        return matchQ && matchCat;
    });

    const stats = {
        total: faqs.length,
        active: faqs.filter(f => f.is_active).length,
        inactive: faqs.filter(f => !f.is_active).length,
    };

    return (
        <div className="space-y-6 animate-fade-up">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="page-title">Help & FAQs</h1>
                    <p className="page-subtitle">Manage questions for the in-app chatbot help section</p>
                </div>
                <div className="flex items-center gap-2">
                    <button onClick={fetchFAQs} className="enterprise-btn-secondary text-xs gap-1.5">
                        <RefreshCw size={13} className={loading ? 'animate-spin' : ''} /> Refresh
                    </button>
                    <button onClick={() => { resetForm(); setModalVisible(true); }} className="enterprise-btn-primary">
                        <Plus size={16} /> Add FAQ
                    </button>
                </div>
            </div>

            {/* KPI Strip */}
            <div className="grid grid-cols-3 gap-4">
                {[
                    { label: 'Total FAQs', value: stats.total, icon: <MessageCircle size={16} />, color: 'text-indigo-600', bg: 'bg-indigo-50' },
                    { label: 'Active', value: stats.active, icon: <CheckCircle size={16} />, color: 'text-emerald-600', bg: 'bg-emerald-50' },
                    { label: 'Inactive', value: stats.inactive, icon: <XCircle size={16} />, color: 'text-red-500', bg: 'bg-red-50' },
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

            {/* Filters */}
            <div className="flex flex-wrap gap-3 items-center">
                <div className="relative max-w-sm">
                    <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-300" size={14} />
                    <input type="text" placeholder="Search FAQs..."
                        className="enterprise-input pl-9 h-10 text-sm"
                        value={searchTerm} onChange={e => setSearchTerm(e.target.value)} />
                </div>
                <div className="flex items-center gap-1 bg-white border border-slate-200 rounded-xl p-1">
                    {CATEGORIES.map(cat => (
                        <button key={cat} onClick={() => setFilterCategory(cat)}
                            className={`px-3 py-1.5 rounded-lg text-xs font-semibold capitalize transition-all ${filterCategory === cat ? 'bg-slate-900 text-white shadow-sm' : 'text-slate-500 hover:text-slate-800'}`}>
                            {cat === 'all' ? 'All' : cat}
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
                                <th className="enterprise-table-header">Question</th>
                                <th className="enterprise-table-header">Answer</th>
                                <th className="enterprise-table-header">Category</th>
                                <th className="enterprise-table-header">Priority</th>
                                <th className="enterprise-table-header">Keywords</th>
                                <th className="enterprise-table-header">Status</th>
                                <th className="enterprise-table-header text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-slate-50">
                            {loading ? (
                                [...Array(6)].map((_, i) => (
                                    <tr key={i}>{[...Array(7)].map((_, j) => (
                                        <td key={j} className="px-5 py-4">
                                            <div className="h-3.5 rounded bg-slate-100 animate-pulse" style={{ width: `${[80, 60, 35, 20, 50, 30, 40][j]}%` }} />
                                        </td>
                                    ))}</tr>
                                ))
                            ) : filtered.length === 0 ? (
                                <tr><td colSpan={7} className="py-16 text-center">
                                    <MessageCircle size={32} className="mx-auto text-slate-200 mb-3" />
                                    <p className="text-slate-400 text-sm font-medium">No FAQs found</p>
                                </td></tr>
                            ) : filtered.map(faq => (
                                <tr key={faq.id} className="enterprise-table-row group">
                                    <td className="px-5 py-4 max-w-[220px]">
                                        <p className="text-sm font-semibold text-slate-800 line-clamp-2">{faq.question}</p>
                                    </td>
                                    <td className="px-5 py-4 max-w-[280px]">
                                        <p className="text-xs text-slate-500 line-clamp-2">{faq.answer}</p>
                                    </td>
                                    <td className="px-5 py-4">
                                        <span className="inline-block px-2.5 py-1 bg-indigo-50 text-indigo-700 text-xs font-bold rounded-lg capitalize">
                                            {faq.category}
                                        </span>
                                    </td>
                                    <td className="px-5 py-4">
                                        <div className="flex items-center gap-1">
                                            <Hash size={10} className="text-slate-300" />
                                            <span className="text-xs font-mono font-semibold text-slate-600">{faq.priority}</span>
                                        </div>
                                    </td>
                                    <td className="px-5 py-4">
                                        <div className="flex flex-wrap gap-1">
                                            {(faq.keywords || []).slice(0, 3).map((kw: string, i: number) => (
                                                <span key={i} className="px-1.5 py-0.5 bg-slate-100 text-slate-500 rounded text-[10px] font-medium">{kw}</span>
                                            ))}
                                            {faq.keywords?.length > 3 && <span className="text-[10px] text-slate-400">+{faq.keywords.length - 3}</span>}
                                        </div>
                                    </td>
                                    <td className="px-5 py-4">
                                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold border ${faq.is_active ? 'bg-emerald-50 text-emerald-700 border-emerald-100' : 'bg-slate-50 text-slate-500 border-slate-200'}`}>
                                            <span className={`w-1.5 h-1.5 rounded-full ${faq.is_active ? 'bg-emerald-500' : 'bg-slate-400'}`} />
                                            {faq.is_active ? 'Active' : 'Inactive'}
                                        </span>
                                    </td>
                                    <td className="px-5 py-4">
                                        <div className="flex justify-end gap-1">
                                            <button onClick={() => handleEdit(faq)} className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition"><Edit2 size={14} /></button>
                                            <button onClick={() => handleDelete(faq.id)} className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition"><Trash2 size={14} /></button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* FAQ Modal */}
            <Modal
                isOpen={modalVisible}
                onClose={() => setModalVisible(false)}
                title={editingId ? 'Edit FAQ' : 'Add FAQ'}
                subtitle="Knowledge Base Oracle"
                icon={editingId ? <Edit2 size={28} strokeWidth={2.5} /> : <Plus size={28} strokeWidth={2.5} />}
                maxWidth="max-w-xl"
            >
                <div className="space-y-6">
                    <div className="grid grid-cols-2 gap-6">
                        <div className="space-y-2">
                            <label className="text-xs font-semibold text-slate-500 ml-1">Knowledge Category</label>
                            <div className="relative">
                                <select value={category} onChange={e => setCategory(e.target.value)}
                                    className="enterprise-input h-12 pl-11 appearance-none bg-white font-semibold capitalize">
                                    {CATEGORIES.filter(c => c !== 'all').map(cat => <option key={cat} value={cat}>{cat}</option>)}
                                </select>
                                <Hash className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={16} />
                                <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">
                                    <svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="2"><path d="m3 4.5 3 3 3-3" /></svg>
                                </div>
                            </div>
                        </div>
                        <div className="space-y-2">
                            <label className="text-xs font-semibold text-slate-500 ml-1">Search Priority (0-10)</label>
                            <input type="number" min={0} max={10} value={priority} onChange={e => setPriority(e.target.value)}
                                className="enterprise-input h-12 font-bold tabular-nums" />
                        </div>

                        <div className="col-span-2 space-y-2">
                            <label className="text-xs font-semibold text-slate-500 ml-1">User Question</label>
                            <input value={question} onChange={e => setQuestion(e.target.value)}
                                className="enterprise-input h-12 font-semibold text-base" placeholder="How do I recharge my mobile?" />
                        </div>

                        <div className="col-span-2 space-y-2">
                            <label className="text-xs font-semibold text-slate-500 ml-1">Automated Resolution (Answer)</label>
                            <textarea value={answer} onChange={e => setAnswer(e.target.value)}
                                className="enterprise-input min-h-[120px] py-4 resize-none leading-relaxed" placeholder="To recharge your mobile, go to..." />
                        </div>

                        <div className="col-span-2 space-y-2">
                            <label className="text-xs font-semibold text-slate-500 ml-1">NLP Keywords (comma-separated)</label>
                            <input value={keywords} onChange={e => setKeywords(e.target.value)}
                                className="enterprise-input h-12 font-mono text-sm pl-11" placeholder="recharge, mobile, prepaid" />
                            <Search className="absolute left-4 bottom-3 text-slate-300" size={16} />
                        </div>

                        <div className="col-span-2 flex items-center justify-between p-5 bg-slate-50 rounded-2xl border border-slate-100 mt-2">
                            <div className="flex items-center gap-3">
                                <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${isActive ? 'bg-emerald-100 text-emerald-600' : 'bg-slate-200 text-slate-500'}`}>
                                    {isActive ? <CheckCircle size={20} /> : <XCircle size={20} />}
                                </div>
                                <div>
                                    <p className="text-sm font-bold text-slate-800">FAQ Visibility</p>
                                    <p className="text-[10px] font-medium text-slate-400 uppercase tracking-wider">Visible to all users</p>
                                </div>
                            </div>
                            <label className="relative inline-flex items-center cursor-pointer">
                                <input type="checkbox" checked={isActive} onChange={e => setIsActive(e.target.checked)} className="sr-only peer" />
                                <div className="w-12 h-6.5 bg-slate-200 rounded-full peer peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-[2.5px] after:left-[3px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600" />
                            </label>
                        </div>
                    </div>

                    <button onClick={handleSave}
                        className="w-full mt-4 enterprise-btn-primary justify-center h-12 text-base">
                        <ShieldCheck size={18} strokeWidth={2.5} />
                        <span>{editingId ? 'Update Knowledge Base' : 'Commit New FAQ'}</span>
                    </button>
                </div>
            </Modal>
        </div>
    );
}
