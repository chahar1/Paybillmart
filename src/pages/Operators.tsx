import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import {
    Search,
    Edit2,
    Plus,
    Network,
    Zap,
    Globe,
    ShieldCheck,
    Activity,
    Loader2
} from 'lucide-react';
import Modal from '../components/Modal';

interface Operator {
    id: string;
    service_id: string;
    name: string;
    code: string;
    logo: string | null;
    is_active: boolean;
    commission_rate: number;
    cashback_rate: number;
    display_order: number;
    services: {
        name: string;
    };
}

interface Service {
    id: string;
    name: string;
}

export default function Operators() {
    const [operators, setOperators] = useState<Operator[]>([]);
    const [services, setServices] = useState<Service[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [activeServiceFilter, setActiveServiceFilter] = useState('all');

    // Modal State
    const [showModal, setShowModal] = useState(false);
    const [editingOperator, setEditingOperator] = useState<Operator | null>(null);
    const [saving, setSaving] = useState(false);
    const [formData, setFormData] = useState({
        service_id: '',
        name: '',
        code: '',
        commission_rate: '0',
        cashback_rate: '0',
        logo: ''
    });

    useEffect(() => {
        fetchOperators();
        fetchServices();
    }, []);

    const fetchOperators = async () => {
        setLoading(true);
        try {
            const { data, error } = await supabase
                .from('operators')
                .select(`
                    *,
                    services!inner(name)
                `)
                .order('display_order');

            if (error) throw error;
            setOperators(data || []);
        } catch (error) {
            console.error('Error fetching operators:', error);
        } finally {
            setLoading(false);
        }
    };

    const fetchServices = async () => {
        const { data } = await supabase.from('services').select('id, name').eq('is_active', true);
        if (data) setServices(data);
    };

    const handleAdd = () => {
        setEditingOperator(null);
        setFormData({
            service_id: services[0]?.id || '',
            name: '',
            code: '',
            commission_rate: '0',
            cashback_rate: '0',
            logo: ''
        });
        setShowModal(true);
    };

    const handleEdit = (op: Operator) => {
        setEditingOperator(op);
        setFormData({
            service_id: op.service_id,
            name: op.name,
            code: op.code,
            commission_rate: op.commission_rate.toString(),
            cashback_rate: op.cashback_rate.toString(),
            logo: op.logo || ''
        });
        setShowModal(true);
    };

    const handleSave = async () => {
        if (!formData.name || !formData.code || !formData.service_id) {
            return;
        }

        setSaving(true);
        try {
            const payload = {
                service_id: formData.service_id,
                name: formData.name,
                code: formData.code.toUpperCase(),
                commission_rate: parseFloat(formData.commission_rate),
                cashback_rate: parseFloat(formData.cashback_rate),
                logo: formData.logo || null
            };

            if (editingOperator) {
                const { error } = await supabase
                    .from('operators')
                    .update(payload)
                    .eq('id', editingOperator.id);
                if (error) throw error;
            } else {
                const { error } = await supabase
                    .from('operators')
                    .insert(payload);
                if (error) throw error;
            }

            setShowModal(false);
            fetchOperators();
        } catch (error: any) {
            console.error('Error saving:', error);
        } finally {
            setSaving(false);
        }
    };

    const toggleStatus = async (id: string, currentStatus: boolean) => {
        try {
            const { error } = await supabase
                .from('operators')
                .update({ is_active: !currentStatus })
                .eq('id', id);

            if (error) throw error;
            fetchOperators();
        } catch (error: any) {
            console.error('Error:', error);
        }
    };

    const filteredOperators = operators.filter((op) => {
        const matchesSearch =
            op.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            op.code.toLowerCase().includes(searchTerm.toLowerCase());

        const matchesService = activeServiceFilter === 'all' || op.service_id === activeServiceFilter;

        return matchesSearch && matchesService;
    });

    return (
        <div className="space-y-6 animate-fade-up">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="page-title">Companies (Airtel, Jio etc)</h1>
                    <p className="page-subtitle">Manage recharge companies and your profit/discount settings</p>
                </div>
                <div className="flex items-center gap-2">
                    <button onClick={fetchOperators} className="enterprise-btn-secondary text-xs gap-1.5">
                        <Network size={13} className={loading ? 'animate-spin' : ''} /> Refresh
                    </button>
                    <button onClick={handleAdd} className="enterprise-btn-primary">
                        <Plus size={16} /> Add New Company
                    </button>
                </div>
            </div>

            {/* KPI Strip */}
            <div className="grid grid-cols-3 gap-4">
                {[
                    { label: 'Total Companies', value: operators.length, icon: <Network size={16} />, color: 'text-indigo-600', bg: 'bg-indigo-50' },
                    { label: 'Working', value: operators.filter(o => o.is_active).length, icon: <Activity size={16} />, color: 'text-emerald-600', bg: 'bg-emerald-50' },
                    { label: 'Stopped', value: operators.filter(o => !o.is_active).length, icon: <Globe size={16} />, color: 'text-slate-500', bg: 'bg-slate-100' },
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
                <div className="relative">
                    <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-300" size={14} />
                    <input type="text" placeholder="Search by name..."
                        className="enterprise-input pl-9 h-10 text-sm w-56"
                        value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
                </div>
                <div className="flex items-center gap-1 bg-white border border-slate-200 rounded-xl p-1">
                    <button onClick={() => setActiveServiceFilter('all')}
                        className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${activeServiceFilter === 'all' ? 'bg-slate-900 text-white shadow-sm' : 'text-slate-500 hover:text-slate-800'
                            }`}>All</button>
                    {services.map(service => (
                        <button key={service.id} onClick={() => setActiveServiceFilter(service.id)}
                            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${activeServiceFilter === service.id ? 'bg-slate-900 text-white shadow-sm' : 'text-slate-500 hover:text-slate-800'
                                }`}>{service.name}</button>
                    ))}
                </div>
                <span className="ml-auto text-xs font-semibold text-slate-400">{filteredOperators.length} records</span>
            </div>

            {/* Operators Table */}
            <div className="enterprise-card overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="min-w-full">
                        <thead>
                            <tr>
                                <th className="enterprise-table-header">Company</th>
                                <th className="enterprise-table-header">Work Type</th>
                                <th className="enterprise-table-header text-center">Your Profit</th>
                                <th className="enterprise-table-header text-center">User Discount</th>
                                <th className="enterprise-table-header text-center">Status</th>
                                <th className="enterprise-table-header text-right">Edit</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-slate-50">
                            {loading ? (
                                [...Array(5)].map((_, i) => (
                                    <tr key={i}>{[...Array(6)].map((_, j) => (
                                        <td key={j} className="px-5 py-4">
                                            <div className="h-3.5 rounded bg-slate-100 animate-pulse" style={{ width: `${[65, 35, 25, 25, 30, 20][j]}%` }} />
                                        </td>
                                    ))}</tr>
                                ))
                            ) : filteredOperators.length === 0 ? (
                                <tr><td colSpan={6} className="py-16 text-center">
                                    <Globe size={32} className="mx-auto text-slate-200 mb-3" />
                                    <p className="text-slate-400 text-sm font-medium">No operators found</p>
                                </td></tr>
                            ) : (
                                filteredOperators.map((op) => (
                                    <tr key={op.id} className="enterprise-table-row group">
                                        <td className="px-5 py-3.5">
                                            <div className="flex items-center gap-3">
                                                <div className="w-9 h-9 rounded-xl bg-white border-2 border-slate-100 flex items-center justify-center font-bold text-slate-400 text-xs shadow-sm shrink-0">
                                                    {op.logo ? (
                                                        <img src={op.logo} alt={op.name} className="w-6 h-6 object-contain" />
                                                    ) : (
                                                        <span>{op.name.substring(0, 2).toUpperCase()}</span>
                                                    )}
                                                </div>
                                                <div>
                                                    <p className="text-sm font-semibold text-slate-800 group-hover:text-indigo-600 transition-colors">{op.name}</p>
                                                    <code className="text-[10px] font-mono text-slate-400">{op.code}</code>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-5 py-3.5">
                                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-slate-100 text-slate-600 text-xs font-semibold rounded-lg">
                                                <Zap size={10} className="text-amber-500" /> {op.services.name}
                                            </span>
                                        </td>
                                        <td className="px-5 py-3.5 text-center">
                                            <span className="text-sm font-bold text-indigo-600 tabular-nums">{op.commission_rate}%</span>
                                        </td>
                                        <td className="px-5 py-3.5 text-center">
                                            <span className="text-sm font-bold text-emerald-600 tabular-nums">{op.cashback_rate}%</span>
                                        </td>
                                        <td className="px-5 py-3.5 text-center">
                                            <button onClick={() => toggleStatus(op.id, op.is_active)}
                                                className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold border transition-all ${op.is_active ? 'bg-emerald-50 text-emerald-700 border-emerald-100 hover:bg-emerald-100' : 'bg-slate-50 text-slate-500 border-slate-200 hover:bg-slate-100'
                                                    }`}>
                                                <span className={`w-1.5 h-1.5 rounded-full ${op.is_active ? 'bg-emerald-500' : 'bg-slate-400'}`} />
                                                {op.is_active ? 'Active' : 'Inactive'}
                                            </button>
                                        </td>
                                        <td className="px-5 py-3.5">
                                            <div className="flex justify-end">
                                                <button onClick={() => handleEdit(op)} className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition">
                                                    <Edit2 size={14} />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Add/Edit Operator Modal */}
            <Modal
                isOpen={showModal}
                onClose={() => setShowModal(false)}
                title={editingOperator ? 'Edit Company' : 'Add New Company'}
                subtitle="Company Settings"
                icon={editingOperator ? <Edit2 size={28} strokeWidth={2.5} /> : <Plus size={28} strokeWidth={2.5} />}
                maxWidth="max-w-2xl"
            >
                <div className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                            <label className="text-xs font-semibold text-slate-500 ml-1">Company Name</label>
                            <input type="text" placeholder="e.g. Airtel" className="enterprise-input h-12 text-base font-semibold"
                                value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} />
                        </div>
                        <div className="space-y-2">
                            <label className="text-xs font-semibold text-slate-500 ml-1">System Code</label>
                            <div className="relative">
                                <input type="text" placeholder="AIRTEL" className="enterprise-input h-12 text-sm font-mono uppercase pl-11 text-indigo-600 font-bold"
                                    value={formData.code} onChange={(e) => setFormData({ ...formData, code: e.target.value })} />
                                <Network className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={16} />
                            </div>
                        </div>
                    </div>

                    <div className="space-y-2">
                        <label className="text-xs font-semibold text-slate-500 ml-1">Main Service</label>
                        <div className="relative">
                            <select className="enterprise-input h-12 text-sm pl-11 appearance-none bg-white font-semibold"
                                value={formData.service_id} onChange={(e) => setFormData({ ...formData, service_id: e.target.value })}>
                                {services.map(s => (<option key={s.id} value={s.id}>{s.name}</option>))}
                            </select>
                            <Zap className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={16} />
                            <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none">
                                <svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-slate-400"><path d="m3 4.5 3 3 3-3" /></svg>
                            </div>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-6">
                        <div className="space-y-2 text-indigo-600">
                            <label className="text-xs font-semibold text-slate-500 ml-1">Your Profit (%)</label>
                            <input type="number" step="0.01" className="enterprise-input h-12 text-base font-bold tabular-nums border-indigo-100 bg-indigo-50/10"
                                value={formData.commission_rate} onChange={(e) => setFormData({ ...formData, commission_rate: e.target.value })} />
                        </div>
                        <div className="space-y-2 text-emerald-600">
                            <label className="text-xs font-semibold text-slate-500 ml-1">User Discount (%)</label>
                            <input type="number" step="0.01" className="enterprise-input h-12 text-base font-bold tabular-nums border-emerald-100 bg-emerald-50/10"
                                value={formData.cashback_rate} onChange={(e) => setFormData({ ...formData, cashback_rate: e.target.value })} />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <label className="text-xs font-semibold text-slate-500 ml-1">Company Icon Link (optional)</label>
                        <div className="relative">
                            <input type="text" placeholder="https://..." className="enterprise-input h-12 text-xs font-mono pl-11"
                                value={formData.logo} onChange={(e) => setFormData({ ...formData, logo: e.target.value })} />
                            <Globe className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={16} />
                        </div>
                    </div>

                    <button onClick={handleSave} disabled={saving}
                        className="w-full mt-4 enterprise-btn-primary justify-center h-12 text-base disabled:opacity-50">
                        {saving ? <Loader2 className="animate-spin w-5 h-5" /> : <><ShieldCheck size={18} strokeWidth={2.5} /> Save Company Settings</>}
                    </button>
                </div>
            </Modal>
        </div>
    );
}
