import {
    Bell, Search, ChevronRight, Command, RefreshCw,
    User, CircleDot
} from 'lucide-react';

interface HeaderProps {
    activeTab: string;
    userName?: string;
    loading?: boolean;
    onRefresh?: () => void;
}

const tabLabels: Record<string, string> = {
    Dashboard: 'Main Dashboard',
    Users: 'Customers',
    Wallets: 'User Money',
    Transactions: 'All History',
    Withdrawals: 'Money Requests',
    Services: 'Service Types',
    Operators: 'Companies',
    Claims: 'Support Tickets',
    Notifications: 'Send Messages',
    Banners: 'App Banners',
    Chatbot: 'Help & FAQs',
    Campaigns: 'Offers & Ads',
    Affiliates: 'Partners',
    ReferralAnalytics: 'Invite Friends',
    Reports: 'Main Stats',
    RechargeReports: 'Recharge Logs',
    AffiliateReports: 'Partner Stats',
    AuditLogs: 'Admin Logs',
    Settings: 'App Config',
};

export default function Header({ activeTab, userName, loading, onRefresh }: HeaderProps) {
    const label = tabLabels[activeTab] ?? activeTab.replace(/([A-Z])/g, ' $1').trim();

    return (
        <header className="h-[64px] bg-white/70 border-b border-slate-200/60 sticky top-0 z-30 flex items-center justify-between px-6 md:px-8 backdrop-blur-xl">
            {/* Left */}
            <div className="flex items-center gap-3 min-w-0">
                <div className="flex items-center gap-1.5 text-slate-400 text-xs font-medium select-none">
                    <span>Admin</span>
                    <ChevronRight size={12} className="opacity-40" />
                </div>
                <h1 className="text-sm font-bold text-slate-900 tracking-tight whitespace-nowrap">{label}</h1>

                {loading && (
                    <button
                        onClick={onRefresh}
                        className="ml-2 flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-indigo-50 border border-indigo-100 text-indigo-500 cursor-pointer hover:bg-indigo-100 transition-colors"
                    >
                        <RefreshCw size={10} className="animate-spin" />
                        <span className="text-[10px] font-bold uppercase tracking-wider">Syncing</span>
                    </button>
                )}
            </div>

            {/* Right */}
            <div className="flex items-center gap-4">
                {/* Search */}
                <div className="hidden md:flex items-center gap-2 bg-slate-50 border border-slate-200/80 rounded-xl px-3.5 py-2 w-60 group focus-within:bg-white focus-within:border-indigo-300 focus-within:ring-2 focus-within:ring-indigo-500/10 transition-all">
                    <Search size={13} className="text-slate-300 group-focus-within:text-indigo-400 shrink-0" />
                    <input
                        type="text"
                        placeholder="Quick search..."
                        className="bg-transparent border-none focus:ring-0 outline-none text-xs font-medium placeholder:text-slate-300 w-full text-slate-700"
                    />
                    <div className="hidden group-focus-within:flex items-center gap-0.5 border border-slate-200 bg-white rounded-md px-1.5 py-0.5 shrink-0">
                        <Command size={9} className="text-slate-400" />
                        <span className="text-[9px] font-bold text-slate-400">K</span>
                    </div>
                </div>

                <div className="flex items-center gap-3 pl-3 border-l border-slate-200">
                    {/* Bell */}
                    <button className="relative w-9 h-9 flex items-center justify-center rounded-xl text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 border border-transparent hover:border-indigo-100 transition-all">
                        <Bell size={16} strokeWidth={2} />
                        <span className="absolute top-2 right-2 w-1.5 h-1.5 bg-indigo-500 rounded-full border-2 border-white" />
                    </button>

                    {/* User */}
                    <div className="flex items-center gap-2.5">
                        <div className="text-right hidden sm:block">
                            <p className="text-xs font-bold text-slate-900 leading-none">{userName || 'Admin'}</p>
                            <div className="flex items-center justify-end gap-1 mt-0.5">
                                <CircleDot size={8} className="text-emerald-500 fill-emerald-500" />
                                <span className="text-[9px] font-semibold text-slate-400 uppercase tracking-widest">Online</span>
                            </div>
                        </div>
                        <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-indigo-600 to-violet-600 flex items-center justify-center text-white shadow-md shadow-indigo-500/20 border border-white/20 cursor-pointer hover:shadow-lg hover:shadow-indigo-500/30 transition-all">
                            <User size={15} />
                        </div>
                    </div>
                </div>
            </div>
        </header>
    );
}
