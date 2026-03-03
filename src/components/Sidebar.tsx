import {
    LayoutDashboard, Users, CreditCard, FileText, Settings, LogOut,
    Wallet, Zap, ArrowUpCircle, Bell, ShieldAlert, Megaphone,
    BarChart3, Bot, Smartphone, Target, Briefcase, ChevronDown,
    Receipt, Image
} from 'lucide-react';
import React, { useState } from 'react';

interface SidebarProps {
    activeTab: string;
    setActiveTab: (tab: string) => void;
    userEmail: string;
    userRole: string;
    onLogout: () => void;
}

interface NavGroup {
    label: string;
    items: { id: string; label: string; icon: React.ReactNode; badge?: string }[];
}

const navGroups: NavGroup[] = [
    {
        label: 'Overview',
        items: [
            { id: 'Dashboard', label: 'Home', icon: <LayoutDashboard /> },
        ]
    },
    {
        label: 'Money & Users',
        items: [
            { id: 'Users', label: 'Customers', icon: <Users /> },
            { id: 'Wallets', label: 'User Money', icon: <Wallet /> },
            { id: 'Transactions', label: 'All History', icon: <CreditCard /> },
            { id: 'Withdrawals', label: 'Money Requests', icon: <ArrowUpCircle /> },
        ]
    },
    {
        label: 'App Settings',
        items: [
            { id: 'Services', label: 'Service Types', icon: <Zap /> },
            { id: 'Operators', label: 'Companies', icon: <Smartphone /> },
            { id: 'Claims', label: 'Support Tickets', icon: <ShieldAlert /> },
            { id: 'Notifications', label: 'Send Messages', icon: <Bell /> },
            { id: 'Banners', label: 'App Banners', icon: <Image /> },
            { id: 'Chatbot', label: 'Help & FAQs', icon: <Bot /> },
        ]
    },
    {
        label: 'Ads & Growth',
        items: [
            { id: 'Campaigns', label: 'Offers & Ads', icon: <Megaphone /> },
            { id: 'Affiliates', label: 'Partners', icon: <Briefcase /> },
            { id: 'ReferralAnalytics', label: 'Invite Friends', icon: <Target /> },
        ]
    },
    {
        label: 'Full Reports',
        items: [
            { id: 'Reports', label: 'Main Stats', icon: <BarChart3 /> },
            { id: 'RechargeReports', label: 'Recharge Logs', icon: <Receipt /> },
            { id: 'AffiliateReports', label: 'Partner Stats', icon: <BarChart3 /> },
        ]
    },
    {
        label: 'Technical',
        items: [
            { id: 'AuditLogs', label: 'Admin Logs', icon: <FileText /> },
            { id: 'Settings', label: 'App Config', icon: <Settings /> },
        ]
    },
];

const Sidebar = ({ activeTab, setActiveTab, userEmail, userRole, onLogout }: SidebarProps) => {
    const [collapsed, setCollapsed] = useState<Record<string, boolean>>({});

    const toggle = (label: string) =>
        setCollapsed(c => ({ ...c, [label]: !c[label] }));

    return (
        <aside className="w-[260px] flex flex-col h-screen shrink-0 border-r border-white/5 overflow-hidden relative" style={{ background: 'var(--brand-dark, #0a0f1e)' }}>
            {/* Top ambient glow */}
            <div className="absolute top-0 left-0 w-full h-72 pointer-events-none" style={{ background: 'radial-gradient(ellipse 80% 50% at 50% -20%, rgba(99,102,241,0.12) 0%, transparent 60%)' }} />

            {/* Brand */}
            <div className="flex items-center gap-3 px-6 py-5 z-10 shrink-0">
                <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center font-black text-white text-base shadow-xl shadow-indigo-500/25 hover:rotate-6 transition-transform duration-500 cursor-default select-none">
                    P
                </div>
                <div>
                    <div className="text-white font-bold text-base tracking-tight leading-tight">Paybil</div>
                    <div className="text-slate-600 text-[9px] font-bold uppercase tracking-[0.22em]">Admin Console</div>
                </div>
            </div>

            {/* Nav */}
            <nav className="flex-1 px-3 pb-4 overflow-y-auto space-y-0.5 z-10" style={{ scrollbarWidth: 'none' }}>
                {navGroups.map(group => (
                    <div key={group.label} className="mb-1">
                        {/* Group header */}
                        <button
                            onClick={() => toggle(group.label)}
                            className="w-full flex items-center justify-between px-3 py-2 mt-4 first:mt-1 cursor-pointer select-none group"
                        >
                            <span className="text-[9px] font-bold uppercase tracking-[0.2em] text-slate-600 group-hover:text-slate-500 transition-colors">
                                {group.label}
                            </span>
                            <ChevronDown
                                size={10}
                                className={`text-slate-700 transition-transform duration-200 ${collapsed[group.label] ? '-rotate-90' : ''}`}
                            />
                        </button>

                        {/* Items */}
                        {!collapsed[group.label] && (
                            <div className="space-y-0.5">
                                {group.items.map(item => {
                                    const isActive = activeTab === item.id;
                                    return (
                                        <button
                                            key={item.id}
                                            onClick={() => setActiveTab(item.id)}
                                            className={`sidebar-link w-full text-left transition-all duration-200 relative ${isActive ? 'sidebar-link-active text-white' : 'sidebar-link-inactive'}`}
                                        >
                                            <span className={`shrink-0 transition-all duration-200 ${isActive ? 'text-indigo-400' : 'text-slate-600 group-hover:text-slate-300'}`}>
                                                {React.cloneElement(item.icon as any, { size: 15, strokeWidth: isActive ? 2.5 : 2 })}
                                            </span>
                                            <span className={`text-[13px] font-medium leading-none transition-all ${isActive ? 'translate-x-0.5' : ''}`}>
                                                {item.label}
                                            </span>
                                            {isActive && (
                                                <span className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-4 bg-indigo-400 rounded-r-full shadow-[0_0_10px_rgba(99,102,241,0.7)]" />
                                            )}
                                            {item.badge && (
                                                <span className="ml-auto text-[9px] font-bold bg-red-500 text-white px-1.5 py-0.5 rounded-full">
                                                    {item.badge}
                                                </span>
                                            )}
                                        </button>
                                    );
                                })}
                            </div>
                        )}
                    </div>
                ))}
            </nav>

            {/* User Footer */}
            <div className="p-3 border-t border-white/5 z-10 shrink-0 bg-black/10">
                <div className="flex items-center gap-3 p-3 rounded-xl bg-white/5 border border-white/5 mb-2">
                    <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-slate-700 to-slate-800 text-white flex items-center justify-center text-xs font-bold border border-white/10 shrink-0">
                        {userEmail?.substring(0, 2).toUpperCase()}
                    </div>
                    <div className="min-w-0">
                        <p className="text-xs font-semibold text-white truncate capitalize tracking-tight leading-tight">
                            {userRole?.replace('_', ' ') || 'Administrator'}
                        </p>
                        <p className="text-[10px] text-slate-600 truncate">{userEmail}</p>
                    </div>
                </div>
                <button
                    onClick={onLogout}
                    className="group w-full flex items-center justify-center gap-2 text-slate-500 hover:text-red-400 hover:bg-red-500/8 border border-transparent hover:border-red-500/15 transition-all text-[11px] py-2.5 rounded-xl font-semibold uppercase tracking-widest"
                >
                    <LogOut size={13} className="group-hover:-translate-x-0.5 transition-transform" />
                    Sign Out
                </button>
            </div>
        </aside>
    );
};

export default Sidebar;
