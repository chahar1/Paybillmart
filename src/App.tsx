import React, { useState, useEffect, useCallback } from 'react';
import logo from './assets/logo.png';
import { supabase } from './lib/supabase';
import {
  Loader2, Wallet, Zap, ShieldAlert,
  TrendingUp, Users, Activity, RefreshCw, ArrowUpRight,
  CheckCircle2, Clock, XCircle, Eye, EyeOff, Lock, Mail,
  AlertTriangle, BarChart3
} from 'lucide-react';
import Wallets from './pages/Wallets';
import Services from './pages/Services';
import Affiliates from './pages/Affiliates';
import Claims from './pages/Claims';
import Operators from './pages/Operators';
import Reports from './pages/Reports';
import Campaigns from './pages/Campaigns';
import UsersPage from './pages/Users';
import AdminManagement from './pages/AdminManagement';
import AuditLogs from './pages/AuditLogs';
import ChatbotFAQs from './pages/ChatbotFAQs';
import Withdrawals from './pages/Withdrawals';
import Notifications from './pages/Notifications';
import Transactions from './pages/Transactions';
import AffiliateReports from './pages/AffiliateReports';
import RechargeReports from './pages/RechargeReports';
import ReferralAnalytics from './pages/ReferralAnalytics';
import Sidebar from './components/Sidebar';
import SystemSettings from './pages/SystemSettings';
import Banners from './pages/Banners';
import Header from './components/Header';

// ─────────────────────────────────────────────────────────────
// App Root
// ─────────────────────────────────────────────────────────────
const App = () => {
  const [session, setSession] = useState<any | null>(null);
  const [userRole, setUserRole] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchUserRole = async (userId: string) => {
    try {
      const { data } = await supabase
        .from('admin_users')
        .select('role')
        .eq('user_id', userId)
        .single();
      if (data) setUserRole(data.role);
    } catch { /* no admin role */ }
  };

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      if (session?.user) fetchUserRole(session.user.id);
      setLoading(false);
    });
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      if (session?.user) fetchUserRole(session.user.id);
      else setUserRole(null);
    });
    return () => subscription.unsubscribe();
  }, []);

  if (loading) {
    return (
      <div className="h-screen w-screen flex items-center justify-center bg-mesh">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-indigo-600 to-violet-600 flex items-center justify-center shadow-2xl shadow-indigo-500/30 animate-pulse">
            <span className="text-white font-black text-xl">P</span>
          </div>
          <div className="flex items-center gap-2 text-slate-400 text-sm font-medium">
            <Loader2 size={14} className="animate-spin" />
            Authenticating...
          </div>
        </div>
      </div>
    );
  }

  if (!session) return <LoginScreen />;

  return <Dashboard session={session} userRole={userRole} />;
};

// ─────────────────────────────────────────────────────────────
// Login Screen
// ─────────────────────────────────────────────────────────────
const LoginScreen = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) setError(error.message);
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-mesh flex items-center justify-center p-4">
      {/* Glass card */}
      <div className="w-full max-w-[420px] animate-scale-in">
        {/* Brand */}
        <div className="text-center mb-10">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-indigo-600 to-violet-600 shadow-2xl shadow-indigo-500/30 mb-5 animate-float">
            <img src={logo} alt="Paybil" className="w-9 h-9 object-contain" />
          </div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Paybil Admin</h1>
          <p className="text-slate-400 text-sm font-medium mt-1">Secure staff portal — authorised access only</p>
        </div>

        <form onSubmit={handleLogin} className="glass-panel p-8 space-y-5">
          {/* Email */}
          <div className="space-y-1.5">
            <label className="section-label">Email address</label>
            <div className="relative">
              <Mail size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-300" />
              <input
                type="email"
                required
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="admin@paybilmart.com"
                className="enterprise-input pl-10"
              />
            </div>
          </div>

          {/* Password */}
          <div className="space-y-1.5">
            <label className="section-label">Password</label>
            <div className="relative">
              <Lock size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-300" />
              <input
                type={showPass ? 'text' : 'password'}
                required
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="••••••••••"
                className="enterprise-input pl-10 pr-10"
              />
              <button
                type="button"
                onClick={() => setShowPass(!showPass)}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-300 hover:text-slate-500 transition-colors"
              >
                {showPass ? <EyeOff size={15} /> : <Eye size={15} />}
              </button>
            </div>
          </div>

          {/* Error */}
          {error && (
            <div className="flex items-center gap-2.5 p-3.5 rounded-xl bg-red-50 border border-red-100 text-red-600 text-sm font-medium">
              <AlertTriangle size={15} className="shrink-0" />
              {error}
            </div>
          )}

          {/* Submit */}
          <button
            type="submit"
            disabled={loading}
            className="enterprise-btn-primary w-full justify-center py-3 text-base mt-2"
          >
            {loading ? <Loader2 size={16} className="animate-spin" /> : null}
            {loading ? 'Authenticating...' : 'Sign in to Console'}
          </button>
        </form>

        <p className="text-center text-slate-400 text-xs font-medium mt-6">
          Protected by Supabase Auth · 256-bit encryption
        </p>
      </div>
    </div>
  );
};

// ─────────────────────────────────────────────────────────────
// Dashboard Shell
// ─────────────────────────────────────────────────────────────
const Dashboard = ({ session, userRole }: { session: any; userRole: string | null }) => {
  const [activeTab, setActiveTab] = useState('Dashboard');
  const [stats, setStats] = useState({
    totalRevenue: 0, totalWalletBalance: 0, pendingRecharges: 0,
    blockedUsers: 0, totalUsers: 0, totalCashback: 0
  });
  const [recentTransactions, setRecentTransactions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchDashboardData = useCallback(async () => {
    try {
      setLoading(true);
      const [
        { count: userCount },
        { data: rechargeData },
        { data: recent },
        { data: wallStats },
        { count: blockedCount }
      ] = await Promise.all([
        supabase.from('users').select('*', { count: 'exact', head: true }),
        supabase.from('recharges').select('amount, cashback, status'),
        supabase.from('recharges').select('*, users(full_name)').order('created_at', { ascending: false }).limit(8),
        supabase.from('wallets').select('balance'),
        supabase.from('users').select('*', { count: 'exact', head: true }).eq('is_blocked', true)
      ]);

      if (rechargeData) {
        const total = rechargeData.reduce((a, c) => a + (c.status === 'success' ? +c.amount : 0), 0);
        const cashback = rechargeData.reduce((a, c) => a + (c.status === 'success' ? +(c.cashback || 0) : 0), 0);
        const pending = rechargeData.filter(r => r.status === 'pending').length;
        const wallet = wallStats?.reduce((a, c) => a + +(c.balance || 0), 0) || 0;
        setStats({ totalRevenue: total, totalWalletBalance: wallet, pendingRecharges: pending, blockedUsers: blockedCount || 0, totalUsers: userCount || 0, totalCashback: cashback });
      }
      if (recent) setRecentTransactions(recent);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDashboardData();
    const t = setInterval(fetchDashboardData, 30000);
    return () => clearInterval(t);
  }, [fetchDashboardData]);

  const statusIcon = (s: string) =>
    s === 'success' ? <CheckCircle2 size={13} /> : s === 'pending' ? <Clock size={13} /> : <XCircle size={13} />;

  const statusClass = (s: string): string =>
    s === 'success' ? 'badge-success' : s === 'pending' ? 'badge-warning' : 'badge-danger';

  return (
    <div className="flex h-screen bg-mesh overflow-hidden">
      <Sidebar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        userEmail={session.user.email}
        userRole={userRole || 'Administrator'}
        onLogout={() => supabase.auth.signOut()}
      />

      <main className="flex-1 overflow-y-auto">
        <Header
          activeTab={activeTab}
          userName={session.user.email?.split('@')[0]}
          loading={loading}
          onRefresh={fetchDashboardData}
        />

        <div className="p-6 md:p-8 max-w-[1480px] mx-auto">

          {/* ── Dashboard Home ── */}
          {activeTab === 'Dashboard' && (
            <div className="space-y-6 animate-fade-up">

              {/* Greeting */}
              <div className="flex items-center justify-between">
                <div>
                  <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Main Dashboard</h1>
                  <p className="text-slate-400 text-sm mt-1">View latest recharges and total money overview</p>
                </div>
                <button
                  onClick={fetchDashboardData}
                  className="enterprise-btn-secondary gap-2 text-xs"
                >
                  <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
                  Sync
                </button>
              </div>

              {/* KPI Strip */}
              <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4 stagger-children">
                <KpiCard label="Money In" value={`₹${stats.totalRevenue.toLocaleString()}`} icon={<TrendingUp size={16} />} color="indigo" sub="Total recharge success" />
                <KpiCard label="User Balances" value={`₹${stats.totalWalletBalance.toLocaleString()}`} icon={<Wallet size={16} />} color="emerald" sub="Total money in wallets" />
                <KpiCard label="Cashback" value={`₹${stats.totalCashback.toLocaleString()}`} icon={<Zap size={16} />} color="violet" sub="Sent to users" />
                <KpiCard label="Customers" value={stats.totalUsers.toLocaleString()} icon={<Users size={16} />} color="blue" sub="All accounts" />
                <KpiCard label="Waiting" value={stats.pendingRecharges.toString()} icon={<Activity size={16} />} color={stats.pendingRecharges > 5 ? 'amber' : 'slate'} sub="Pending recharges" negative={stats.pendingRecharges > 5} />
                <KpiCard label="Blocked Users" value={stats.blockedUsers.toString()} icon={<ShieldAlert size={16} />} color={stats.blockedUsers > 0 ? 'red' : 'slate'} sub="Accounts stopped" negative={stats.blockedUsers > 0} />
              </div>

              {/* Recent Transactions Table */}
              <div className="enterprise-card overflow-hidden">
                <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between bg-white/60 backdrop-blur-sm">
                  <div>
                    <h2 className="font-bold text-slate-900 text-base">Latest Recharges</h2>
                    <p className="text-slate-400 text-xs mt-0.5">List of the most recent recharges</p>
                  </div>
                  <button onClick={() => setActiveTab('Transactions')} className="text-indigo-600 hover:text-indigo-700 text-xs font-semibold flex items-center gap-1 transition-colors">
                    View All <ArrowUpRight size={13} />
                  </button>
                </div>

                <div className="overflow-x-auto">
                  <table className="min-w-full">
                    <thead>
                      <tr>
                        <th className="enterprise-table-header">Customer</th>
                        <th className="enterprise-table-header">Phone Number</th>
                        <th className="enterprise-table-header">Money (₹)</th>
                        <th className="enterprise-table-header">Status</th>
                        <th className="enterprise-table-header text-right">Time</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white/40 divide-y divide-slate-50">
                      {loading && recentTransactions.length === 0 ? (
                        [...Array(5)].map((_, i) => (
                          <tr key={i}>
                            {[...Array(5)].map((_, j) => (
                              <td key={j} className="px-5 py-4">
                                <div className="h-4 rounded-md bg-slate-100 animate-pulse" style={{ width: `${[60, 40, 30, 50, 55][j]}%` }} />
                              </td>
                            ))}
                          </tr>
                        ))
                      ) : recentTransactions.map((tx) => (
                        <tr key={tx.id} className="enterprise-table-row group">
                          <td className="px-5 py-4">
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-slate-100 to-slate-200 flex items-center justify-center text-slate-600 font-bold text-xs uppercase group-hover:from-indigo-50 group-hover:to-indigo-100 group-hover:text-indigo-600 transition-all">
                                {tx.users?.full_name?.charAt(0) || 'U'}
                              </div>
                              <span className="text-sm font-semibold text-slate-800">{tx.users?.full_name || 'Anonymous'}</span>
                            </div>
                          </td>
                          <td className="px-5 py-4">
                            <span className="text-xs font-mono text-slate-500">{tx.mobile_number || '—'}</span>
                          </td>
                          <td className="px-5 py-4">
                            <span className="text-sm font-bold text-slate-900 tabular-nums">₹{Number(tx.amount).toLocaleString()}</span>
                          </td>
                          <td className="px-5 py-4">
                            <span className={`enterprise-badge ${statusClass(tx.status)}`}>
                              {statusIcon(tx.status)}
                              {tx.status}
                            </span>
                          </td>
                          <td className="px-5 py-4 text-right">
                            <div className="text-xs font-semibold text-slate-600 tabular-nums">{new Date(tx.created_at).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })}</div>
                            <div className="text-[10px] text-slate-400">{new Date(tx.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</div>
                          </td>
                        </tr>
                      ))}
                      {!loading && recentTransactions.length === 0 && (
                        <tr>
                          <td colSpan={5} className="py-16 text-center">
                            <BarChart3 size={32} className="mx-auto text-slate-200 mb-3" />
                            <p className="text-slate-400 text-sm font-medium">No transactions yet</p>
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* ── Module Routing ── */}
          {activeTab === 'Wallets' && <Wallets />}
          {activeTab === 'Services' && <Services />}
          {activeTab === 'Operators' && <Operators />}
          {activeTab === 'Reports' && <Reports />}
          {activeTab === 'Campaigns' && <Campaigns />}
          {activeTab === 'Users' && <UsersPage />}
          {activeTab === 'Affiliates' && <Affiliates />}
          {activeTab === 'Claims' && <Claims />}
          {activeTab === 'Withdrawals' && <Withdrawals />}
          {activeTab === 'Notifications' && <Notifications />}
          {activeTab === 'AdminManagement' && <AdminManagement />}
          {activeTab === 'Transactions' && <Transactions />}
          {activeTab === 'Chatbot' && <ChatbotFAQs />}
          {activeTab === 'AuditLogs' && <AuditLogs />}
          {activeTab === 'Banners' && <Banners />}
          {activeTab === 'Settings' && <SystemSettings />}
          {activeTab === 'AffiliateReports' && <AffiliateReports />}
          {activeTab === 'RechargeReports' && <RechargeReports />}
          {activeTab === 'ReferralAnalytics' && <ReferralAnalytics />}
        </div>
      </main>
    </div>
  );
};

// ─────────────────────────────────────────────────────────────
// KPI Card
// ─────────────────────────────────────────────────────────────
const KpiCard = ({ label, value, icon, color, sub, negative }: {
  label: string; value: string; icon: React.ReactNode;
  color: string; sub?: string; negative?: boolean;
}) => {
  const palettes: Record<string, { dot: string; bg: string; text: string }> = {
    indigo: { dot: 'bg-indigo-500', bg: 'bg-indigo-50', text: 'text-indigo-600' },
    emerald: { dot: 'bg-emerald-500', bg: 'bg-emerald-50', text: 'text-emerald-600' },
    violet: { dot: 'bg-violet-500', bg: 'bg-violet-50', text: 'text-violet-600' },
    blue: { dot: 'bg-blue-500', bg: 'bg-blue-50', text: 'text-blue-600' },
    amber: { dot: 'bg-amber-500', bg: 'bg-amber-50', text: 'text-amber-600' },
    red: { dot: 'bg-red-500', bg: 'bg-red-50', text: 'text-red-600' },
    slate: { dot: 'bg-slate-400', bg: 'bg-slate-100', text: 'text-slate-500' },
  };
  const p = palettes[color] ?? palettes.slate;

  return (
    <div className="stat-card animate-fade-up">
      <div className={`inline-flex items-center justify-center w-9 h-9 rounded-xl ${p.bg} ${p.text} mb-4 transition-transform duration-500 group-hover:scale-110`}>
        {icon}
      </div>
      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">{label}</p>
      <p className={`text-2xl font-bold tabular-nums tracking-tight ${negative ? 'text-red-600' : 'text-slate-900'}`}>{value}</p>
      {sub && <p className="text-[10px] text-slate-400 font-medium mt-1.5 leading-tight">{sub}</p>}
    </div>
  );
};

export default App;
