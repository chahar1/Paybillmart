import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import {
    Shield,
    Save,
    RefreshCcw,
    CreditCard,
    Percent,
    Zap,
    Loader2,
    CheckCircle2,
    AlertCircle,
    ArrowRight,
    Plus,
    Edit2,
    Trash2,
    Globe,
    Activity,
    Smartphone,
    Database,
    Network,
    Cpu,
    HelpCircle
} from 'lucide-react';
import Modal from '../components/Modal';

export default function SystemSettings() {
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [status, setStatus] = useState<{ type: 'success' | 'error', message: string } | null>(null);
    const [activeTab, setActiveTab] = useState<'infrastructure' | 'financials' | 'database' | 'support' | 'app'>('infrastructure');

    // Support Config State
    const [supportConfig, setSupportConfig] = useState<any>({
        call_support: '',
        whatsapp_support: '',
        email_support: '',
        feedback_link: '',
        operational_hours: '',
        prepaid_toll_free: '',
        dth_toll_free: '',
        whatsapp_channel: '',
        instagram_link: '',
        social_links: {
            youtube: '',
            facebook: '',
            twitter: '',
            telegram: ''
        }
    });

    // Config states
    const [bankConfig, setBankConfig] = useState<any>({
        upi_id: '',
        bank_name: '',
        account_holder: '',
        ifsc: '',
        account_number: ''
    });
    const [cashbackRules, setCashbackRules] = useState<any>({
        default_rate: 0,
        max_cashback: 0,
        min_recharge: 0,
        is_enabled: true
    });
    const [apiSwitching, setApiSwitching] = useState<any>({
        primary_api: '',
        failover_enabled: true,
        retry_attempts: 3
    });
    const [apis, setApis] = useState<any[]>([]);
    const [appSettings, setAppSettings] = useState<any>({
        merchant_token: '',
        api_proxy_url: '',
        app_notice: '',
        force_update: false,
        min_app_version: '1.0.0'
    });

    // API Master Modal State
    const [showApiModal, setShowApiModal] = useState(false);
    const [editingApi, setEditingApi] = useState<any>(null);
    const [apiFormData, setApiFormData] = useState({
        name: '',
        api_key: '',
        base_url: '',
        priority: 1,
        daily_hit_limit: 1000,
    });

    useEffect(() => {
        const loadInitialData = async () => {
            setLoading(true);
            await Promise.all([
                fetchConfigs(),
                fetchApis()
            ]);
            setLoading(false);
        };
        loadInitialData();
    }, []);



    const fetchConfigs = async () => {
        try {
            const { data, error } = await supabase
                .from('system_configs')
                .select('*');

            if (error) throw error;

            data?.forEach(config => {
                if (config.key === 'bank_config') setBankConfig(config.value);
                if (config.key === 'cashback_rules') setCashbackRules(config.value);
                if (config.key === 'api_switching') setApiSwitching(config.value);
                if (config.key === 'support_settings') setSupportConfig(config.value);
                if (config.key === 'app_settings') setAppSettings(config.value);
            });
        } catch (error) {
            console.error('Error fetching configs:', error);
        }
    };

    const fetchApis = async () => {
        const { data, error } = await supabase
            .from('api_master')
            .select('*')
            .order('priority', { ascending: true });

        if (data) setApis(data);
        if (error) console.error('Error fetching APIs:', error);
    };

    const handleSaveApi = async () => {
        setSaving(true);
        setStatus(null);
        try {
            const payload = {
                ...apiFormData,
                updated_at: new Date().toISOString()
            };

            let error;
            if (editingApi) {
                const { error: err } = await supabase
                    .from('api_master')
                    .update(payload)
                    .eq('id', editingApi.id);
                error = err;
            } else {
                const { error: err } = await supabase
                    .from('api_master')
                    .insert([payload]);
                error = err;
            }

            if (error) throw error;

            setStatus({ type: 'success', message: `Protocol ${editingApi ? 'saved' : 'setup'} successfully` });
            setShowApiModal(false);
            fetchApis();
        } catch (error: any) {
            setStatus({ type: 'error', message: error.message });
        } finally {
            setSaving(false);
            setTimeout(() => setStatus(null), 3000);
        }
    };

    const toggleApiStatus = async (id: string, currentStatus: boolean) => {
        try {
            const { error } = await supabase
                .from('api_master')
                .update({ is_active: !currentStatus })
                .eq('id', id);

            if (error) throw error;
            fetchApis();
        } catch (error: any) {
            alert('System error: ' + error.message);
        }
    };

    const deleteApi = async (id: string) => {
        if (!window.confirm('Delete this API connection?')) return;

        try {
            const { error } = await supabase
                .from('api_master')
                .delete()
                .eq('id', id);

            if (error) throw error;
            fetchApis();
        } catch (error: any) {
            alert('Delete error: ' + error.message);
        }
    };

    const handleSave = async (key: string, value: any) => {
        setSaving(true);
        setStatus(null);
        try {
            const { data, error } = await supabase.rpc('update_system_config', {
                p_key: key,
                p_value: value
            });

            if (error) throw error;
            if (data.success) {
                setStatus({ type: 'success', message: `${key.replace('_', ' ').toUpperCase()} saved successfully` });
            } else {
                throw new Error(data.error);
            }
        } catch (error: any) {
            setStatus({ type: 'error', message: error.message });
        } finally {
            setSaving(false);
            setTimeout(() => setStatus(null), 3000);
        }
    };

    if (loading) return (
        <div className="p-8 flex items-center justify-center h-full">
            <Loader2 className="w-8 h-8 text-indigo-600 animate-spin" />
        </div>
    );



    return (
        <div className="space-y-10 animate-in fade-in duration-500 max-w-[1400px] mx-auto pb-20">
            {/* Enterprise Header - Ultra Minimal */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-8 bg-white p-12 rounded-[32px] border border-slate-100 shadow-sm relative overflow-hidden">
                <div className="flex items-center gap-8 z-10">
                    <div className="w-16 h-16 bg-slate-900 rounded-2xl text-white flex items-center justify-center shadow-2xl">
                        <Cpu size={32} strokeWidth={1.5} />
                    </div>
                    <div>
                        <h1 className="text-4xl font-bold text-slate-950 tracking-tighter uppercase mb-1">Main Settings</h1>
                        <p className="text-slate-400 font-bold text-[10px] uppercase tracking-[0.3em]">Control Center</p>
                    </div>
                </div>

                <div className="flex flex-col md:items-end gap-3 z-10">
                    {status && (
                        <div className={`flex items-center gap-3 px-6 py-4 rounded-2xl text-[10px] font-bold uppercase tracking-widest shadow-sm animate-in slide-in-from-right-4 border ${status.type === 'success' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 'bg-red-50 text-red-600 border-red-100'
                            }`}>
                            {status.type === 'success' ? <CheckCircle2 size={16} strokeWidth={2.5} /> : <AlertCircle size={16} strokeWidth={2.5} />}
                            {status.message}
                        </div>
                    )}
                </div>
            </div>

            {/* Modular Navigation Tabs - Ultra Minimal */}
            <div className="flex items-center gap-4 bg-white p-2 rounded-[24px] w-fit border border-slate-100 shadow-sm">
                {[
                    { id: 'infrastructure', label: 'API Settings', icon: Network },
                    { id: 'financials', label: 'Bank & Cashback', icon: CreditCard },
                    { id: 'database', label: 'Master Lists', icon: Database },
                    { id: 'support', label: 'Customer Help', icon: HelpCircle },
                    { id: 'app', label: 'App Settings', icon: Smartphone },
                ].map(({ id, label, icon: Icon }) => (
                    <button
                        key={id}
                        onClick={() => setActiveTab(id as any)}
                        className={`flex items-center gap-3 px-8 py-4 rounded-[18px] text-[10px] font-bold uppercase tracking-widest transition-all ${activeTab === id ? 'bg-slate-900 text-white shadow-lg' : 'text-slate-400 hover:text-slate-900 hover:bg-slate-50'
                            }`}
                    >
                        <Icon size={16} strokeWidth={activeTab === id ? 2.5 : 2} />
                        {label}
                    </button>
                ))}
            </div>

            {/* Content Modules */}
            <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                {activeTab === 'infrastructure' && (
                    <div className="space-y-8">
                        <div className="grid grid-cols-1 xl:grid-cols-4 gap-8">
                            <div className="xl:col-span-3 space-y-8">
                                {/* API Table Header */}
                                <div className="enterprise-card overflow-hidden">
                                    <div className="p-8 border-b border-slate-100 flex justify-between items-center bg-slate-50/30">
                                        <div className="flex items-center gap-4">
                                            <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center text-white">
                                                <Globe size={20} />
                                            </div>
                                            <div>
                                                <h2 className="text-xl font-black text-slate-900 tracking-tight">Recharge API Gateway</h2>
                                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Manage your API providers</p>
                                            </div>
                                        </div>
                                        <button
                                            onClick={() => {
                                                setEditingApi(null);
                                                setApiFormData({ name: '', api_key: '', base_url: '', priority: 1, daily_hit_limit: 1000 });
                                                setShowApiModal(true);
                                            }}
                                            className="enterprise-btn-primary"
                                        >
                                            <Plus size={18} />
                                            Add New API
                                        </button>
                                    </div>
                                    <div className="overflow-x-auto">
                                        <table className="w-full text-left">
                                            <thead>
                                                <tr>
                                                    <th className="enterprise-table-header">Provider Name</th>
                                                    <th className="enterprise-table-header text-center">Priority</th>
                                                    <th className="enterprise-table-header text-center">Usage</th>
                                                    <th className="enterprise-table-header text-center">Status</th>
                                                    <th className="enterprise-table-header text-right">Action</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-slate-50">
                                                {apis.map(api => (
                                                    <tr key={api.id} className="hover:bg-slate-50/50 transition-all group">
                                                        <td className="px-6 py-6 border-b border-slate-50">
                                                            <div className="flex items-center gap-4">
                                                                <div className={`w-12 h-12 rounded-xl flex items-center justify-center font-black text-lg ${api.is_active ? 'bg-indigo-50 text-indigo-600' : 'bg-slate-100 text-slate-400'}`}>
                                                                    {api.name.charAt(0)}
                                                                </div>
                                                                <div>
                                                                    <div className="font-bold text-slate-900 text-sm tracking-tight">{api.name}</div>
                                                                    <div className="text-[10px] text-slate-400 font-mono mt-0.5">{api.base_url}</div>
                                                                </div>
                                                            </div>
                                                        </td>
                                                        <td className="px-6 py-6 text-center border-b border-slate-50">
                                                            <span className="text-sm font-black text-slate-900">1:{api.priority}</span>
                                                        </td>
                                                        <td className="px-6 py-6 border-b border-slate-50">
                                                            <div className="flex flex-col gap-1.5 max-w-[120px] mx-auto">
                                                                <div className="flex justify-between text-[9px] font-black uppercase text-slate-400">
                                                                    <span>Usage</span>
                                                                    <span className="text-slate-900">{Math.round(((api.current_hits || 0) / api.daily_hit_limit) * 100)}%</span>
                                                                </div>
                                                                <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
                                                                    <div
                                                                        className={`h-full rounded-full transition-all duration-1000 ${((api.current_hits || 0) / api.daily_hit_limit) > 0.8 ? 'bg-red-500' : 'bg-indigo-500'}`}
                                                                        style={{ width: `${Math.min(100, ((api.current_hits || 0) / api.daily_hit_limit) * 100)}%` }}
                                                                    />
                                                                </div>
                                                            </div>
                                                        </td>
                                                        <td className="px-6 py-6 text-center border-b border-slate-50">
                                                            <button
                                                                onClick={() => toggleApiStatus(api.id, api.is_active)}
                                                                className={`enterprise-badge ${api.is_active ? 'badge-success' : 'bg-slate-100 text-slate-400 border-slate-200'}`}
                                                            >
                                                                {api.is_active ? 'Online' : 'Revoked'}
                                                            </button>
                                                        </td>
                                                        <td className="px-6 py-6 text-right border-b border-slate-50">
                                                            <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-all translate-x-2 group-hover:translate-x-0">
                                                                <button
                                                                    onClick={() => {
                                                                        setEditingApi(api);
                                                                        setApiFormData({
                                                                            name: api.name,
                                                                            api_key: api.api_key || '',
                                                                            base_url: api.base_url || '',
                                                                            priority: api.priority,
                                                                            daily_hit_limit: api.daily_hit_limit
                                                                        });
                                                                        setShowApiModal(true);
                                                                    }}
                                                                    className="p-2 hover:bg-white hover:shadow-sm rounded-lg text-slate-400 hover:text-indigo-600 transition-all border border-transparent hover:border-slate-100"
                                                                >
                                                                    <Edit2 size={14} />
                                                                </button>
                                                                <button
                                                                    onClick={() => deleteApi(api.id)}
                                                                    className="p-2 hover:bg-white hover:shadow-sm rounded-lg text-slate-400 hover:text-red-500 transition-all border border-transparent hover:border-slate-100"
                                                                >
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
                            </div>

                            <div className="space-y-8">
                                {/* Routing Logic */}
                                <div className="bg-white border border-slate-100 rounded-[32px] p-10 space-y-8">
                                    <div className="flex items-center gap-5">
                                        <div className="w-12 h-12 rounded-2xl bg-slate-50 text-slate-950 flex items-center justify-center border border-slate-100">
                                            <RefreshCcw size={20} strokeWidth={2.5} />
                                        </div>
                                        <div>
                                            <h3 className="font-bold text-slate-950 text-lg tracking-tight leading-none">Auto Switch API</h3>
                                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-2">Automatic Backup Settings</p>
                                        </div>
                                    </div>
                                    <div className="space-y-6">
                                        <div className="space-y-2">
                                            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Priority Override</label>
                                            <select
                                                value={apiSwitching.primary_api}
                                                onChange={e => setApiSwitching({ ...apiSwitching, primary_api: e.target.value })}
                                                className="enterprise-input h-12 appearance-none"
                                            >
                                                <option value="">Matrix Dynamic Selection</option>
                                                {apis.filter(a => a.is_active).map(api => (
                                                    <option key={api.id} value={api.id}>{api.name}</option>
                                                ))}
                                            </select>
                                        </div>
                                        <div className="flex items-center justify-between p-6 bg-slate-50/50 rounded-2xl border border-slate-100">
                                            <div>
                                                <p className="text-xs font-bold text-slate-900 uppercase">Protocol Failover</p>
                                                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-0.5">Synchronous retry on failure</p>
                                            </div>
                                            <label className="relative inline-flex items-center cursor-pointer">
                                                <input
                                                    type="checkbox"
                                                    checked={apiSwitching.failover_enabled}
                                                    onChange={e => setApiSwitching({ ...apiSwitching, failover_enabled: e.target.checked })}
                                                    className="sr-only peer"
                                                />
                                                <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-slate-950"></div>
                                            </label>
                                        </div>
                                        <button
                                            onClick={() => handleSave('api_switching', apiSwitching)}
                                            disabled={saving}
                                            className="w-full h-14 bg-slate-900 text-white rounded-2xl font-bold text-xs uppercase tracking-[0.2em] hover:bg-black transition-all active:scale-95 flex items-center justify-center gap-3 disabled:opacity-50"
                                        >
                                            {saving && activeTab === 'infrastructure' ? <Loader2 size={18} className="animate-spin" /> : <Save size={18} strokeWidth={2.5} />}
                                            Save Settings
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {activeTab === 'financials' && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                        {/* Financial Registry - Ultra Minimal */}
                        <div className="bg-white border border-slate-100 rounded-[32px] p-12 space-y-10">
                            <div className="flex items-center gap-6">
                                <div className="h-14 w-14 bg-slate-50 border border-slate-100 rounded-2xl flex items-center justify-center text-slate-950">
                                    <CreditCard size={28} strokeWidth={1.5} />
                                </div>
                                <div>
                                    <h2 className="text-2xl font-bold text-slate-950 tracking-tight leading-none">Bank Details</h2>
                                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em] mt-2">Main Company Bank Account</p>
                                </div>
                            </div>

                            <div className="space-y-6">
                                <div className="space-y-2">
                                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Company UPI ID</label>
                                    <input
                                        type="text"
                                        value={bankConfig.upi_id}
                                        onChange={e => setBankConfig({ ...bankConfig, upi_id: e.target.value })}
                                        className="enterprise-input h-14 font-bold text-slate-950"
                                        placeholder="yourname@upi"
                                    />
                                </div>
                                <div className="grid grid-cols-2 gap-6">
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Bank Name</label>
                                        <input
                                            type="text"
                                            value={bankConfig.bank_name}
                                            onChange={e => setBankConfig({ ...bankConfig, bank_name: e.target.value })}
                                            className="enterprise-input h-14"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">IFSC Code</label>
                                        <input
                                            type="text"
                                            value={bankConfig.ifsc}
                                            onChange={e => setBankConfig({ ...bankConfig, ifsc: e.target.value })}
                                            className="enterprise-input h-14 font-mono uppercase text-sm"
                                        />
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Account Holder Name</label>
                                    <input
                                        type="text"
                                        value={bankConfig.account_holder}
                                        onChange={e => setBankConfig({ ...bankConfig, account_holder: e.target.value })}
                                        className="enterprise-input h-14"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Bank Account Number</label>
                                    <input
                                        type="text"
                                        value={bankConfig.account_number}
                                        onChange={e => setBankConfig({ ...bankConfig, account_number: e.target.value })}
                                        className="enterprise-input h-14 font-mono text-lg"
                                    />
                                </div>
                                <button
                                    onClick={() => handleSave('bank_config', bankConfig)}
                                    disabled={saving}
                                    className="w-full h-16 bg-slate-900 text-white rounded-2xl font-bold text-xs uppercase tracking-[0.25em] hover:bg-black transition-all active:scale-95 flex items-center justify-center gap-4 disabled:opacity-50 shadow-xl shadow-slate-200 mt-4"
                                >
                                    {saving && activeTab === 'financials' ? <Loader2 className="animate-spin" /> : <Save size={20} strokeWidth={2.5} />}
                                    Push Banking Config
                                </button>
                            </div>
                        </div>

                        {/* Reward Logic - Ultra Minimal */}
                        <div className="bg-white border border-slate-100 rounded-[32px] p-12 space-y-10">
                            <div className="flex items-center gap-6">
                                <div className="h-14 w-14 bg-slate-900 rounded-2xl flex items-center justify-center text-white">
                                    <Percent size={28} strokeWidth={1.5} />
                                </div>
                                <div>
                                    <h2 className="text-2xl font-bold text-slate-950 tracking-tight leading-none">Cashback Settings</h2>
                                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em] mt-2">Set how much users earn</p>
                                </div>
                            </div>

                            <div className="space-y-8">
                                <div className="flex items-center justify-between p-8 bg-slate-950 rounded-[28px] shadow-2xl">
                                    <div>
                                        <p className="text-xs font-bold text-white uppercase tracking-widest">Enable Cashback</p>
                                        <p className="text-[10px] text-white/40 font-bold uppercase tracking-widest mt-1">Global on/off switch</p>
                                    </div>
                                    <label className="relative inline-flex items-center cursor-pointer">
                                        <input
                                            type="checkbox"
                                            checked={cashbackRules.is_enabled}
                                            onChange={e => setCashbackRules({ ...cashbackRules, is_enabled: e.target.checked })}
                                            className="sr-only peer"
                                        />
                                        <div className="w-14 h-7 bg-white/10 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-[4px] after:left-[4px] after:bg-white after:rounded-full after:h-6 after:w-6 after:transition-all peer-checked:bg-indigo-500"></div>
                                    </label>
                                </div>

                                <div className="grid grid-cols-2 gap-8">
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Cashback Percent (%)</label>
                                        <input
                                            type="number"
                                            step="0.1"
                                            value={cashbackRules.default_rate}
                                            onChange={e => setCashbackRules({ ...cashbackRules, default_rate: parseFloat(e.target.value) })}
                                            className="enterprise-input h-14 font-bold text-xl"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Maximum Cashback (₹)</label>
                                        <input
                                            type="number"
                                            value={cashbackRules.max_cashback}
                                            onChange={e => setCashbackRules({ ...cashbackRules, max_cashback: parseFloat(e.target.value) })}
                                            className="enterprise-input h-14 font-bold text-xl"
                                        />
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Minimum Recharge (₹)</label>
                                    <div className="relative">
                                        <span className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400 font-bold">₹</span>
                                        <input
                                            type="number"
                                            value={cashbackRules.min_recharge}
                                            onChange={e => setCashbackRules({ ...cashbackRules, min_recharge: parseFloat(e.target.value) })}
                                            className="enterprise-input pl-12 h-14 font-bold text-xl"
                                        />
                                    </div>
                                </div>

                                <button
                                    onClick={() => handleSave('cashback_rules', cashbackRules)}
                                    disabled={saving}
                                    className="w-full h-16 bg-slate-900 text-white rounded-2xl font-bold text-xs uppercase tracking-[0.25em] hover:bg-black transition-all active:scale-95 flex items-center justify-center gap-4 disabled:opacity-50"
                                >
                                    {saving && activeTab === 'financials' ? <Loader2 className="animate-spin" /> : <Save size={20} strokeWidth={2.5} />}
                                    Commit Reward Matrix
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {activeTab === 'database' && (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                        <MasterLink label="Operator ID List" icon={<Smartphone size={20} />} description="Setup operator codes and rules." />
                        <MasterLink label="Service Categories" icon={<Zap size={20} />} description="List of all recharge and bill types." />
                        <MasterLink label="API Message Formats" icon={<Globe size={20} />} description="Manage how data is sent to back APIs." />
                        <MasterLink label="Security & Access" icon={<Shield size={20} />} description="Manage who can login and what they can see." />
                        <MasterLink label="Recent Activity Logs" action label2="View Logs" icon={<Activity size={20} />} description="See list of all recent system actions." />
                        <div className="enterprise-card p-8 border-dashed border-2 flex flex-col items-center justify-center text-center opacity-40 hover:opacity-100 transition-opacity cursor-pointer group">
                            <div className="w-12 h-12 rounded-full border-2 border-slate-300 flex items-center justify-center text-slate-400 group-hover:bg-slate-900 group-hover:text-white group-hover:border-slate-900 transition-all">
                                <Plus size={24} />
                            </div>
                            <p className="mt-4 font-black text-xs uppercase tracking-widest text-slate-500">Add New List</p>
                        </div>
                    </div>
                )}

                {activeTab === 'support' && (
                    <div className="bg-white border border-slate-100 rounded-[32px] p-12 space-y-12">
                        <div className="flex items-center gap-6">
                            <div className="h-14 w-14 bg-slate-50 border border-slate-100 rounded-2xl flex items-center justify-center text-slate-950">
                                <HelpCircle size={28} strokeWidth={1.5} />
                            </div>
                            <div>
                                <h2 className="text-2xl font-bold text-slate-950 tracking-tight leading-none">Customer Support</h2>
                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em] mt-2">Help center details</p>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                            <div className="space-y-2">
                                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Call Support Number</label>
                                <input
                                    type="text"
                                    value={supportConfig.call_support}
                                    onChange={e => setSupportConfig({ ...supportConfig, call_support: e.target.value })}
                                    className="enterprise-input h-14"
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">WhatsApp Support</label>
                                <input
                                    type="text"
                                    value={supportConfig.whatsapp_support}
                                    onChange={e => setSupportConfig({ ...supportConfig, whatsapp_support: e.target.value })}
                                    className="enterprise-input h-14"
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Support Email</label>
                                <input
                                    type="text"
                                    value={supportConfig.email_support}
                                    onChange={e => setSupportConfig({ ...supportConfig, email_support: e.target.value })}
                                    className="enterprise-input h-14 font-medium"
                                />
                            </div>

                            <div className="space-y-2 md:col-span-2">
                                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Working Hours</label>
                                <input
                                    type="text"
                                    value={supportConfig.operational_hours}
                                    onChange={e => setSupportConfig({ ...supportConfig, operational_hours: e.target.value })}
                                    className="enterprise-input h-14"
                                    placeholder="e.g. 9 AM - 6 PM Daily"
                                />
                            </div>

                            <div className="space-y-2">
                                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Prepaid Support Hotline</label>
                                <input
                                    type="text"
                                    value={supportConfig.prepaid_toll_free}
                                    onChange={e => setSupportConfig({ ...supportConfig, prepaid_toll_free: e.target.value })}
                                    className="enterprise-input h-14"
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">DTH Support Hotline</label>
                                <input
                                    type="text"
                                    value={supportConfig.dth_toll_free}
                                    onChange={e => setSupportConfig({ ...supportConfig, dth_toll_free: e.target.value })}
                                    className="enterprise-input h-14"
                                />
                            </div>
                        </div>

                        <button
                            onClick={() => handleSave('support_settings', supportConfig)}
                            disabled={saving}
                            className="w-full h-16 bg-slate-900 text-white rounded-2xl font-bold text-xs uppercase tracking-[0.25em] hover:bg-black transition-all active:scale-95 flex items-center justify-center gap-4 disabled:opacity-50"
                        >
                            {saving && activeTab === 'support' ? <Loader2 className="animate-spin" /> : <Save size={20} strokeWidth={2.5} />}
                            Push Support Protocol
                        </button>
                    </div>
                )}

                {activeTab === 'app' && (
                    <div className="bg-white border border-slate-100 rounded-[32px] p-12 space-y-12">
                        <div className="flex items-center gap-6">
                            <div className="h-14 w-14 bg-slate-900 rounded-2xl flex items-center justify-center text-white">
                                <Smartphone size={28} strokeWidth={1.5} />
                            </div>
                            <div>
                                <h2 className="text-2xl font-bold text-slate-950 tracking-tight leading-none">Endpoint Matrix</h2>
                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em] mt-2">Mobile node connectivity</p>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
                            <div className="space-y-8">
                                <div className="space-y-2">
                                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">App Security Key</label>
                                    <div className="relative">
                                        <input
                                            type="password"
                                            value={appSettings.merchant_token}
                                            onChange={e => setAppSettings({ ...appSettings, merchant_token: e.target.value })}
                                            className="enterprise-input h-16 pr-14 font-mono text-lg bg-slate-50/50"
                                            placeholder="••••••••••••••••"
                                        />
                                        <Shield size={20} className="absolute right-5 top-1/2 -translate-y-1/2 text-slate-300" />
                                    </div>
                                    <p className="text-[9px] text-slate-400 font-bold uppercase tracking-widest mt-2 px-1">Private key for app security</p>
                                </div>

                                <div className="space-y-2">
                                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">App API URL</label>
                                    <input
                                        type="text"
                                        value={appSettings.api_proxy_url}
                                        onChange={e => setAppSettings({ ...appSettings, api_proxy_url: e.target.value })}
                                        className="enterprise-input h-16 font-mono text-sm text-slate-950"
                                        placeholder="https://yourapp.api"
                                    />
                                </div>
                            </div>

                            <div className="space-y-8">
                                <div className="space-y-2">
                                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">App Notice Message</label>
                                    <textarea
                                        value={appSettings.app_notice}
                                        onChange={e => setAppSettings({ ...appSettings, app_notice: e.target.value })}
                                        className="enterprise-input min-h-[160px] py-6 px-6 resize-none text-sm font-medium leading-relaxed"
                                        placeholder="Type message for all users here..."
                                    />
                                </div>

                                <div className="grid grid-cols-2 gap-6">
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Minimum Version</label>
                                        <input
                                            type="text"
                                            value={appSettings.min_app_version}
                                            onChange={e => setAppSettings({ ...appSettings, min_app_version: e.target.value })}
                                            className="enterprise-input h-14 text-center font-bold font-mono"
                                            placeholder="1.0.0"
                                        />
                                    </div>
                                    <div className="flex items-center justify-between px-6 py-2 bg-slate-50 border border-slate-100 rounded-2xl">
                                        <div className="flex flex-col">
                                            <span className="text-[10px] font-bold text-slate-950 uppercase">Mandatory Update</span>
                                            <span className="text-[8px] text-slate-400 font-bold uppercase mt-0.5">Force users to update</span>
                                        </div>
                                        <label className="relative inline-flex items-center cursor-pointer">
                                            <input
                                                type="checkbox"
                                                checked={appSettings.force_update}
                                                onChange={e => setAppSettings({ ...appSettings, force_update: e.target.checked })}
                                                className="sr-only peer"
                                            />
                                            <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-red-500"></div>
                                        </label>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="pt-8 border-t border-slate-50">
                            <button
                                onClick={() => handleSave('app_settings', appSettings)}
                                disabled={saving}
                                className="w-full h-18 bg-slate-900 text-white rounded-3xl font-bold text-xs uppercase tracking-[0.3em] hover:bg-black transition-all active:scale-95 flex items-center justify-center gap-6 disabled:opacity-50 shadow-2xl shadow-slate-200"
                            >
                                {saving && activeTab === 'app' ? <Loader2 className="animate-spin w-6 h-6" /> : <Save size={24} strokeWidth={2.5} />}
                                Synchronize App Ecosystem
                            </button>
                        </div>
                    </div>
                )}
            </div>

            {/* API Master Modal */}
            <Modal
                isOpen={showApiModal}
                onClose={() => setShowApiModal(false)}
                title={editingApi ? 'Synchronize Node' : 'Initialize Node'}
                subtitle="Recharge Protocol Gateway"
                icon={editingApi ? <Activity size={28} className="text-indigo-500" strokeWidth={2.5} /> : <Plus size={28} className="text-emerald-500" strokeWidth={2.5} />}
                maxWidth="max-w-2xl"
            >
                <div className="space-y-8">
                    <div className="grid grid-cols-2 gap-6">
                        <div className="col-span-2 space-y-2">
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Protocol Identifier (Name)</label>
                            <div className="relative">
                                <input
                                    value={apiFormData.name}
                                    onChange={e => setApiFormData({ ...apiFormData, name: e.target.value })}
                                    className="enterprise-input h-12 pl-12 font-bold text-slate-900"
                                    placeholder="e.g. LAPU_CORE_GATEWAY"
                                />
                                <Globe className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={18} />
                            </div>
                        </div>

                        <div className="col-span-2 space-y-2">
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Mainframe Endpoint (Base URL)</label>
                            <div className="relative">
                                <input
                                    value={apiFormData.base_url}
                                    onChange={e => setApiFormData({ ...apiFormData, base_url: e.target.value })}
                                    className="enterprise-input h-12 pl-12 font-mono text-sm text-indigo-600"
                                    placeholder="https://api.gateway.node/v1"
                                />
                                <Network className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={18} />
                            </div>
                        </div>

                        <div className="col-span-2 space-y-2">
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Encryption Protocol Key</label>
                            <div className="relative">
                                <input
                                    type="password"
                                    value={apiFormData.api_key}
                                    onChange={e => setApiFormData({ ...apiFormData, api_key: e.target.value })}
                                    className="enterprise-input h-12 pl-12 font-mono"
                                    placeholder="Enter secure node key"
                                />
                                <Shield className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={18} />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Priority Layer (1-10)</label>
                            <div className="relative">
                                <input
                                    type="number"
                                    min={1}
                                    max={10}
                                    value={apiFormData.priority}
                                    onChange={e => setApiFormData({ ...apiFormData, priority: parseInt(e.target.value) })}
                                    className="enterprise-input h-12 pl-12 font-black tabular-nums"
                                />
                                <Activity className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={18} />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Daily Throughput Limit</label>
                            <div className="relative">
                                <input
                                    type="number"
                                    value={apiFormData.daily_hit_limit}
                                    onChange={e => setApiFormData({ ...apiFormData, daily_hit_limit: parseInt(e.target.value) })}
                                    className="enterprise-input h-12 pl-12 font-black tabular-nums"
                                />
                                <Save className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={18} />
                            </div>
                        </div>
                    </div>

                    <div className="flex gap-4 pt-2">
                        <button
                            onClick={() => setShowApiModal(false)}
                            className="flex-1 h-12 rounded-2xl border border-slate-200 text-slate-600 font-black text-[11px] uppercase tracking-widest hover:bg-slate-50 transition-all active:scale-95"
                        >
                            Abort Initialization
                        </button>
                        <button
                            onClick={handleSaveApi}
                            disabled={saving}
                            className="flex-[2] enterprise-btn-primary justify-center h-12 shadow-indigo-100"
                        >
                            {saving ? <Loader2 size={16} className="animate-spin" /> : editingApi ? <><Activity size={16} /> Synchronize Node</> : <><Plus size={16} /> Deploy Protocol</>}
                        </button>
                    </div>
                </div>
            </Modal>
        </div>
    );
}

function MasterLink({ label, icon, description, action, label2 }: any) {
    return (
        <div className="bg-white border border-slate-100 p-10 rounded-[32px] group hover:border-slate-300 transition-all cursor-pointer relative overflow-hidden">
            <div className="relative z-10 flex flex-col gap-8">
                <div className="w-14 h-14 bg-slate-50 border border-slate-100 rounded-2xl flex items-center justify-center text-slate-950 group-hover:bg-slate-900 group-hover:text-white transition-all duration-500">
                    {icon}
                </div>
                <div>
                    <h3 className="text-xl font-bold text-slate-950 tracking-tight mb-2 group-hover:translate-x-1 transition-transform uppercase leading-none">{label}</h3>
                    <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest leading-relaxed">{description}</p>
                </div>
                {action ? (
                    <button className="flex items-center gap-3 text-[10px] font-bold text-slate-950 uppercase tracking-[0.2em] group/btn">
                        {label2} <ArrowRight size={14} strokeWidth={2.5} className="group-hover/btn:translate-x-2 transition-transform" />
                    </button>
                ) : (
                    <div className="flex items-center gap-3 text-[10px] font-bold text-slate-300 uppercase tracking-[0.2em] transition-colors group-hover:text-slate-950">
                        Access Protocol <ArrowRight size={14} strokeWidth={2.5} />
                    </div>
                )}
            </div>
        </div>
    );
}
