import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import {
    Search,
    ArrowUpCircle,
    ArrowDownCircle,
    Loader2,
    TrendingUp
} from 'lucide-react';
import Modal from '../components/Modal';

export default function Wallets() {
    const [users, setUsers] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');

    const [modalVisible, setModalVisible] = useState(false);
    const [selectedUser, setSelectedUser] = useState<any>(null);
    const [actionType, setActionType] = useState<'credit' | 'debit'>('credit');
    const [amount, setAmount] = useState('');
    const [description, setDescription] = useState('');
    const [processing, setProcessing] = useState(false);
    const [currentUserRole, setCurrentUserRole] = useState<string | null>(null);

    useEffect(() => {
        fetchCurrentUserRole();
        fetchWallets();

        const channel = supabase
            .channel('admin_wallets_changes')
            .on(
                'postgres_changes',
                {
                    event: '*',
                    schema: 'public',
                    table: 'wallets'
                },
                () => fetchWallets()
            )
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, []);

    const fetchCurrentUserRole = async () => {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;
        const { data } = await supabase.from('admin_users').select('role').eq('user_id', user.id).single();
        if (data) setCurrentUserRole(data.role);
    };

    const fetchWallets = async () => {
        try {
            const { data: userData } = await supabase
                .from('users')
                .select('id, full_name, email, phone, role, created_at');

            const { data: walletData } = await supabase
                .from('wallets')
                .select('*');

            if (userData && walletData) {
                const combined = userData.map(user => {
                    const wallet = walletData.find(w => w.user_id === user.id);
                    return {
                        ...user,
                        wallet: wallet || { balance: 0, cashback_earned: 0, referral_earned: 0 }
                    };
                });
                setUsers(combined);
            }
        } catch (error) {
            console.error('Error fetching wallets:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleTransaction = async () => {
        if (!amount || !description) {
            alert('Please provide amount and description');
            return;
        }

        try {
            setProcessing(true);
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) throw new Error('Session expired');

            const { data, error } = await supabase.rpc('admin_wallet_adjustment', {
                p_admin_id: user.id,
                p_user_id: selectedUser.id,
                p_amount: parseFloat(amount),
                p_type: actionType,
                p_reason: description
            });

            if (error) throw error;
            if (!data.success) throw new Error(data.error);

            setModalVisible(false);
            fetchWallets();
            setAmount('');
            setDescription('');
        } catch (error: any) {
            alert(error.message);
        } finally {
            setProcessing(false);
        }
    };

    const openModal = (user: any, type: 'credit' | 'debit') => {
        setSelectedUser(user);
        setActionType(type);
        setModalVisible(true);
    };

    const filteredUsers = users.filter(u =>
        u.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        u.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        u.phone?.includes(searchTerm)
    );

    return (
        <div className="space-y-6 animate-fade-up">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="page-title">User Balances</h1>
                    <p className="page-subtitle">Manage user money and change balance manually</p>
                </div>
                <div className="relative">
                    <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-300" size={14} />
                    <input
                        type="text"
                        placeholder="Search by name or mobile..."
                        className="enterprise-input pl-9 h-10 text-sm w-64"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
            </div>

            <div className="enterprise-card overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="min-w-full">
                        <thead>
                            <tr>
                                <th className="enterprise-table-header">User</th>
                                <th className="enterprise-table-header">Balance</th>
                                <th className="enterprise-table-header">Earnings</th>
                                <th className="enterprise-table-header">Role</th>
                                <th className="enterprise-table-header text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100/60 bg-white">
                            {loading ? (
                                <tr>
                                    <td colSpan={5} className="px-6 py-20 text-center">
                                        <div className="flex flex-col items-center gap-3">
                                            <Loader2 className="animate-spin text-indigo-500 w-6 h-6" />
                                            <p className="text-slate-400 text-[11px] font-bold uppercase tracking-[0.2em]">Loading Balances...</p>
                                        </div>
                                    </td>
                                </tr>
                            ) : filteredUsers.map((user) => (
                                <tr key={user.id} className="group hover:bg-slate-50 transition-all border-b border-slate-50 last:border-0">
                                    <td className="px-6 py-5">
                                        <div className="flex items-center gap-4">
                                            <div className="h-10 w-10 rounded-xl bg-slate-100 flex items-center justify-center text-slate-400 font-bold border border-slate-200 group-hover:bg-indigo-50 group-hover:text-indigo-600 transition-colors">
                                                {user.full_name?.charAt(0) || 'U'}
                                            </div>
                                            <div>
                                                <div className="text-sm font-bold text-slate-900 group-hover:text-indigo-600 transition-colors">{user.full_name || 'Anonymous Entity'}</div>
                                                <div className="text-[10px] text-slate-400 font-bold uppercase tracking-tight">{user.email}</div>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-5">
                                        <div className="flex items-center gap-2">
                                            <div className="text-base font-black text-slate-900 tabular-nums tracking-tighter">₹{user.wallet.balance?.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-5">
                                        <div className="space-y-1.5">
                                            <div className='flex items-center gap-2'>
                                                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider w-8">Earnings:</span>
                                                <span className="text-xs font-bold text-emerald-600 tabular-nums">₹{user.wallet.cashback_earned?.toFixed(2)}</span>
                                                <TrendingUp size={10} className="text-emerald-400" />
                                            </div>
                                            <div className='flex items-center gap-2'>
                                                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider w-8">Refer:</span>
                                                <span className="text-xs font-bold text-amber-600 tabular-nums">₹{user.wallet.referral_earned?.toFixed(2)}</span>
                                                <TrendingUp size={10} className="text-amber-400" />
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-5">
                                        <span className={`enterprise-badge ${user.role === 'admin' ? 'badge-info' : 'badge-success'}`}>
                                            {user.role}
                                        </span>
                                    </td>
                                    <td className="px-6 py-5 text-right">
                                        <div className="flex justify-end gap-3 opacity-0 group-hover:opacity-100 transition-all translate-x-4 group-hover:translate-x-0">
                                            {currentUserRole !== 'support' ? (
                                                <>
                                                    <button
                                                        onClick={() => openModal(user, 'credit')}
                                                        className="h-9 px-4 bg-emerald-50 text-emerald-600 rounded-xl hover:bg-emerald-600 hover:text-white transition-all font-bold text-xs flex items-center gap-2 border border-emerald-100"
                                                        title="Add Money"
                                                    >
                                                        <ArrowUpCircle size={14} />
                                                        <span>Add Money</span>
                                                    </button>
                                                    <button
                                                        onClick={() => openModal(user, 'debit')}
                                                        className="h-9 px-4 bg-red-50 text-red-600 rounded-xl hover:bg-red-600 hover:text-white transition-all font-bold text-xs flex items-center gap-2 border border-red-100"
                                                        title="Remove Money"
                                                    >
                                                        <ArrowDownCircle size={14} />
                                                        <span>Cut Money</span>
                                                    </button>
                                                </>
                                            ) : (
                                                <span className="text-[10px] font-bold text-slate-300 uppercase italic">View Only</span>
                                            )}
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Premium Transaction Modal */}
            <Modal
                isOpen={modalVisible}
                onClose={() => setModalVisible(false)}
                title={actionType === 'credit' ? 'Add Money' : 'Cut Money'}
                subtitle="Change User Balance"
                icon={actionType === 'credit' ? <ArrowUpCircle className="text-emerald-500" /> : <ArrowDownCircle className="text-red-500" />}
                maxWidth="max-w-md"
            >
                <div className="space-y-6">
                    <div className="p-5 bg-slate-900 rounded-2xl space-y-3 shadow-xl shadow-slate-200">
                        <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Selected User</p>
                        <div className="flex items-center gap-3">
                            <div className="h-10 w-10 rounded-xl bg-white/10 flex items-center justify-center text-white text-sm font-bold">
                                {selectedUser?.full_name?.charAt(0)}
                            </div>
                            <div>
                                <p className="font-bold text-white text-sm leading-tight">{selectedUser?.full_name}</p>
                                <p className="text-[10px] text-slate-500 font-medium truncate max-w-[200px]">{selectedUser?.email}</p>
                            </div>
                        </div>
                        <div className="pt-3 border-t border-white/10 flex justify-between items-center">
                            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Current Balance</span>
                            <span className="text-lg font-black text-white tracking-tighter tabular-nums">₹{selectedUser?.wallet?.balance.toLocaleString()}</span>
                        </div>
                    </div>

                    <div className="space-y-4">
                        <div className="space-y-2">
                            <label className="text-[11px] font-bold text-slate-500 uppercase tracking-widest px-1">Amount (₹)</label>
                            <div className="relative group">
                                <span className={`absolute left-4 top-1/2 -translate-y-1/2 font-bold transition-colors ${actionType === 'credit' ? 'text-emerald-500' : 'text-red-500'}`}>₹</span>
                                <input
                                    type="number"
                                    className="enterprise-input pl-10 h-12 shadow-sm font-black text-base tabular-nums"
                                    placeholder="0.00"
                                    value={amount}
                                    onChange={e => setAmount(e.target.value)}
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label className="text-[11px] font-bold text-slate-500 uppercase tracking-widest px-1">Reason for Change</label>
                            <textarea
                                className="enterprise-input py-3 min-h-[80px] resize-none text-xs"
                                placeholder="Why are you changing this balance? (e.g. Refund, Bonus)"
                                value={description}
                                onChange={e => setDescription(e.target.value)}
                            />
                        </div>
                    </div>

                    <div className="flex gap-4 border-t border-slate-100 pt-6">
                        <button
                            onClick={() => setModalVisible(false)}
                            className="flex-1 enterprise-btn-secondary justify-center h-12"
                        >
                            Cancel
                        </button>
                        <button
                            onClick={handleTransaction}
                            disabled={processing}
                            className={`flex-1 enterprise-btn-primary justify-center h-12 ${actionType === 'credit' ? 'bg-emerald-600 hover:bg-emerald-700' : 'bg-red-600 hover:bg-red-700'
                                }`}
                        >
                            {processing ? <Loader2 className="animate-spin w-4 h-4" /> : 'Confirm Change'}
                        </button>
                    </div>
                </div>
            </Modal>
        </div>
    );
}
