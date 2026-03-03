import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { Eye, CheckCircle, XCircle, FileText, ExternalLink, RefreshCw, ShoppingBag, ShieldCheck } from 'lucide-react';
import Modal from '../components/Modal';

export default function Claims() {
    const [requests, setRequests] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [modalVisible, setModalVisible] = useState(false);
    const [selectedClaim, setSelectedClaim] = useState<any>(null);
    const [action, setAction] = useState<'approve' | 'reject' | null>(null);
    const [remarks, setRemarks] = useState('');
    const [approvedAmount, setApprovedAmount] = useState('');
    const [processing, setProcessing] = useState(false);
    const [proofUrl, setProofUrl] = useState<string | null>(null);
    const [currentUserRole, setCurrentUserRole] = useState<string | null>(null);

    useEffect(() => {
        fetchCurrentUserRole();
        fetchClaims();
    }, []);

    const fetchCurrentUserRole = async () => {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;
        const { data } = await supabase.from('admin_users').select('role').eq('user_id', user.id).single();
        if (data) setCurrentUserRole(data.role);
    };

    const fetchClaims = async () => {
        setLoading(true);
        const { data } = await supabase
            .from('manual_cashback_requests')
            .select(`
                *,
                user:users(full_name, email, phone)
            `)
            .order('created_at', { ascending: false });

        if (data) setRequests(data);
        setLoading(false);
    };

    const openModal = async (claim: any, actionType: 'approve' | 'reject' | null) => {
        setSelectedClaim(claim);
        setAction(actionType);
        setRemarks('');
        setApprovedAmount(claim.amount.toString());
        setModalVisible(true);

        // Get Signed URL for Proof
        if (claim.proof_url) {
            const { data } = await supabase.storage
                .from('cashback_bills')
                .createSignedUrl(claim.proof_url, 3600); // 1 hour validity

            setProofUrl(data?.signedUrl || null);
        } else {
            setProofUrl(null);
        }
    };

    const handleProcess = async () => {
        if (!remarks) {
            alert('Please enter approval/rejection remarks');
            return;
        }

        setProcessing(true);
        let result;

        if (action === 'approve') {
            result = await supabase.rpc('approve_manual_cashback', {
                p_request_id: selectedClaim.id,
                p_approved_amount: parseFloat(approvedAmount),
                p_admin_remarks: remarks
            });
        } else {
            result = await supabase.rpc('reject_manual_cashback', {
                p_request_id: selectedClaim.id,
                p_admin_remarks: remarks
            });
        }

        const { data, error } = result;

        if (error) {
            alert('Error processing claim: ' + error.message);
        } else if (data && !data.success) {
            alert('Failed: ' + data.error);
        } else {
            setModalVisible(false);
            fetchClaims();
        }
        setProcessing(false);
    };

    const getStatusBadge = (status: string) => {
        switch (status) {
            case 'approved':
                return (
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-700">
                        <CheckCircle size={12} /> APPROVED
                    </span>
                );
            case 'rejected':
                return (
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-red-100 text-red-700">
                        <XCircle size={12} /> REJECTED
                    </span>
                );
            default:
                return (
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-amber-100 text-amber-700">
                        <RefreshCw size={12} className={status === 'pending' ? 'animate-spin-slow' : ''} /> PENDING
                    </span>
                );
        }
    };

    return (
        <div className="space-y-6 animate-fade-up">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="page-title">Claim Requests</h1>
                    <p className="page-subtitle">Review and process user-submitted cashback bills</p>
                </div>
                <button onClick={fetchClaims} className="enterprise-btn-secondary text-xs gap-1.5">
                    <RefreshCw size={13} className={loading ? 'animate-spin' : ''} /> Refresh
                </button>
            </div>

            <div className="enterprise-card overflow-hidden">
                <table className="w-full text-left">
                    <thead>
                        <tr>
                            <th className="enterprise-table-header">User Details</th>
                            <th className="enterprise-table-header">Store Info</th>
                            <th className="enterprise-table-header">Amount</th>
                            <th className="enterprise-table-header">Proof</th>
                            <th className="enterprise-table-header">Status</th>
                            <th className="enterprise-table-header text-right">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-slate-50">
                        {loading ? (
                            [...Array(5)].map((_, i) => (
                                <tr key={i}>{[...Array(6)].map((_, j) => (
                                    <td key={j} className="px-5 py-4">
                                        <div className="h-3.5 rounded bg-slate-100 animate-pulse" style={{ width: `${[70, 60, 30, 30, 35, 60][j]}%` }} />
                                    </td>
                                ))}</tr>
                            ))
                        ) : requests.map(req => (
                            <tr key={req.id} className="hover:bg-slate-50 transition-colors">
                                <td className="px-6 py-4">
                                    <div className="font-bold text-slate-900">{req.user?.full_name || 'Unknown'}</div>
                                    <div className="text-xs text-slate-500 mt-0.5">{req.user?.email}</div>
                                    <div className="text-[10px] text-slate-400 mt-0.5 font-mono">{new Date(req.created_at).toLocaleDateString()}</div>
                                </td>
                                <td className="px-6 py-4">
                                    <div className="flex items-center gap-2">
                                        <div className="w-8 h-8 rounded-lg bg-indigo-50 flex items-center justify-center text-indigo-600">
                                            <ShoppingBag size={16} />
                                        </div>
                                        <div>
                                            <div className="font-bold text-slate-800">{req.store_name}</div>
                                            <div className="text-xs font-mono text-slate-500">#{req.order_id}</div>
                                        </div>
                                    </div>
                                </td>
                                <td className="px-6 py-4">
                                    <div className="font-bold text-slate-900 text-base">₹{req.amount}</div>
                                </td>
                                <td className="px-6 py-4">
                                    <button
                                        onClick={() => openModal(req, null)}
                                        className="text-indigo-600 hover:text-indigo-800 hover:bg-indigo-50 px-3 py-1.5 rounded-lg flex items-center gap-2 text-xs font-bold transition"
                                    >
                                        <FileText size={14} /> View
                                    </button>
                                </td>
                                <td className="px-6 py-4">
                                    {getStatusBadge(req.status)}
                                </td>
                                <td className="px-6 py-4 text-right">
                                    {req.status === 'pending' && (
                                        <div className="flex justify-end gap-2">
                                            {currentUserRole !== 'support' ? (
                                                <>
                                                    <button
                                                        onClick={() => openModal(req, 'reject')}
                                                        className="p-2 bg-white border border-slate-200 text-red-600 rounded-lg hover:bg-red-50 hover:border-red-200 transition shadow-sm"
                                                        title="Reject"
                                                    >
                                                        <XCircle size={18} />
                                                    </button>
                                                    <button
                                                        onClick={() => openModal(req, 'approve')}
                                                        className="p-2 bg-slate-900 text-white rounded-lg hover:bg-slate-800 transition shadow-md shadow-slate-200"
                                                        title="Approve"
                                                    >
                                                        <CheckCircle size={18} />
                                                    </button>
                                                </>
                                            ) : (
                                                <button
                                                    onClick={() => openModal(req, null)}
                                                    className="p-2 bg-white border border-slate-200 text-slate-400 rounded-lg hover:bg-slate-50 transition shadow-sm"
                                                    title="View Only"
                                                >
                                                    <Eye size={18} />
                                                </button>
                                            )}
                                        </div>
                                    )}
                                </td>
                            </tr>
                        ))}
                        {!loading && requests.length === 0 && (
                            <tr><td colSpan={6} className="p-12 text-center text-slate-400">No cashback claims found.</td></tr>
                        )}
                    </tbody>
                </table>
            </div>

            {/* Claims Review Modal */}
            <Modal
                isOpen={modalVisible && !!selectedClaim}
                onClose={() => setModalVisible(false)}
                title="Protocol Review"
                subtitle="Manual Cashback Verification"
                icon={action === 'approve' ? <CheckCircle size={28} className="text-emerald-500" strokeWidth={2.5} /> : action === 'reject' ? <XCircle size={28} className="text-red-500" strokeWidth={2.5} /> : <FileText size={28} className="text-indigo-500" strokeWidth={2.5} />}
                maxWidth="max-w-6xl"
            >
                <div className="flex flex-col lg:flex-row gap-8 min-h-[500px]">
                    {/* Left: Details Panel */}
                    <div className="flex-1 space-y-6">
                        <div className="space-y-4">
                            <h3 className="text-sm font-black text-slate-900 uppercase tracking-widest border-b border-slate-100 pb-2">Technical Dossier</h3>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Customer Identifier</p>
                                    <p className="font-bold text-slate-900 truncate">{selectedClaim?.user?.full_name}</p>
                                    <p className="text-[10px] font-medium text-slate-400 truncate">{selectedClaim?.user?.email}</p>
                                </div>
                                <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Node Status</p>
                                    <div className="mt-1">{selectedClaim && getStatusBadge(selectedClaim.status)}</div>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Store / Merchant</p>
                                    <div className="flex items-center gap-2 mt-1">
                                        <ShoppingBag size={14} className="text-indigo-500" />
                                        <p className="font-bold text-slate-900 text-sm truncate">{selectedClaim?.store_name}</p>
                                    </div>
                                </div>
                                <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Bill Amount</p>
                                    <p className="text-lg font-black text-slate-900 mt-1">₹{selectedClaim?.amount}</p>
                                </div>
                            </div>
                        </div>

                        {action === 'approve' && (
                            <div className="p-6 bg-emerald-50 rounded-3xl border border-emerald-100 space-y-3">
                                <label className="flex items-center gap-2 text-[10px] font-black text-emerald-800 uppercase tracking-widest">
                                    <ShieldCheck size={14} /> Settlement Quantum
                                </label>
                                <div className="relative">
                                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-emerald-600 font-black text-xl">₹</span>
                                    <input
                                        type="number"
                                        value={approvedAmount}
                                        onChange={e => setApprovedAmount(e.target.value)}
                                        className="w-full bg-white border border-emerald-200 rounded-2xl pl-10 pr-4 h-14 text-2xl font-black text-emerald-700 focus:outline-none focus:ring-4 focus:ring-emerald-500/10 transition-all"
                                    />
                                </div>
                            </div>
                        )}

                        {action && (
                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 italic">
                                    {action === 'approve' ? 'Verification Log' : 'Rejection Protocol'}
                                </label>
                                <textarea
                                    value={remarks}
                                    onChange={e => setRemarks(e.target.value)}
                                    placeholder={action === 'approve' ? "Merchant bill verified. Initializing cashback injection..." : "Bill clarity insufficient for protocol verification."}
                                    className="enterprise-input min-h-[120px] py-4 resize-none text-sm leading-relaxed"
                                />
                            </div>
                        )}

                        {action ? (
                            <div className="pt-4 grid grid-cols-2 gap-4">
                                <button
                                    onClick={() => setModalVisible(false)}
                                    className="h-12 rounded-2xl border border-slate-200 text-slate-600 font-black text-xs uppercase tracking-widest hover:bg-slate-50 transition-all active:scale-95"
                                >
                                    Abort
                                </button>
                                <button
                                    onClick={handleProcess}
                                    disabled={processing}
                                    className={`h-12 rounded-2xl font-black text-xs uppercase tracking-widest text-white shadow-xl transition-all active:scale-95 flex items-center justify-center gap-2 ${action === 'approve' ? 'bg-emerald-600 hover:bg-emerald-700 shadow-emerald-200' : 'bg-red-600 hover:bg-red-700 shadow-red-200'
                                        }`}
                                >
                                    {processing ? <RefreshCw className="animate-spin" size={16} /> : <><ShieldCheck size={16} /> {action === 'approve' ? 'Authorize' : 'Decline'}</>}
                                </button>
                            </div>
                        ) : (
                            <button
                                onClick={() => setModalVisible(false)}
                                className="w-full h-12 rounded-2xl bg-slate-900 text-white font-black text-xs uppercase tracking-widest hover:bg-indigo-600 transition-all shadow-xl active:scale-95"
                            >
                                Dismiss Transmission
                            </button>
                        )}
                    </div>

                    {/* Right: Modern Proof Viewer */}
                    <div className="flex-[1.5] flex flex-col rounded-[32px] overflow-hidden bg-slate-950 border border-white/5 shadow-2xl min-h-[400px]">
                        <div className="p-4 bg-white/5 border-b border-white/5 flex justify-between items-center">
                            <div className="flex items-center gap-3">
                                <div className="w-8 h-8 rounded-lg bg-indigo-500/20 text-indigo-400 flex items-center justify-center">
                                    <FileText size={16} />
                                </div>
                                <span className="font-bold text-xs text-slate-300 tracking-tight">Proof Encryption Node</span>
                            </div>
                            {proofUrl && (
                                <a href={proofUrl} target="_blank" rel="noreferrer" className="enterprise-badge bg-indigo-500 text-white border-none text-[10px] gap-1.5 hover:bg-indigo-600">
                                    Original <ExternalLink size={10} />
                                </a>
                            )}
                        </div>

                        <div className="flex-1 relative overflow-auto flex items-center justify-center p-8 bg-black/40">
                            {proofUrl ? (
                                proofUrl.includes('.pdf') ? (
                                    <div className="text-center space-y-6">
                                        <div className="w-24 h-24 bg-white/10 rounded-[32px] flex items-center justify-center mx-auto border border-white/10 shadow-2xl">
                                            <FileText size={48} className="text-indigo-400" />
                                        </div>
                                        <div>
                                            <p className="text-slate-300 font-bold">PDF Protocol Detected</p>
                                            <p className="text-slate-500 text-[10px] uppercase tracking-widest mt-1">Visualizer unavailable in secure node</p>
                                        </div>
                                        <a href={proofUrl} target="_blank" rel="noreferrer" className="inline-flex enterprise-btn-primary bg-indigo-500 h-11 px-8">
                                            Extract Document
                                        </a>
                                    </div>
                                ) : (
                                    <img src={proofUrl} alt="Bill Proof" className="max-w-full max-h-full object-contain rounded-2xl shadow-[0_0_50px_rgba(0,0,0,0.5)] border border-white/10" />
                                )
                            ) : (
                                <div className="flex flex-col items-center gap-4 opacity-30">
                                    <RefreshCw size={32} className="animate-spin text-indigo-500" />
                                    <p className="text-indigo-500 font-black text-[10px] uppercase tracking-[0.3em]">Decoding Evidence...</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </Modal>
        </div>
    );
}
