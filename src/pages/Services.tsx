import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import {
    Plus,
    Edit2,
    Search,
    Trash2,
    AlertTriangle,
    Activity,
    Globe,
    ShieldCheck,
    Loader2,
    LayoutGrid,
    RefreshCcw
} from 'lucide-react';
import Modal from '../components/Modal';

interface Service {
    id: string;
    name: string;
    slug: string;
    is_active: boolean;
    display_order: number;
    icon_url: string | null;
}

export default function Services() {
    const [services, setServices] = useState<Service[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');

    // Modal State
    const [showModal, setShowModal] = useState(false);
    const [editingService, setEditingService] = useState<Service | null>(null);
    const [saving, setSaving] = useState(false);
    const [formData, setFormData] = useState({
        name: '',
        slug: '',
        display_order: '0',
        icon_url: ''
    });

    useEffect(() => {
        fetchServices();

        const channel = supabase
            .channel('services_changes')
            .on(
                'postgres_changes',
                {
                    event: '*',
                    schema: 'public',
                    table: 'services'
                },
                () => {
                    fetchServices();
                }
            )
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, []);

    const fetchServices = async () => {
        setLoading(true);
        try {
            const { data, error } = await supabase
                .from('services')
                .select('*')
                .order('display_order');

            if (error) throw error;
            setServices(data || []);
        } catch (error) {
            console.error('Error fetching services:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleAdd = () => {
        setEditingService(null);
        setFormData({
            name: '',
            slug: '',
            display_order: '0',
            icon_url: ''
        });
        setShowModal(true);
    };

    const handleEdit = (service: Service) => {
        setEditingService(service);
        setFormData({
            name: service.name,
            slug: service.slug,
            display_order: service.display_order.toString(),
            icon_url: service.icon_url || ''
        });
        setShowModal(true);
    };

    const handleDelete = async (id: string) => {
        if (!confirm('Are you sure you want to delete this service? This may affect linked operators.')) {
            return;
        }

        try {
            const { error } = await supabase.from('services').delete().eq('id', id);
            if (error) throw error;
            fetchServices();
        } catch (error: any) {
            alert('Error deleting service: ' + error.message);
        }
    };

    const handleSave = async () => {
        if (!formData.name || !formData.slug) {
            return;
        }

        setSaving(true);
        try {
            const payload = {
                name: formData.name,
                slug: formData.slug.toLowerCase().replace(/\s+/g, '-'),
                display_order: parseInt(formData.display_order),
                icon_url: formData.icon_url || null
            };

            if (editingService) {
                const { error } = await supabase
                    .from('services')
                    .update(payload)
                    .eq('id', editingService.id);
                if (error) throw error;
            } else {
                const { error } = await supabase
                    .from('services')
                    .insert(payload);
                if (error) throw error;
            }

            setShowModal(false);
            fetchServices();
        } catch (error: any) {
            console.error('Error saving:', error);
        } finally {
            setSaving(false);
        }
    };

    const toggleStatus = async (id: string, currentStatus: boolean) => {
        try {
            const { error } = await supabase
                .from('services')
                .update({ is_active: !currentStatus })
                .eq('id', id);

            if (error) throw error;
            fetchServices();
        } catch (error: any) {
            console.error('Error:', error);
        }
    };

    const filteredServices = services.filter((s) =>
        s.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        s.slug.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="space-y-6 animate-fade-up">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="page-title">Service Types</h1>
                    <p className="page-subtitle">Manage different types of recharges and bill payments</p>
                </div>
                <div className="flex items-center gap-2">
                    <button onClick={fetchServices} className="enterprise-btn-secondary text-xs gap-1.5">
                        <RefreshCcw size={13} className={loading ? 'animate-spin' : ''} /> Refresh
                    </button>
                    <button onClick={handleAdd} className="enterprise-btn-primary">
                        <Plus size={16} /> Add New Service
                    </button>
                </div>
            </div>

            {/* KPI Strip */}
            <div className="grid grid-cols-3 gap-4">
                {[
                    { label: 'Total Services', value: services.length, icon: <LayoutGrid size={16} />, color: 'text-indigo-600', bg: 'bg-indigo-50' },
                    { label: 'Working', value: services.filter(s => s.is_active).length, icon: <Activity size={16} />, color: 'text-emerald-600', bg: 'bg-emerald-50' },
                    { label: 'Stopped', value: services.filter(s => !s.is_active).length, icon: <Globe size={16} />, color: 'text-slate-500', bg: 'bg-slate-100' },
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
                    <input type="text" placeholder="Search services..."
                        className="enterprise-input pl-9 h-10 text-sm"
                        value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
                </div>
                <span className="ml-auto text-xs font-semibold text-slate-400">{filteredServices.length} records</span>
            </div>

            {/* Catalog Table */}
            <div className="enterprise-card overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="min-w-full">
                        <thead>
                            <tr>
                                <th className="enterprise-table-header">Rank</th>
                                <th className="enterprise-table-header">Service Name</th>
                                <th className="enterprise-table-header">System ID</th>
                                <th className="enterprise-table-header text-center">Status</th>
                                <th className="enterprise-table-header text-right">Edit</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-slate-50">
                            {loading ? (
                                [...Array(4)].map((_, i) => (
                                    <tr key={i}>{[...Array(5)].map((_, j) => (
                                        <td key={j} className="px-5 py-4">
                                            <div className="h-3.5 rounded bg-slate-100 animate-pulse" style={{ width: `${[20, 55, 40, 30, 30][j]}%` }} />
                                        </td>
                                    ))}</tr>
                                ))
                            ) : filteredServices.length === 0 ? (
                                <tr><td colSpan={5} className="py-16 text-center">
                                    <Globe size={32} className="mx-auto text-slate-200 mb-3" />
                                    <p className="text-slate-400 text-sm font-medium">No services found</p>
                                </td></tr>
                            ) : (
                                filteredServices.map((service) => (
                                    <tr key={service.id} className="enterprise-table-row group">
                                        <td className="px-5 py-4">
                                            <span className="text-xs font-mono text-slate-400">#{service.display_order.toString().padStart(2, '0')}</span>
                                        </td>
                                        <td className="px-5 py-4">
                                            <div className="flex items-center gap-3">
                                                <div className="w-9 h-9 rounded-xl bg-slate-900 text-white flex items-center justify-center font-bold text-xs shadow-sm shrink-0">
                                                    {service.icon_url ? (
                                                        <img src={service.icon_url} alt="" className="w-5 h-5 object-contain invert" />
                                                    ) : (
                                                        service.name.substring(0, 2).toUpperCase()
                                                    )}
                                                </div>
                                                <p className="font-semibold text-slate-800 text-sm group-hover:text-indigo-600 transition-colors">{service.name}</p>
                                            </div>
                                        </td>
                                        <td className="px-5 py-4">
                                            <code className="px-2.5 py-1 rounded-lg bg-slate-100 text-[10px] font-mono font-bold text-slate-500 border border-slate-200">{service.slug}</code>
                                        </td>
                                        <td className="px-5 py-4 text-center">
                                            <button onClick={() => toggleStatus(service.id, service.is_active)}
                                                className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold border transition-all ${service.is_active ? 'bg-emerald-50 text-emerald-700 border-emerald-100 hover:bg-emerald-100' : 'bg-slate-50 text-slate-500 border-slate-200 hover:bg-slate-100'
                                                    }`}>
                                                <span className={`w-1.5 h-1.5 rounded-full ${service.is_active ? 'bg-emerald-500' : 'bg-slate-400'}`} />
                                                {service.is_active ? 'Active' : 'Inactive'}
                                            </button>
                                        </td>
                                        <td className="px-5 py-4">
                                            <div className="flex justify-end gap-1">
                                                <button onClick={() => handleEdit(service)} className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition" title="Edit"><Edit2 size={14} /></button>
                                                <button onClick={() => handleDelete(service.id)} className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition" title="Delete"><Trash2 size={14} /></button>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Service Deployment Modal */}
            <Modal
                isOpen={showModal}
                onClose={() => setShowModal(false)}
                title={editingService ? 'Edit Service' : 'Add New Service'}
                subtitle="Service Settings"
                icon={editingService ? <Edit2 size={28} strokeWidth={2.5} /> : <Plus size={28} strokeWidth={2.5} />}
                maxWidth="max-w-xl"
            >
                <div className="space-y-6">
                    <div className="space-y-2">
                        <label className="text-xs font-semibold text-slate-500 ml-1">Name of Service</label>
                        <input
                            type="text"
                            placeholder="e.g. Mobile Recharge"
                            className="enterprise-input h-12 text-base font-semibold"
                            value={formData.name}
                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        />
                    </div>

                    <div className="space-y-2">
                        <label className="text-xs font-semibold text-slate-500 ml-1">System ID Name (Slug)</label>
                        <div className="relative group">
                            <input
                                type="text"
                                placeholder="mobile-recharge"
                                className="enterprise-input h-12 font-mono text-sm pl-11 text-indigo-600"
                                value={formData.slug}
                                onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                            />
                            <Globe className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-indigo-500 transition-colors" size={16} />
                        </div>
                        <div className="flex items-center gap-2 px-1 mt-1">
                            <AlertTriangle size={12} className="text-amber-500" />
                            <p className="text-[10px] font-medium text-slate-400">Warning: Changing this name might break some parts of the system.</p>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-6">
                        <div className="space-y-2">
                            <label className="text-xs font-semibold text-slate-500 ml-1">Rank / Position</label>
                            <input
                                type="number"
                                className="enterprise-input h-12 font-bold tabular-nums"
                                value={formData.display_order}
                                onChange={(e) => setFormData({ ...formData, display_order: e.target.value })}
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-xs font-semibold text-slate-500 ml-1">Service Icon Link</label>
                            <input
                                type="text"
                                placeholder="https://..."
                                className="enterprise-input h-12 text-xs font-mono"
                                value={formData.icon_url}
                                onChange={(e) => setFormData({ ...formData, icon_url: e.target.value })}
                            />
                        </div>
                    </div>

                    <button
                        onClick={handleSave}
                        disabled={saving}
                        className="w-full mt-4 enterprise-btn-primary justify-center h-12 text-base disabled:opacity-50"
                    >
                        {saving ? (
                            <Loader2 className="animate-spin w-5 h-5" />
                        ) : (
                            <>
                                <ShieldCheck size={18} strokeWidth={2.5} />
                                <span>Save Changes</span>
                            </>
                        )}
                    </button>
                </div>
            </Modal>
        </div>
    );
}
