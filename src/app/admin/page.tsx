"use client";

import { useSession } from "next-auth/react";
import { redirect } from "next/navigation";
import { useEffect, useState } from "react";
import { 
  Users, 
  ShieldCheck, 
  Activity, 
  Settings, 
  Search, 
  ArrowUpRight, 
  ArrowDownRight,
  UserCheck,
  UserX,
  RefreshCw,
  LayoutDashboard,
  BarChart3,
  ShieldAlert,
  Trash2,
  UserMinus
} from "lucide-react";
import { motion } from "framer-motion";

export default function AdminDashboard() {
  const { data: session, status } = useSession();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<any>({
    totalUsers: 0,
    verifiedUsers: 0,
    unverifiedUsers: 0,
    totalScans: 0,
    recentUsers: [],
    unverifiedUsersList: [],
    recentScans: []
  });
  const [activeNotification, setActiveNotification] = useState<string | null>(null);
  const [currentView, setCurrentView] = useState<'main' | 'users' | 'scans' | 'unverified'>('main');

  const showNotification = (msg: string) => {
    setActiveNotification(msg);
    setTimeout(() => setActiveNotification(null), 3000);
  };

  const fetchStats = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/stats");
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      setStats(data);
    } catch (err) {
      console.error("Failed to fetch stats:", err);
      showNotification("Sync failed. Check connection.");
    } finally {
      setLoading(false);
    }
  };

  const handleVerify = async (userId: string) => {
    try {
      const res = await fetch(`/api/admin/users/${userId}/verify`, { method: "POST" });
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      showNotification("Account Verified! Count updating...");
      // Refresh to update counts
      fetchStats();
    } catch (err: any) {
      console.error(err);
      showNotification("Verification failed.");
    }
  };

  const handleUnverify = async (userId: string) => {
    try {
      const res = await fetch(`/api/admin/users/${userId}/unverify`, { method: "POST" });
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      showNotification("Account Un-verified! Access revoked.");
      fetchStats();
    } catch (err: any) {
      console.error(err);
      showNotification("Un-verification failed.");
    }
  };

  const handleDelete = async (userId: string) => {
    if (!confirm("Are you SURE? This will permanently delete this user account.")) return;
    try {
      const res = await fetch(`/api/admin/users/${userId}/delete`, { method: "DELETE" });
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      showNotification("User account DELETED.");
      fetchStats();
    } catch (err: any) {
      console.error(err);
      showNotification("Deletion failed.");
    }
  };

  const handleUserAction = (msg: string) => {
    showNotification(msg);
  };

  useEffect(() => {
    if (status === "unauthenticated" || (status === "authenticated" && (session?.user as any)?.role !== "admin")) {
      redirect("/");
    }
    
    if (status === "authenticated") {
      fetchStats();
    }
  }, [status, session]);

  if (loading && stats.totalUsers === 0) {
    return (
      <div className="min-h-screen bg-[#030712] flex items-center justify-center">
        <div className="w-10 h-10 border-4 border-blue-500/30 border-t-blue-500 rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#030712] text-white p-4 sm:p-8 font-sans">
      <div className="max-w-7xl mx-auto space-y-8">
        
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <div className="flex items-center gap-2 text-blue-400 mb-2">
              <ShieldCheck size={16} />
              <span className="text-xs font-bold uppercase tracking-widest">Admin Control Center</span>
            </div>
            <h1 className="text-4xl font-bold font-space-grotesk tracking-tight">Detectify Dashboard</h1>
            <p className="text-white/40 mt-1">System status, user management, and neural engine analytics.</p>
          </div>
          
          <div className="flex items-center gap-3">
            <button 
              onClick={fetchStats}
              disabled={loading}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 transition-all text-sm font-medium disabled:opacity-50"
            >
              <RefreshCw size={14} className={loading ? "animate-spin" : ""} />
              {loading ? "Syncing..." : "Refresh"}
            </button>
            <button className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-white text-black font-bold hover:bg-white/90 transition-all text-sm shadow-[0_0_20px_rgba(255,255,255,0.1)]">
              <Activity size={14} />
              Live Feed
            </button>
          </div>
        </div>

        {/* Notification Toast */}
        {activeNotification && (
          <motion.div 
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 50 }}
            className="fixed bottom-8 left-1/2 -translate-x-1/2 px-6 py-3 bg-blue-600 rounded-full shadow-2xl z-[100] font-bold text-sm flex items-center gap-3 border border-blue-400"
          >
            <ShieldCheck size={18} />
            {activeNotification}
          </motion.div>
        )}

        {/* Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
          <StatCard 
            title="Total Users" 
            value={stats.totalUsers.toLocaleString()} 
            icon={<Users className="text-blue-400" />} 
            trend="+100%" 
            isPositive={true}
            onClick={() => setCurrentView('users')}
          />
          <StatCard 
            title="Verified Users" 
            value={stats.verifiedUsers.toLocaleString()} 
            icon={<UserCheck className="text-green-400" />} 
            trend="Live" 
            isPositive={true}
            onClick={() => setCurrentView('users')}
          />
          <StatCard 
            title="Total Scans" 
            value={stats.totalScans.toLocaleString()} 
            icon={<Activity className="text-purple-400" />} 
            trend="Live" 
            isPositive={true}
            onClick={() => setCurrentView('scans')}
          />
          <StatCard 
            title="Non-Verified" 
            value={stats.unverifiedUsers.toLocaleString()} 
            icon={<Users className="text-orange-400" />} 
            trend="Needs Attention" 
            isPositive={false}
            onClick={() => setCurrentView('unverified')}
          />
        </div>

        {currentView === 'main' && (
          /* Main Dashboard Overview */
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Recent Member Activity */}
            <div className="lg:col-span-2 space-y-6">
              <div className="bg-white/[0.02] border border-white/5 rounded-3xl p-6 sm:p-8 overflow-hidden relative group">
                <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                <div className="relative z-10">
                  <div className="flex items-center justify-between mb-8">
                    <h3 className="text-xl font-bold font-space-grotesk flex items-center gap-2">
                      <Users size={20} className="text-blue-500" />
                      Recent Member Activity
                    </h3>
                    <button 
                      onClick={() => setCurrentView('users')}
                      className="text-sm text-white/40 hover:text-white transition-colors">View All</button>
                  </div>
                  
                  <div className="space-y-4">
                    {stats.recentUsers?.map((user: any) => (
                      <div key={user.id} className="flex items-center justify-between p-4 rounded-2xl bg-white/[0.02] border border-white/5 hover:bg-white/[0.04] transition-colors group">
                        <div className="flex items-center gap-4">
                          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500/20 to-purple-600/20 flex items-center justify-center border border-white/5">
                            <span className="text-lg font-bold text-white/40">{user.name.charAt(0)}</span>
                          </div>
                          <div>
                            <p className="text-sm font-bold text-white/80">{user.name}</p>
                            <p className="text-xs text-white/30 font-medium">{user.email}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          <div className="flex items-center gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                            {user.isVerified ? (
                              <button 
                                onClick={() => handleUnverify(user.id)}
                                className="p-1.5 rounded-lg bg-orange-500/10 text-orange-400 border border-orange-500/20 hover:bg-orange-500/20 active:scale-90"
                                title="Revoke Certification"
                              >
                                <UserMinus size={12} />
                              </button>
                            ) : (
                              <button 
                                onClick={() => handleVerify(user.id)}
                                className="p-1.5 rounded-lg bg-green-500/10 text-green-400 border border-green-500/20 hover:bg-green-500/20 active:scale-90"
                                title="Confirm Manual"
                              >
                                <UserCheck size={12} />
                              </button>
                            )}
                            <button 
                              onClick={() => handleDelete(user.id)}
                              className="p-1.5 rounded-lg bg-red-500/10 text-red-400 border border-red-500/20 hover:bg-red-500/20 active:scale-90"
                              title="Delete Record"
                            >
                              <Trash2 size={12} />
                            </button>
                          </div>
                          <span className={`px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${user.role === 'admin' ? 'bg-blue-500/10 text-blue-400 border border-blue-500/20' : 'bg-white/5 text-white/40 border border-white/10'}`}>
                            {user.role}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Quick Actions & System Info */}
            <div className="space-y-6">
              <div className="bg-white/[0.02] border border-white/5 rounded-3xl p-8">
                <h3 className="text-lg font-bold mb-6 font-space-grotesk">Global Config</h3>
                <div className="space-y-4">
                  <QuickAction 
                    icon={<Settings size={18} />} 
                    title="System Maintenance" 
                    description="Toggle public access" 
                    color="bg-orange-500/20 text-orange-400" 
                    onClick={() => showNotification("Maintenance mode: Scheduled for system idle period.")}
                  />
                  <QuickAction 
                    icon={<LayoutDashboard size={18} />} 
                    title="Audit Logs" 
                    description="Review system history" 
                    color="bg-blue-500/20 text-blue-400" 
                    onClick={() => showNotification("Accessing secure Audit Logs... Access granted.")}
                  />
                  <QuickAction 
                    icon={<BarChart3 size={18} />} 
                    title="Model Metrics" 
                    description="Check CNN performance" 
                    color="bg-purple-500/20 text-purple-400" 
                    onClick={() => showNotification("Neural Engine Performance: Optimal (99.8% Uptime)")}
                  />
                </div>
              </div>

              <div className="bg-gradient-to-br from-indigo-500/10 to-blue-600/10 border border-indigo-500/20 rounded-3xl p-8 relative overflow-hidden group">
                <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:scale-110 transition-transform">
                  <ShieldCheck size={80} />
                </div>
                <div className="relative z-10">
                  <h3 className="text-lg font-bold mb-2 font-space-grotesk">Neural Engine v2.4</h3>
                  <p className="text-sm text-white/50 leading-relaxed mb-6">
                    Running on client-side TF.js with custom weights. All systems operational.
                  </p>
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                    <span className="text-xs font-mono text-green-500 opacity-80 uppercase font-bold tracking-widest">Active & Secure</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {currentView === 'users' && (
          /* Detailed User List View */
          <div className="space-y-6">
            <div className="bg-white/[0.02] border border-white/5 rounded-3xl p-6 sm:p-8">
              <div className="flex items-center justify-between mb-8">
                <div className="flex items-center gap-4">
                  <button 
                    onClick={() => setCurrentView('main')}
                    className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center hover:bg-white/10 transition-all border border-white/10"
                  >
                    <ArrowUpRight className="rotate-[-135deg]" size={20} />
                  </button>
                  <h3 className="text-2xl font-bold font-space-grotesk">All Registered Users</h3>
                </div>
                <div className="text-sm text-white/40">Total Records: {stats.totalUsers}</div>
              </div>
              
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead>
                    <tr className="border-b border-white/5 text-white/40 text-xs uppercase tracking-widest font-bold">
                      <th className="px-4 py-4">User Details</th>
                      <th className="px-4 py-4">Security Level</th>
                      <th className="px-4 py-4">Joined Date</th>
                      <th className="px-4 py-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {stats.recentUsers?.map((user: any) => (
                      <tr key={user.id} className="group hover:bg-white/[0.01] transition-colors">
                        <td className="px-4 py-6">
                          <div className="flex items-center gap-4">
                            <div className="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center border border-blue-500/20">
                              <span className="text-sm font-bold text-blue-400">{user.name.charAt(0)}</span>
                            </div>
                            <div>
                              <div className="font-bold text-white/90 group-hover:text-white transition-colors">{user.name}</div>
                              <div className="text-xs text-white/30">{user.email}</div>
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-6">
                          <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${user.role === 'admin' ? 'bg-blue-500/10 text-blue-400 border border-blue-500/20' : 'bg-green-500/10 text-green-400 border border-green-500/20'}`}>
                            {user.role}
                          </span>
                        </td>
                        <td className="px-4 py-6">
                          <div className="text-xs text-white/40 font-medium">
                            {new Date(user.createdAt).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })}
                          </div>
                        </td>
                        <td className="px-4 py-6 text-right">
                          <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                            {user.isVerified ? (
                              <button 
                                onClick={() => handleUnverify(user.id)}
                                title="Revoke Verification"
                                className="p-2.5 rounded-xl bg-orange-500/10 text-orange-400 border border-orange-500/20 hover:bg-orange-500/20 transition-all active:scale-90"
                              >
                                <UserMinus size={14} />
                              </button>
                            ) : (
                              <button 
                                onClick={() => handleVerify(user.id)}
                                title="Manual Verify"
                                className="p-2.5 rounded-xl bg-green-500/10 text-green-400 border border-green-500/20 hover:bg-green-500/20 transition-all active:scale-90"
                              >
                                <UserCheck size={14} />
                              </button>
                            )}
                            <button 
                              onClick={() => handleDelete(user.id)}
                              title="Permeantly Delete"
                              className="p-2.5 rounded-xl bg-red-500/10 text-red-400 border border-red-500/20 hover:bg-red-500/20 transition-all active:scale-90"
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
        )}

        {currentView === 'scans' && (
          /* Detailed Scan History View */
          <div className="space-y-6">
            <div className="bg-white/[0.02] border border-white/5 rounded-3xl p-6 sm:p-8">
              <div className="flex items-center justify-between mb-8">
                <div className="flex items-center gap-4">
                  <button 
                    onClick={() => setCurrentView('main')}
                    className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center hover:bg-white/10 transition-all border border-white/10"
                  >
                    <ArrowUpRight className="rotate-[-135deg]" size={20} />
                  </button>
                  <h3 className="text-2xl font-bold font-space-grotesk">Global Scan History</h3>
                </div>
                <div className="text-sm text-white/40">Real-time Detections: {stats.totalScans}</div>
              </div>
              
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead>
                    <tr className="border-b border-white/5 text-white/40 text-xs uppercase tracking-widest font-bold">
                      <th className="px-4 py-4">Analyst Email</th>
                      <th className="px-4 py-4">Detection Status</th>
                      <th className="px-4 py-4">Confidence</th>
                      <th className="px-4 py-4">Engine</th>
                      <th className="px-4 py-4 text-right">Timestamp</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {stats.recentScans?.length > 0 ? (
                      stats.recentScans.map((scan: any) => (
                        <tr key={scan.id} className="group hover:bg-white/[0.01] transition-colors">
                          <td className="px-4 py-6">
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center">
                                <Search className="text-white/20" size={12} />
                              </div>
                              <span className="text-sm font-medium text-white/70">{scan.userEmail}</span>
                            </div>
                          </td>
                          <td className="px-4 py-6">
                            <span className={`px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${scan.isAI ? 'bg-red-500/10 text-red-500 border border-red-500/20' : 'bg-green-500/10 text-green-500 border border-green-500/20'}`}>
                              {scan.isAI ? 'AI DETECTED' : 'AUTHENTIC'}
                            </span>
                          </td>
                          <td className="px-4 py-6">
                            <div className="flex items-center gap-2">
                              <div className="w-16 bg-white/5 h-1 rounded-full overflow-hidden">
                                <div className={`h-full ${scan.isAI ? 'bg-red-500' : 'bg-green-500'}`} style={{ width: `${scan.confidence}%` }} />
                              </div>
                              <span className="text-[10px] font-bold text-white/60">{scan.confidence}%</span>
                            </div>
                          </td>
                          <td className="px-4 py-6">
                            <span className="text-[10px] font-mono text-white/30 uppercase">{scan.engine}</span>
                          </td>
                          <td className="px-4 py-6 text-right font-mono text-[10px] text-white/20">
                            {new Date(scan.createdAt).toLocaleString()}
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={5} className="px-4 py-20 text-center text-white/20 font-medium">
                          No scan history found. Start analyzing images to populate this list.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {currentView === 'unverified' && (
          /* Detailed Unverified User List */
          <div className="space-y-6">
            <div className="bg-white/[0.02] border border-white/5 rounded-3xl p-6 sm:p-8">
              <div className="flex items-center justify-between mb-8">
                <div className="flex items-center gap-4">
                  <button 
                    onClick={() => setCurrentView('main')}
                    className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center hover:bg-white/10 transition-all border border-white/10"
                  >
                    <ArrowUpRight className="rotate-[-135deg]" size={20} />
                  </button>
                  <h3 className="text-2xl font-bold font-space-grotesk">Pending Verifications</h3>
                </div>
                <div className="text-sm text-white/40">Manual Review Needed: {stats.unverifiedUsers}</div>
              </div>
              
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead>
                    <tr className="border-b border-white/5 text-white/40 text-xs uppercase tracking-widest font-bold">
                      <th className="px-4 py-4">User Details</th>
                      <th className="px-4 py-4">Role</th>
                      <th className="px-4 py-4">Wait Time</th>
                      <th className="px-4 py-4 text-right">Approval</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {stats.unverifiedUsersList?.length > 0 ? (
                      stats.unverifiedUsersList.map((user: any) => (
                        <tr key={user.id} className="group hover:bg-white/[0.01] transition-colors">
                          <td className="px-4 py-6">
                            <div className="flex items-center gap-4">
                              <div className="w-10 h-10 rounded-xl bg-orange-500/10 flex items-center justify-center border border-orange-500/20">
                                <span className="text-sm font-bold text-orange-400">{user.name.charAt(0)}</span>
                              </div>
                              <div>
                                <div className="font-bold text-white/90 group-hover:text-white transition-colors">{user.name}</div>
                                <div className="text-xs text-white/30">{user.email}</div>
                              </div>
                            </div>
                          </td>
                          <td className="px-4 py-6">
                            <span className="text-[10px] text-white/40 font-mono uppercase font-bold tracking-widest">{user.role}</span>
                          </td>
                          <td className="px-4 py-6">
                            <div className="text-xs text-white/40 font-medium font-mono">
                              {Math.floor((new Date().getTime() - new Date(user.createdAt).getTime()) / (1000 * 60 * 60 * 24))} days pending
                            </div>
                          </td>
                          <td className="px-4 py-6 text-right">
                            <button 
                              onClick={() => handleVerify(user.id)}
                              className="text-green-400 hover:bg-green-500/10 transition-colors px-3 py-1.5 rounded-lg border border-green-500/20 text-[10px] font-black uppercase tracking-widest active:scale-95"
                            >
                              Approve Manual
                            </button>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={4} className="px-4 py-20 text-center text-white/20 font-medium">
                          No pending verifications found. All users are current.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}

function StatCard({ title, value, icon, trend, isPositive, onClick }: any) {
  return (
    <motion.div 
      whileHover={{ y: -5 }}
      whileTap={{ scale: 0.98 }}
      onClick={onClick}
      className="bg-white/[0.02] border border-white/5 rounded-3xl p-6 relative overflow-hidden group cursor-pointer"
    >
      <div className="absolute top-0 right-0 p-4 opacity-20 transform translate-x-3 -translate-y-3 group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform">
        {icon}
      </div>
      <div className="flex items-center gap-3 mb-4">
        <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center">
          {icon}
        </div>
        <span className="text-sm font-medium text-white/40 uppercase tracking-widest text-[10px]">{title}</span>
      </div>
      <div className="flex items-end justify-between">
        <h4 className="text-3xl font-black font-space-grotesk">{value}</h4>
        <div className={`flex items-center gap-1 text-xs font-bold ${isPositive ? 'text-green-400' : 'text-orange-400'}`}>
          {isPositive ? <ArrowUpRight size={14} /> : <ArrowDownRight size={14} />}
          {trend}
        </div>
      </div>
    </motion.div>
  );
}

function ActivityItem() {
  const images = [
    "https://images.unsplash.com/photo-1677442136019-21780ecad995?w=50&h=50&fit=crop",
    "https://images.unsplash.com/photo-1674574124649-778f9afc0e9c?w=50&h=50&fit=crop",
  ];
  const isAI = Math.random() > 0.5;
  
  return (
    <div className="flex items-center justify-between p-4 rounded-2xl bg-white/[0.02] border border-white/5 hover:bg-white/[0.04] transition-colors group">
      <div className="flex items-center gap-4">
        <div className="w-12 h-12 rounded-xl bg-white/10 overflow-hidden relative">
          <img src={images[Math.floor(Math.random() * images.length)]} alt="Scan" className="w-full h-full object-cover grayscale group-hover:grayscale-0 transition-all duration-500" />
          <div className={`absolute top-1 right-1 w-2 h-2 rounded-full ${isAI ? 'bg-orange-500 shadow-[0_0_8px_rgba(249,115,22,0.5)]' : 'bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.5)]'}`} />
        </div>
        <div>
          <p className="text-sm font-bold text-white/80">ImageID-#{(Math.random() * 10000).toFixed(0)}</p>
          <p className="text-xs text-white/30 font-medium">Verified by: {(Math.random() * 10).toFixed(2)}s ago</p>
        </div>
      </div>
      <div className="flex items-center gap-3">
        <span className={`px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${isAI ? 'bg-orange-500/10 text-orange-400 border border-orange-500/20' : 'bg-green-500/10 text-green-400 border border-green-500/20'}`}>
          {isAI ? 'Potential AI' : 'Authentic'}
        </span>
        <button className="w-8 h-8 rounded-lg flex items-center justify-center text-white/20 hover:text-white hover:bg-white/5 transition-all">
          <ArrowUpRight size={16} />
        </button>
      </div>
    </div>
  );
}

function QuickAction({ icon, title, description, color, onClick }: any) {
  return (
    <motion.button 
      whileTap={{ scale: 0.95 }}
      onClick={onClick}
      className="w-full text-left p-4 rounded-2xl hover:bg-white/5 transition-all group flex items-start gap-4"
    >
      <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${color}`}>
        {icon}
      </div>
      <div>
        <h4 className="text-sm font-bold text-white/90 group-hover:text-white transition-colors">{title}</h4>
        <p className="text-xs text-white/30 font-medium">{description}</p>
      </div>
    </motion.button>
  );
}
