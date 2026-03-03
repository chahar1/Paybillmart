import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import {
    Search,
    Plus,
    Mail,
    Phone,
    ChevronRight,
    UserX,
    X,
    ShieldCheck,
    Ban,
    Send,
    Loader2
} from 'lucide-react';
import Modal from '../components/Modal';

const Users = () => {
    const [users, setUsers] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedUser, setSelectedUser] = useState<any>(null);
    const [actionLoading, setActionLoading] = useState(false);
    const [userTransactions, setUserTransactions] = useState<any[]>([]);
    const [txLoading, setTxLoading] = useState(false);
    const [showCreateModal, setShowCreateModal] = useState(false);

    const [newUser, setNewUser] = useState({
        email: '',
        fullName: '',
        phone: '',
        initialBalance: '0'
    });
    const [createLoading, setCreateLoading] = useState(false);

    // Direct Message State
    const [showDMModal, setShowDMModal] = useState(false);
    const [dmTitle, setDmTitle] = useState('');
    const [dmMessage, setDmMessage] = useState('');
    const [dmSending, setDmSending] = useState(false);

    useEffect(() => {
        const timer = setTimeout(() => {
            fetchUsers();
        }, 300);
        return () => clearTimeout(timer);
    }, [searchQuery]);

    useEffect(() => {
        if (selectedUser) {
            fetchUserTransactions(selectedUser.id);
        }
    }, [selectedUser]);

    // Real-time synchronization
    useEffect(() => {
        const channel = supabase
            .channel('realtime_users_changes')
            .on('postgres_changes', { event: '*', table: 'wallets', schema: 'public' }, () => {
                fetchUsers();
            })
            .on('postgres_changes', { event: 'INSERT', table: 'transactions', schema: 'public' }, (payload) => {
                if (selectedUser && payload.new.user_id === selectedUser.id) {
                    fetchUserTransactions(selectedUser.id);
                }
                fetchUsers();
            })
            .on('postgres_changes', { event: '*', table: 'users', schema: 'public' }, () => {
                fetchUsers();
            })
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, [selectedUser]);



    const fetchUserTransactions = async (userId: string) => {
        setTxLoading(true);
        const { data } = await supabase
            .from('transactions')
            .select('*')
            .eq('user_id', userId)
            .order('created_at', { ascending: false })
            .limit(5);
        if (data) setUserTransactions(data);
        setTxLoading(false);
    };

    const fetchUsers = async () => {
        try {
            setLoading(true);
            let query = supabase
                .from('users')
                .select('*, wallets(balance)')
                .order('created_at', { ascending: false });

            if (searchQuery) {
                query = query.or(`email.ilike.%${searchQuery}%,full_name.ilike.%${searchQuery}%,phone.ilike.%${searchQuery}%,referral_code.ilike.%${searchQuery}%`);
            }

            const { data, error } = await query;
            if (error) throw error;
            setUsers(data || []);
        } catch (error) {
            console.error('Error fetching users:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleCreateUser = async () => {
        if (!newUser.email || !newUser.fullName || !newUser.phone) {
            alert('Please fill all required fields');
            return;
        }

        try {
            setCreateLoading(true);
            const { data: { user } } = await supabase.auth.getUser();

            const { data, error } = await supabase.rpc('admin_create_user', {
                p_admin_id: user?.id,
                p_email: newUser.email,
                p_full_name: newUser.fullName,
                p_phone: newUser.phone,
                p_initial_balance: parseFloat(newUser.initialBalance) || 0
            });

            if (error) throw error;
            if (!data.success) throw new Error(data.error);

            alert(`Account Created!\n\nEmail: ${data.email}\nTemp Password: ${data.password}\n\nPlease send these login details to the user.`);
            setShowCreateModal(false);
            setNewUser({ email: '', fullName: '', phone: '', initialBalance: '0' });
            fetchUsers();
        } catch (error: any) {
            alert(error.message);
        } finally {
            setCreateLoading(false);
        }
    };

    const handleBlockUnblock = async (user: any) => {
        try {
            setActionLoading(true);
            const newStatus = !user.is_blocked;
            const { data: { user: admin } } = await supabase.auth.getUser();

            let { data, error } = newStatus
                ? await supabase.rpc('admin_block_user', {
                    p_admin_id: admin?.id,
                    p_user_id: user.id,
                    p_reason: 'Account suspended by admin'
                })
                : await supabase.rpc('admin_unblock_user', {
                    p_admin_id: admin?.id,
                    p_user_id: user.id
                });

            if (error) throw error;
            if (data && !data.success) throw new Error(data.error);

            fetchUsers();
            if (selectedUser?.id === user.id) {
                setSelectedUser({ ...selectedUser, is_blocked: newStatus });
            }
        } catch (error: any) {
            alert(error.message);
        } finally {
            setActionLoading(false);
        }
    };

    const handleSendDirectMessage = async () => {
        if (!dmTitle || !dmMessage) {
            alert('Please enter both title and message');
            return;
        }

        try {
            setDmSending(true);
            const { error } = await supabase.rpc('create_notification', {
                p_user_id: selectedUser.id,
                p_type: 'system',
                p_data: {
                    title: dmTitle,
                    message: dmMessage
                },
                p_action_url: 'screen://home'
            });

            if (error) throw error;

            alert('Message sent successfully!');
            setShowDMModal(false);
            setDmTitle('');
            setDmMessage('');
        } catch (error: any) {
            alert('Could not send message: ' + error.message);
        } finally {
            setDmSending(false);
        }
    };

    return (
        <div className="space-y-6 animate-fade-up">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="page-title">Users</h1>
                    <p className="page-subtitle">Manage app users, their money and accounts</p>
                </div>
                <div className="flex items-center gap-3">
                    <div className="relative">
                        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-300" size={14} />
                        <input
                            type="text"
                            placeholder="Search by name, email, or ID..."
                            className="enterprise-input pl-9 h-10 text-sm w-72"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                    </div>
                    <button
                        onClick={() => setShowCreateModal(true)}
                        className="enterprise-btn-primary"
                    >
                        <Plus size={16} />
                        <span>Add New User</span>
                    </button>
                </div>
            </div>

            <div className="flex flex-col xl:flex-row gap-8">
                {/* Main Ledger Table */}
                <div className="flex-1 enterprise-card overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="min-w-full">
                            <thead>
                                <tr>
                                    <th className="enterprise-table-header">User Name</th>
                                    <th className="enterprise-table-header">Contact Info</th>
                                    <th className="enterprise-table-header">Status</th>
                                    <th className="enterprise-table-header">Balance</th>
                                    <th className="enterprise-table-header">Joined Date</th>
                                    <th className="px-6 py-4"></th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100/60 bg-white">
                                {loading ? (
                                    <tr>
                                        <td colSpan={6} className="px-6 py-20 text-center">
                                            <div className="flex flex-col items-center gap-3">
                                                <Loader2 className="animate-spin text-indigo-500 w-6 h-6" />
                                                <p className="text-slate-400 text-xs font-semibold uppercase tracking-widest">Loading users...</p>
                                            </div>
                                        </td>
                                    </tr>
                                ) : users.map((user) => (
                                    <tr
                                        key={user.id}
                                        className={`group hover:bg-slate-50 transition-all cursor-pointer ${selectedUser?.id === user.id ? 'bg-indigo-50/40' : ''}`}
                                        onClick={() => setSelectedUser(user)}
                                    >
                                        <td className="px-6 py-5">
                                            <div className="flex items-center gap-4">
                                                <div className="w-10 h-10 rounded-xl bg-slate-900 text-white flex items-center justify-center font-bold shrink-0 shadow-lg shadow-slate-200 group-hover:scale-105 transition-transform">
                                                    {user.full_name?.charAt(0) || user.email?.charAt(0).toUpperCase()}
                                                </div>
                                                <div>
                                                    <div className="text-sm font-bold text-slate-900 group-hover:text-indigo-600 transition-colors">{user.full_name || 'No Name'}</div>
                                                    <div className="text-[10px] text-slate-400 font-bold uppercase tracking-tight">ID: {user.referral_code || '---'}</div>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-5">
                                            <div className="space-y-1">
                                                <div className="flex items-center text-xs font-medium text-slate-600">
                                                    <Mail size={12} className="mr-2 text-slate-300" /> {user.email}
                                                </div>
                                                {user.phone && (
                                                    <div className="flex items-center text-[11px] text-slate-400">
                                                        <Phone size={12} className="mr-2 text-slate-300" /> {user.phone}
                                                    </div>
                                                )}
                                            </div>
                                        </td>
                                        <td className="px-6 py-5">
                                            <span className={`enterprise-badge ${user.is_blocked ? 'badge-danger' : 'badge-success'}`}>
                                                {user.is_blocked ? 'Blocked' : 'Active'}
                                            </span>
                                        </td>
                                        <td className="px-6 py-5">
                                            <div className="text-sm font-bold text-slate-900 tabular-nums">₹{user.wallets?.balance?.toLocaleString() || '0.00'}</div>
                                        </td>
                                        <td className="px-6 py-5 text-[11px] font-semibold text-slate-400 tabular-nums">
                                            {new Date(user.created_at).toLocaleDateString()}
                                        </td>
                                        <td className="px-6 py-5 text-right">
                                            <ChevronRight size={18} className="text-slate-300 group-hover:text-indigo-500 group-hover:translate-x-1 transition-all" />
                                        </td>
                                    </tr>
                                ))}
                                {!loading && users.length === 0 && (
                                    <tr>
                                        <td colSpan={6} className="px-6 py-20 text-center">
                                            <UserX size={40} className="mx-auto text-slate-200 mb-4" />
                                            <p className="text-slate-400 font-bold uppercase text-[11px] tracking-widest">No users found</p>
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* Account Summary Side Panel */}
                {selectedUser && (
                    <div className="w-full xl:w-96 enterprise-card p-0 flex flex-col h-fit sticky top-8 animate-in slide-in-from-right-4 duration-500 z-20">
                        <div className="p-6 border-b border-slate-100 bg-slate-50/50 relative overflow-hidden">
                            <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/5 rounded-full -mr-16 -mt-16 pointer-events-none" />
                            <div className="flex justify-between items-start z-10 relative">
                                <div className="flex items-center gap-4">
                                    <div className="h-14 w-14 rounded-2xl bg-indigo-600 text-white flex items-center justify-center text-2xl font-bold shadow-2xl shadow-indigo-600/30">
                                        {selectedUser.full_name?.charAt(0) || selectedUser.email?.charAt(0).toUpperCase()}
                                    </div>
                                    <div>
                                        <h3 className="font-bold text-slate-900 text-lg leading-tight">{selectedUser.full_name || 'Anonymous'}</h3>
                                        <p className="text-[11px] text-slate-500 font-bold uppercase tracking-widest mt-1">{selectedUser.is_blocked ? 'Blocked User' : 'Verified User'}</p>
                                    </div>
                                </div>
                                <button onClick={() => setSelectedUser(null)} className="p-2 hover:bg-white rounded-xl text-slate-400 hover:text-slate-600 transition-colors shadow-sm border border-transparent hover:border-slate-100">
                                    <X size={20} />
                                </button>
                            </div>
                        </div>

                        <div className="p-6 space-y-8">
                            <div className="grid grid-cols-2 gap-4">
                                <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm">
                                    <p className="text-[10px] uppercase font-bold text-slate-400 mb-1 tracking-wider">Net Balance</p>
                                    <p className="text-xl font-bold text-slate-900 tracking-tight">₹{selectedUser.wallets?.balance?.toLocaleString() || '0'}</p>
                                </div>
                                <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm">
                                    <p className="text-[10px] uppercase font-bold text-slate-400 mb-1 tracking-wider">Account Status</p>
                                    <p className={`text-sm font-bold ${selectedUser.is_blocked ? 'text-red-600' : 'text-emerald-600'}`}>
                                        {selectedUser.is_blocked ? 'Suspended' : 'Safe'}
                                    </p>
                                </div>
                            </div>

                            <div className="space-y-3">
                                <button
                                    onClick={() => setShowDMModal(true)}
                                    className="w-full flex items-center justify-center gap-3 py-3.5 rounded-xl font-bold text-sm bg-indigo-600 text-white hover:bg-indigo-700 shadow-xl shadow-indigo-100 transition-all"
                                >
                                    <Send size={18} />
                                    <span>Send Message</span>
                                </button>
                                <button
                                    disabled={actionLoading}
                                    onClick={() => handleBlockUnblock(selectedUser)}
                                    className={`w-full flex items-center justify-center gap-3 py-3.5 rounded-xl font-bold text-sm transition-all ${selectedUser.is_blocked
                                        ? 'bg-emerald-600 text-white hover:bg-emerald-700 shadow-xl shadow-emerald-200'
                                        : 'bg-white text-red-600 hover:bg-red-50 border border-red-200 shadow-sm'
                                        }`}
                                >
                                    {selectedUser.is_blocked ? <ShieldCheck size={18} /> : <Ban size={18} />}
                                    <span>{selectedUser.is_blocked ? 'Unblock User' : 'Block User'}</span>
                                </button>
                            </div>


                            <div className="pt-6 border-t border-slate-100">
                                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mb-4">Recent Activity</p>
                                <div className="space-y-3">
                                    {txLoading ? (
                                        <div className="flex justify-center p-4">
                                            <Loader2 className="animate-spin text-slate-300 w-4 h-4" />
                                        </div>
                                    ) : userTransactions.length > 0 ? (
                                        userTransactions.map(tx => (
                                            <div key={tx.id} className="flex justify-between items-center bg-slate-50 p-3 rounded-xl border border-slate-100/50">
                                                <div>
                                                    <p className="text-[11px] font-bold text-slate-900 truncate w-32 capitalize">{tx.category.replace('_', ' ')}</p>
                                                    <p className="text-[9px] text-slate-400 font-bold uppercase">{new Date(tx.created_at).toLocaleDateString()}</p>
                                                </div>
                                                <p className={`text-xs font-black ${tx.type === 'credit' ? 'text-emerald-600' : 'text-slate-900'}`}>
                                                    {tx.type === 'credit' ? '+' : '-'}₹{tx.amount}
                                                </p>
                                            </div>
                                        ))
                                    ) : (
                                        <p className="text-[10px] text-slate-400 text-center italic py-2">No transaction history found</p>
                                    )}
                                </div>
                            </div>

                            <div className="pt-6 border-t border-slate-100">
                                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mb-4">Contact Info</p>
                                <div className="space-y-4">
                                    <div className="flex items-center gap-4 group">
                                        <div className="p-2 bg-slate-50 rounded-lg group-hover:bg-indigo-50 transition-colors">
                                            <Mail size={14} className="text-slate-400 group-hover:text-indigo-500" />
                                        </div>
                                        <div className="text-xs font-semibold text-slate-600 truncate">{selectedUser.email}</div>
                                    </div>
                                    <div className="flex items-center gap-4 group">
                                        <div className="p-2 bg-slate-50 rounded-lg group-hover:bg-indigo-50 transition-colors">
                                            <Phone size={14} className="text-slate-400 group-hover:text-indigo-500" />
                                        </div>
                                        <div className="text-xs font-semibold text-slate-600">{selectedUser.phone || 'No phone number'}</div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {/* Account Provisioning Modal */}
            <Modal
                isOpen={showCreateModal}
                onClose={() => setShowCreateModal(false)}
                title="Add New User"
                subtitle="Enter user details below"
                maxWidth="max-w-md"
            >
                <div className="space-y-6">
                    <div className="space-y-2">
                        <label className="text-[11px] font-bold text-slate-500 uppercase tracking-widest px-1">User Full Name</label>
                        <input
                            type="text"
                            className="enterprise-input h-12"
                            placeholder="Enter user's name"
                            value={newUser.fullName}
                            onChange={e => setNewUser({ ...newUser, fullName: e.target.value })}
                        />
                    </div>

                    <div className="space-y-2">
                        <label className="text-[11px] font-bold text-slate-500 uppercase tracking-widest px-1">Email Address</label>
                        <input
                            type="email"
                            className="enterprise-input h-12"
                            placeholder="user@example.com"
                            value={newUser.email}
                            onChange={e => setNewUser({ ...newUser, email: e.target.value })}
                        />
                    </div>

                    <div className="space-y-2">
                        <label className="text-[11px] font-bold text-slate-500 uppercase tracking-widest px-1">Phone Number</label>
                        <input
                            type="tel"
                            className="enterprise-input h-12"
                            placeholder="10 digit number"
                            value={newUser.phone}
                            onChange={e => setNewUser({ ...newUser, phone: e.target.value })}
                        />
                    </div>

                    <div className="space-y-2">
                        <label className="text-[11px] font-bold text-slate-500 uppercase tracking-widest px-1">Add Money (Starting Balance)</label>
                        <div className="relative group">
                            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 font-bold group-focus-within:text-indigo-500 transition-colors">₹</span>
                            <input
                                type="number"
                                min="0"
                                className="enterprise-input pl-10 h-12"
                                placeholder="0.00"
                                value={newUser.initialBalance}
                                onChange={e => setNewUser({ ...newUser, initialBalance: e.target.value })}
                            />
                        </div>
                    </div>
                </div>

                <div className="mt-8 flex gap-4 justify-end border-t border-slate-100 pt-6">
                    <button
                        onClick={() => setShowCreateModal(false)}
                        className="text-sm font-bold text-slate-500 hover:text-slate-800 transition-colors px-4"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleCreateUser}
                        disabled={createLoading}
                        className="enterprise-btn-primary h-12 px-8"
                    >
                        {createLoading ? <Loader2 className="animate-spin w-4 h-4 mr-2" /> : <ShieldCheck size={18} />}
                        <span>{createLoading ? 'Creating...' : 'Add User'}</span>
                    </button>
                </div>
            </Modal>

            {/* Direct Message Modal */}
            <Modal
                isOpen={showDMModal}
                onClose={() => setShowDMModal(false)}
                title="Send Message"
                subtitle={`Sending to ${selectedUser?.full_name || selectedUser?.email}`}
                maxWidth="max-w-md"
            >
                <div className="space-y-6">
                    <div className="space-y-2">
                        <label className="text-[11px] font-bold text-slate-500 uppercase tracking-widest px-1">Message Title</label>
                        <input
                            type="text"
                            className="enterprise-input h-12"
                            placeholder="e.g., Account Update"
                            value={dmTitle}
                            onChange={e => setDmTitle(e.target.value)}
                        />
                    </div>

                    <div className="space-y-2">
                        <label className="text-[11px] font-bold text-slate-500 uppercase tracking-widest px-1">Message Body</label>
                        <textarea
                            className="enterprise-input min-h-[120px] py-4 resize-none"
                            placeholder="Type your message here..."
                            value={dmMessage}
                            onChange={e => setDmMessage(e.target.value)}
                        />
                    </div>

                    <div className="bg-amber-50 rounded-xl p-4 border border-amber-100">
                        <p className="text-[10px] text-amber-700 font-bold leading-relaxed">
                            This will send an immediate high-priority push notification to all devices registered to this user account.
                        </p>
                    </div>
                </div>

                <div className="mt-8 flex gap-4 justify-end border-t border-slate-100 pt-6">
                    <button
                        onClick={() => setShowDMModal(false)}
                        className="text-sm font-bold text-slate-500 hover:text-slate-800 transition-colors px-4"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleSendDirectMessage}
                        disabled={dmSending}
                        className="enterprise-btn-primary h-12 px-8"
                    >
                        {dmSending ? <Loader2 className="animate-spin w-4 h-4 mr-2" /> : <Send size={18} />}
                        <span>{dmSending ? 'Sending...' : 'Send Message'}</span>
                    </button>
                </div>
            </Modal>
        </div>
    );
};

export default Users;
