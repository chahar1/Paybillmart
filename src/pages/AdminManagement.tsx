import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import {
    Shield,
    Plus,
    Trash2,
    Mail,
    User,
    Lock,
    Eye,
    EyeOff,
    ShieldCheck,
    Activity,
    Loader2
} from 'lucide-react';
import Modal from '../components/Modal';

export default function AdminManagement() {
    const [admins, setAdmins] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);

    // Form state
    const [email, setEmail] = useState('');
    const [fullName, setFullName] = useState('');
    const [role, setRole] = useState('admin');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [submitting, setSubmitting] = useState(false);

    useEffect(() => {
        fetchAdmins();
    }, []);



    const fetchAdmins = async () => {
        try {
            setLoading(true);
            const { data, error } = await supabase
                .from('admin_users')
                .select(`
                    id,
                    user_id,
                    role,
                    is_active,
                    created_at,
                    users (
                        email,
                        full_name,
                        phone
                    )
                `)
                .order('created_at', { ascending: false });

            if (error) {
                console.error('Team Fetch Error:', error.message);
                alert('System error: Cannot load the admin list.');
            }
            if (data) setAdmins(data);
        } catch (err) {
            console.error('Fetch execution error:', err);
        } finally {
            setLoading(false);
        }
    };

    const handleCreateAdmin = async () => {
        if (!email || !fullName || !password) {
            return;
        }

        if (password.length < 6) {
            return;
        }

        setSubmitting(true);

        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        const { error } = await supabase
            .rpc('admin_create_admin', {
                p_super_admin_id: user.id,
                p_email: email,
                p_full_name: fullName,
                p_role: role,
                p_password: password
            });

        setSubmitting(false);

        if (error) {
            alert('Error creating admin: ' + error.message);
        } else {
            setShowModal(false);
            resetForm();
            fetchAdmins();
        }
    };

    const handleDelete = async (adminId: string, targetUserId: string) => {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        if (user.id === targetUserId) {
            alert("Error: You cannot remove your own access.");
            return;
        }

        if (!confirm('Warning: Removing access will stop this user from logging into the admin panel. Proceed?')) {
            return;
        }

        const { data, error } = await supabase.rpc('admin_revoke_access', {
            p_super_admin_id: user.id,
            p_target_admin_id: adminId
        });

        if (error) {
            alert('Revocation Error: ' + error.message);
        } else if (data && !data.success) {
            alert('Revocation Error: ' + data.error);
        } else {
            fetchAdmins();
        }
    };

    const resetForm = () => {
        setEmail('');
        setFullName('');
        setRole('admin');
        setPassword('');
        setShowPassword(false);
    };


    if (loading) return (
        <div className="flex flex-col items-center justify-center h-[60vh]">
            <Loader2 className="animate-spin text-slate-900 mb-4" size={40} />
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Loading Admin List...</p>
        </div>
    );



    return (
        <div className="space-y-6 animate-fade-up">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="page-title">Manage Team</h1>
                    <p className="page-subtitle">Manage your team members and their roles</p>
                </div>
                <div className="flex items-center gap-2">
                    <button onClick={fetchAdmins} className="enterprise-btn-secondary text-xs gap-1.5">
                        <Activity size={13} className={loading ? 'animate-spin' : ''} /> Refresh
                    </button>
                    <button onClick={() => setShowModal(true)} className="enterprise-btn-primary">
                        <Plus size={16} /> Add Admin
                    </button>
                </div>
            </div>

            {/* KPI Strip */}
            <div className="grid grid-cols-3 gap-4">
                {[
                    { label: 'Total Admins', value: admins.length, icon: <Shield size={16} />, color: 'text-indigo-600', bg: 'bg-indigo-50' },
                    { label: 'Active', value: admins.filter(a => a.is_active).length, icon: <ShieldCheck size={16} />, color: 'text-emerald-600', bg: 'bg-emerald-50' },
                    { label: 'Inactive', value: admins.filter(a => !a.is_active).length, icon: <Activity size={16} />, color: 'text-slate-500', bg: 'bg-slate-100' },
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

            {/* Admin Table */}
            <div className="enterprise-card overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="min-w-full">
                        <thead>
                            <tr>
                                <th className="enterprise-table-header">Admin</th>
                                <th className="enterprise-table-header">Role</th>
                                <th className="enterprise-table-header text-center">Status</th>
                                <th className="enterprise-table-header text-center">Joined</th>
                                <th className="enterprise-table-header text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-slate-50">
                            {loading ? (
                                [...Array(3)].map((_, i) => (
                                    <tr key={i}>{[...Array(5)].map((_, j) => (
                                        <td key={j} className="px-5 py-4">
                                            <div className="h-3.5 rounded bg-slate-100 animate-pulse" style={{ width: `${[65, 35, 30, 30, 20][j]}%` }} />
                                        </td>
                                    ))}</tr>
                                ))
                            ) : admins.length === 0 ? (
                                <tr><td colSpan={5} className="py-16 text-center">
                                    <Shield size={32} className="mx-auto text-slate-200 mb-3" />
                                    <p className="text-slate-400 text-sm font-medium">No admins found</p>
                                </td></tr>
                            ) : admins.map((admin) => (
                                <tr key={admin.id} className="enterprise-table-row group">
                                    <td className="px-5 py-3.5">
                                        <div className="flex items-center gap-3">
                                            <div className="w-9 h-9 rounded-xl bg-slate-900 text-white flex items-center justify-center font-bold text-xs shadow-sm shrink-0">
                                                {admin.users?.full_name?.charAt(0) || 'U'}
                                            </div>
                                            <div>
                                                <p className="text-sm font-semibold text-slate-800">{admin.users?.full_name || 'Unknown'}</p>
                                                <p className="text-[10px] text-slate-400">{admin.users?.email}</p>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-5 py-3.5">
                                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold bg-indigo-50 text-indigo-700 border border-indigo-100">
                                            <Shield size={11} /> {admin.role || 'admin'}
                                        </span>
                                    </td>
                                    <td className="px-5 py-3.5 text-center">
                                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold border ${admin.is_active ? 'bg-emerald-50 text-emerald-700 border-emerald-100' : 'bg-slate-50 text-slate-500 border-slate-200'
                                            }`}>
                                            <span className={`w-1.5 h-1.5 rounded-full ${admin.is_active ? 'bg-emerald-500' : 'bg-slate-400'}`} />
                                            {admin.is_active ? 'Active' : 'Inactive'}
                                        </span>
                                    </td>
                                    <td className="px-5 py-3.5 text-center">
                                        <p className="text-xs font-semibold text-slate-600 tabular-nums">{new Date(admin.created_at).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: '2-digit' })}</p>
                                    </td>
                                    <td className="px-5 py-3.5">
                                        <div className="flex justify-end">
                                            <button onClick={() => handleDelete(admin.id, admin.user_id)}
                                                className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition" title="Remove Access">
                                                <Trash2 size={14} />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Officer Commission Modal */}
            <Modal
                isOpen={showModal}
                onClose={() => setShowModal(false)}
                title="Add New Admin"
                subtitle="Admin Details"
                icon={<ShieldCheck size={28} strokeWidth={2.5} />}
                maxWidth="max-w-xl"
            >
                <div className="space-y-6">
                    <div className="space-y-2">
                        <label className="text-xs font-semibold text-slate-500 ml-1">Full Name</label>
                        <div className="relative group">
                            <input
                                type="text"
                                placeholder="Enter full name"
                                className="enterprise-input h-12 font-semibold pl-11"
                                value={fullName}
                                onChange={e => setFullName(e.target.value)}
                            />
                            <User className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-indigo-500 transition-colors" size={16} />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <label className="text-xs font-semibold text-slate-500 ml-1">Email Address</label>
                        <div className="relative group">
                            <input
                                type="email"
                                placeholder="admin@example.com"
                                className="enterprise-input h-12 font-semibold pl-11"
                                value={email}
                                onChange={e => setEmail(e.target.value)}
                            />
                            <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-indigo-500 transition-colors" size={16} />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <label className="text-xs font-semibold text-slate-500 ml-1">User Role</label>
                        <div className="relative">
                            <select
                                className="enterprise-input h-12 text-sm pl-11 font-bold appearance-none bg-white"
                                value={role}
                                onChange={e => setRole(e.target.value)}
                            >
                                <option value="admin">Normal Admin</option>
                                <option value="super_admin">Super Admin (Full Access)</option>
                            </select>
                            <Shield className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={16} />
                            <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">
                                <svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="2"><path d="m3 4.5 3 3 3-3" /></svg>
                            </div>
                        </div>
                    </div>

                    <div className="space-y-2">
                        <label className="text-xs font-semibold text-slate-500 ml-1">Password</label>
                        <div className="relative group">
                            <input
                                type={showPassword ? "text" : "password"}
                                placeholder="Type a strong password"
                                className="enterprise-input h-12 pl-11 pr-12 font-mono"
                                value={password}
                                onChange={e => setPassword(e.target.value)}
                            />
                            <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-indigo-500 transition-colors" size={16} />
                            <button
                                type="button"
                                onClick={() => setShowPassword(!showPassword)}
                                className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-900 transition-colors"
                            >
                                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                            </button>
                        </div>
                    </div>

                    <button
                        onClick={handleCreateAdmin}
                        disabled={submitting}
                        className="w-full mt-4 enterprise-btn-primary justify-center h-12 text-base disabled:opacity-50"
                    >
                        {submitting ? (
                            <Loader2 className="animate-spin w-5 h-5" />
                        ) : (
                            <>
                                <ShieldCheck size={18} strokeWidth={2.5} />
                                <span>Add Admin</span>
                            </>
                        )}
                    </button>
                </div>
            </Modal>
        </div>
    );
}
