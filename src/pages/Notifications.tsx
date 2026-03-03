import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import {
    Send,
    Megaphone,
    MessageSquare,
    ArrowRight,
    Loader2,
    ShieldAlert
} from 'lucide-react';
import Modal from '../components/Modal';

export default function Notifications() {
    const [notifications, setNotifications] = useState<any[]>([]);
    const [templates, setTemplates] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState<'history' | 'templates' | 'broadcast'>('history');

    // Broadcast Form
    const [title, setTitle] = useState('');
    const [message, setMessage] = useState('');
    const [imageUrl, setImageUrl] = useState('');
    const [actionUrl, setActionUrl] = useState('');
    const [sending, setSending] = useState(false);
    const [testSending, setTestSending] = useState(false);

    // Template Editing Form
    const [editingTemplate, setEditingTemplate] = useState<any | null>(null);
    const [tempTitle, setTempTitle] = useState('');
    const [tempMessage, setTempMessage] = useState('');
    const [tempActive, setTempActive] = useState(true);
    const [savingTemplate, setSavingTemplate] = useState(false);

    const actionLinks = [
        { label: 'None (Optional)', value: '' },
        { label: 'Home Screen', value: 'screen://home' },
        { label: 'Wallet / Balance', value: 'screen://wallet' },
        { label: 'Mobile Recharge', value: 'screen://recharge' },
        { label: 'Transaction History', value: 'screen://history' },
        { label: 'Manual Claims', value: 'screen://claims' },
        { label: 'Referral Page', value: 'screen://referral' },
        { label: 'User Profile', value: 'screen://profile' },
        { label: 'Support Chatbot', value: 'screen://chatbot' },
        { label: 'Offers & Deals', value: 'screen://campaigns' },
    ];

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        setLoading(true);
        try {
            const [notifRes, tempRes] = await Promise.all([
                supabase.from('notifications').select('*').order('created_at', { ascending: false }).limit(50),
                supabase.from('notification_templates').select('*').order('type', { ascending: true })
            ]);
            if (notifRes.data) setNotifications(notifRes.data);
            if (tempRes.data) setTemplates(tempRes.data);
        } catch (error) {
            console.error('Error fetching notifications:', error);
        }
        setLoading(false);
    };

    const handleBroadcast = async () => {
        if (!title || !message) {
            alert('Title and Message are required');
            return;
        }

        setSending(true);
        try {
            const { data, error } = await supabase.rpc('broadcast_notification', {
                p_type: 'promo',
                p_title: title,
                p_message: message,
                p_image_url: imageUrl || null,
                p_action_url: actionUrl || null,
                p_data: {}
            });

            if (error) throw error;

            alert(`Message sent to ${data} users!`);
            setTitle('');
            setMessage('');
            setImageUrl('');
            setActionUrl('');
            fetchData();
            setActiveTab('history');
        } catch (error: any) {
            alert('Error sending broadcast: ' + error.message);
        } finally {
            setSending(false);
        }
    };

    const handleSendTest = async () => {
        setTestSending(true);
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) throw new Error('You must be logged in');

            const { error } = await supabase.rpc('create_notification', {
                p_user_id: user.id,
                p_type: 'system',
                p_data: {
                    title: '🔔 Test Notification',
                    message: 'Your push notification relay is working perfectly!'
                },
                p_action_url: 'screen://home'
            });

            if (error) throw error;
            alert('Test message sent to your mobile!');
        } catch (error: any) {
            alert('Failed to send test: ' + error.message);
        } finally {
            setTestSending(false);
        }
    };

    const handleEditTemplate = (template: any) => {
        setEditingTemplate(template);
        setTempTitle(template.title_template);
        setTempMessage(template.message_template);
        setTempActive(template.is_active);
    };

    const handleSaveTemplate = async () => {
        if (!tempTitle || !tempMessage) {
            alert('Template Title and Message are required');
            return;
        }

        setSavingTemplate(true);
        try {
            const { error } = await supabase
                .from('notification_templates')
                .update({
                    title_template: tempTitle,
                    message_template: tempMessage,
                    is_active: tempActive,
                    updated_at: new Date().toISOString()
                })
                .eq('id', editingTemplate.id);

            if (error) throw error;

            setEditingTemplate(null);
            fetchData();
        } catch (error: any) {
            alert('Error updating template: ' + error.message);
        } finally {
            setSavingTemplate(false);
        }
    };

    return (
        <div className="space-y-6 animate-fade-up">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="page-title">Notifications</h1>
                    <p className="page-subtitle">Send messages to all users and manage templates</p>
                </div>
                <div className="flex items-center gap-1 bg-white border border-slate-200 rounded-xl p-1">
                    {(['history', 'templates', 'broadcast'] as const).map(tab => (
                        <button key={tab} onClick={() => setActiveTab(tab)}
                            className={`px-4 py-2 rounded-lg text-xs font-semibold capitalize transition-all ${activeTab === tab
                                ? tab === 'broadcast' ? 'bg-indigo-600 text-white shadow-sm' : 'bg-slate-900 text-white shadow-sm'
                                : 'text-slate-500 hover:text-slate-800'
                                }`}>
                            {tab === 'broadcast' ? <span className="flex items-center gap-1.5"><Send size={12} />Send to All</span> : tab === 'history' ? 'Sent History' : 'Saved Templates'}
                        </button>
                    ))}
                </div>
            </div>

            {loading ? (
                <div className="flex items-center justify-center h-64">
                    <Loader2 className="w-8 h-8 text-indigo-600 animate-spin" />
                </div>
            ) : (
                <>
                    {activeTab === 'history' && (
                        <div className="space-y-4">
                            {notifications.length === 0 ? (
                                <div className="text-center py-12 bg-white rounded-2xl border border-slate-100 italic text-slate-400">No message history found.</div>
                            ) : (
                                notifications.map(n => (
                                    <div key={n.id} className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm hover:shadow-md transition group">
                                        <div className="flex gap-4">
                                            <div className={`p-3 rounded-xl h-fit ${n.is_broadcast ? 'bg-indigo-50 text-indigo-600' : 'bg-slate-50 text-slate-600'}`}>
                                                {n.is_broadcast ? <Megaphone size={20} /> : <MessageSquare size={20} />}
                                            </div>
                                            <div className="flex-1">
                                                <div className="flex justify-between items-start mb-1">
                                                    <h3 className="font-bold text-slate-900">{n.title}</h3>
                                                    <span className="text-xs font-medium text-slate-400">{new Date(n.created_at).toLocaleString()}</span>
                                                </div>
                                                <p className="text-slate-600 text-sm">{n.message}</p>
                                                <div className="mt-3 flex items-center gap-4">
                                                    <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 bg-slate-100 text-slate-500 rounded">
                                                        {n.type.replace('_', ' ')}
                                                    </span>
                                                    {n.is_broadcast && (
                                                        <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 bg-indigo-50 text-indigo-600 rounded">
                                                            Broadcast
                                                        </span>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    )}

                    {activeTab === 'templates' && (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {templates.map(t => (
                                <div key={t.id} className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm flex flex-col hover:border-indigo-200 transition-colors">
                                    <div className="flex justify-between items-start mb-4">
                                        <span className="px-2.5 py-1 bg-indigo-50 text-indigo-600 rounded-lg text-xs font-bold uppercase tracking-wider">
                                            {t.type}
                                        </span>
                                        <div className={`h-2 w-2 rounded-full ${t.is_active ? 'bg-emerald-500' : 'bg-slate-300'}`} />
                                    </div>
                                    <h3 className="font-bold text-slate-900 mb-2 truncate" title={t.title_template}>{t.title_template}</h3>
                                    <p className="text-slate-500 text-sm line-clamp-3 mb-4 flex-1">{t.message_template}</p>
                                    <div className="mt-4 pt-4 border-t border-slate-100 flex justify-end items-center">
                                        <button
                                            onClick={() => handleEditTemplate(t)}
                                            className="bg-indigo-50 text-indigo-600 px-4 py-2 rounded-lg text-xs font-bold hover:bg-indigo-100 transition-colors flex items-center gap-2"
                                        >
                                            <ArrowRight size={14} className="rotate-[-45deg]" />
                                            Edit Template
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}

                    {activeTab === 'broadcast' && (
                        <div className="max-w-2xl bg-white border border-slate-200 rounded-3xl p-8 shadow-xl">
                            <div className="flex justify-between items-center mb-6">
                                <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
                                    <Megaphone className="text-indigo-600" />
                                    Send Message to Everyone
                                </h2>
                                <button
                                    onClick={handleSendTest}
                                    disabled={testSending}
                                    className="px-4 py-2 rounded-xl border border-indigo-100 bg-indigo-50 text-indigo-600 text-xs font-bold hover:bg-indigo-100 transition-all flex items-center gap-2"
                                >
                                    {testSending ? <Loader2 size={14} className="animate-spin" /> : <Send size={14} />}
                                    Test on My Mobile
                                </button>
                            </div>
                            <div className="space-y-5">
                                <div>
                                    <label className="block text-sm font-bold text-slate-700 mb-2">Message Heading</label>
                                    <input
                                        type="text"
                                        value={title}
                                        onChange={(e) => setTitle(e.target.value)}
                                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all font-medium"
                                        placeholder="e.g., Happy New Year! 🎊"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-bold text-slate-700 mb-2">Message Text</label>
                                    <textarea
                                        value={message}
                                        onChange={(e) => setMessage(e.target.value)}
                                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 h-32 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all font-medium resize-none"
                                        placeholder="Enter the main notification content..."
                                    />
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-bold text-slate-700 mb-2">Add Picture Link (Optional)</label>
                                        <input
                                            type="text"
                                            value={imageUrl}
                                            onChange={(e) => setImageUrl(e.target.value)}
                                            className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
                                            placeholder="https://..."
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-bold text-slate-700 mb-2">Open App Page</label>
                                        <select
                                            value={actionUrl}
                                            onChange={(e) => setActionUrl(e.target.value)}
                                            className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all font-medium"
                                        >
                                            {actionLinks.map(link => (
                                                <option key={link.value} value={link.value}>{link.label}</option>
                                            ))}
                                        </select>
                                    </div>
                                </div>
                                <div className="bg-amber-50 border border-amber-100 rounded-2xl p-4 flex gap-3 mt-2">
                                    <div className="p-2 bg-amber-100 text-amber-600 rounded-lg h-fit">
                                        <ShieldAlert size={18} />
                                    </div>
                                    <div>
                                        <p className="text-sm font-bold text-amber-900">Important</p>
                                        <p className="text-xs text-amber-700 font-medium leading-relaxed">This message will be sent to EVERYONE immediately. Please check for errors.</p>
                                    </div>
                                </div>
                                <button
                                    onClick={handleBroadcast}
                                    disabled={sending}
                                    className="w-full py-4 rounded-xl bg-indigo-600 text-white font-bold hover:bg-indigo-700 shadow-lg shadow-indigo-200 transition-all flex items-center justify-center gap-2 mt-4 disabled:opacity-50"
                                >
                                    {sending ? <Loader2 className="animate-spin" /> : <Send size={20} />}
                                    {sending ? 'Sending...' : 'Send Now'}
                                </button>
                            </div>
                        </div>
                    )}
                </>
            )}

            {/* Template Edit Modal */}
            <Modal
                isOpen={!!editingTemplate}
                onClose={() => setEditingTemplate(null)}
                title={editingTemplate ? `Edit ${editingTemplate.type} Template` : 'Edit Template'}
                subtitle="Saved Messages Editor"
                icon={<MessageSquare className="text-indigo-600" />}
                maxWidth="max-w-xl"
            >
                <div className="space-y-6">
                    <div>
                        <label className="block text-sm font-bold text-slate-700 mb-2">Title Template</label>
                        <input
                            type="text"
                            value={tempTitle}
                            onChange={(e) => setTempTitle(e.target.value)}
                            className="enterprise-input h-12"
                            placeholder="{status} Recharge Success"
                        />
                        <p className="text-[10px] text-slate-400 mt-2 font-medium italic">Special codes: {'{amount}'}, {'{service}'}, {'{status}'}</p>
                    </div>

                    <div>
                        <label className="block text-sm font-bold text-slate-700 mb-2">Message Template</label>
                        <textarea
                            value={tempMessage}
                            onChange={(e) => setTempMessage(e.target.value)}
                            className="enterprise-input min-h-[120px] py-4 resize-none"
                            placeholder="Your recharge for ₹{amount} was {status}."
                        />
                    </div>

                    <div className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl border border-slate-100">
                        <div>
                            <p className="text-sm font-bold text-slate-800">Turn on Template</p>
                            <p className="text-xs text-slate-500 font-medium">Allow system to use this template</p>
                        </div>
                        <label className="relative inline-flex items-center cursor-pointer">
                            <input
                                type="checkbox"
                                checked={tempActive}
                                onChange={(e) => setTempActive(e.target.checked)}
                                className="sr-only peer"
                            />
                            <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600"></div>
                        </label>
                    </div>

                    <div className="flex gap-4 border-t border-slate-100 pt-6">
                        <button
                            onClick={() => setEditingTemplate(null)}
                            className="flex-1 enterprise-btn-secondary justify-center h-12"
                        >
                            Cancel
                        </button>
                        <button
                            onClick={handleSaveTemplate}
                            disabled={savingTemplate}
                            className="flex-1 enterprise-btn-primary justify-center h-12"
                        >
                            {savingTemplate ? <Loader2 className="animate-spin w-4 h-4" /> : 'Save Template'}
                        </button>
                    </div>
                </div>
            </Modal>
        </div>
    );
}


