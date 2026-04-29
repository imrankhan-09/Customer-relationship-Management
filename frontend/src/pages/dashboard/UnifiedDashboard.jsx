import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../../context/AuthProvider';
import api from '../../api/api';
import { useNotification } from '../../context/NotificationContext';
import {
  UserGroupIcon,
  CheckCircleIcon,
  XCircleIcon,
  ClockIcon,
  ArrowTrendingUpIcon,
  PlusIcon,
  CalendarIcon,
  ArrowUpIcon,
  ShieldCheckIcon,
  BriefcaseIcon,
  PhoneIcon,
  EnvelopeIcon,
  ChartBarIcon,
  UserIcon,
  Squares2X2Icon,
  ViewColumnsIcon
} from '@heroicons/react/24/outline';
import LeadKanban from '../../components/sales/LeadKanban';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from 'recharts';
import PipelineAnalytics from '../../components/sales/PipelineAnalytics';

const UnifiedDashboard = () => {
  const { user, hasPermission } = useAuth();
  const navigate = useNavigate();
  const { showSuccess, showError } = useNotification();
  const [statsData, setStatsData] = useState({
    total: 0,
    approved: 0,
    rejected: 0,
    pending: 0,
    converted: 0,
    assigned: 0,
    active: 0,
    byType: [],
    recent: []
  });
  const [monthlyData, setMonthlyData] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchParams] = useSearchParams();
  const [activeView, setActiveView] = useState(searchParams.get('view') === 'pipeline' ? 'pipeline' : 'overview');

  useEffect(() => {
    const view = searchParams.get('view');
    if (view === 'pipeline') setActiveView('pipeline');
    else if (view === 'overview') setActiveView('overview');
  }, [searchParams]);

  const fetchData = async () => {
    try {
      const [statsRes, monthlyRes] = await Promise.all([
        api.get('/leads/stats'),
        api.get('/leads/stats/monthly')
      ]);
      
      setStatsData(statsRes.data);
      
      if (monthlyRes.data && monthlyRes.data.months) {
        const transformedMonthly = monthlyRes.data.months.map((month, i) => ({
          month: month,
          leads: monthlyRes.data.total[i] || 0,
          approved: monthlyRes.data.approved[i] || 0,
          converted: monthlyRes.data.converted[i] || 0,
          assigned: monthlyRes.data.assigned[i] || 0
        }));
        setMonthlyData(transformedMonthly);
      }
    } catch (err) {
      console.error('Error fetching dashboard data:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleLeadAction = async (leadId, action) => {
    try {
      await api.put(`/leads/${leadId}`, { 
        status: action,
        notes: `Quick ${action} from dashboard`
      });
      showSuccess(`Lead ${action === 'approved' ? 'Approved' : 'Rejected'} Successfully`);
      fetchData();
    } catch (err) {
      console.error(`Error ${action} lead:`, err);
      showError(`Failed to ${action} lead`);
    }
  };

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 60000); // Sync every minute
    return () => clearInterval(interval);
  }, []);

  const stats = [
    { 
      name: 'Total Leads', 
      value: statsData.total, 
      icon: UserGroupIcon, 
      color: 'text-blue-600', 
      bg: 'bg-blue-100/50',
      show: true,
      path: user?.role === 'admin' ? '/admin/leads' : (user?.role === 'creator' ? '/creator/my-leads' : '/reports/leads')
    },
    { 
      name: 'Approved', 
      value: statsData.approved, 
      icon: ShieldCheckIcon, 
      color: 'text-emerald-600', 
      bg: 'bg-emerald-100/50',
      show: hasPermission('leads', 'approve'),
      path: user?.role === 'approver' ? '/approver/verified-leads' : (user?.role === 'admin' ? '/admin/leads?status=approved' : '/reports/leads?status=approved')
    },
    { 
      name: 'Pending', 
      value: statsData.pending, 
      icon: ClockIcon, 
      color: 'text-amber-600', 
      bg: 'bg-amber-100/50',
      show: true,
      path: user?.role === 'approver' ? '/approver/pending-leads' : (user?.role === 'admin' ? '/admin/leads?status=pending' : (user?.role === 'creator' ? '/creator/my-leads?status=pending' : '/reports/leads?status=pending'))
    },
    { 
      name: 'Rejected', 
      value: statsData.rejected, 
      icon: XCircleIcon, 
      color: 'text-rose-600', 
      bg: 'bg-rose-100/50',
      show: user?.role === 'admin' || user?.role === 'approver' || user?.role === 'creator',
      path: user?.role === 'admin' ? '/admin/leads?status=rejected' : (user?.role === 'creator' ? '/creator/my-leads?status=rejected' : '/reports/leads?status=rejected')
    },
    { 
      name: 'Converted', 
      value: statsData.converted, 
      icon: ArrowTrendingUpIcon, 
      color: 'text-indigo-600', 
      bg: 'bg-indigo-100/50',
      show: true,
      path: user?.role === 'admin' ? '/admin/leads?status=converted' : (user?.role === 'creator' ? '/creator/my-leads?status=converted' : '/reports/leads?status=converted')
    },
    { 
      name: 'Assigned', 
      value: statsData.assigned, 
      icon: BriefcaseIcon, 
      color: 'text-violet-600', 
      bg: 'bg-violet-100/50',
      show: user?.role === 'worker' || user?.role === 'admin' || user?.role === 'approver',
      path: user?.role === 'worker' ? '/worker/assigned-leads' : (user?.role === 'approver' ? '/approver/assigned-leads' : '/admin/leads?status=assigned')
    },
  ].filter(s => s.show);

  const COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#6366F1'];

  const pieData = statsData.byType.length > 0
    ? statsData.byType.map(item => ({ name: item.type.toUpperCase(), value: parseInt(item.value) }))
    : [{ name: 'NO DATA', value: 1 }];

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-40 gap-4">
        <div className="w-12 h-12 border-4 border-blue-600/20 border-t-blue-600 rounded-full animate-spin"></div>
        <p className="text-slate-500 font-bold tracking-widest text-xs uppercase italic">Synchronizing Intelligence...</p>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-700 pb-12">
      {/* Premium Header */}
      <div className="relative overflow-hidden bg-white/40 backdrop-blur-xl p-8 rounded-[2.5rem] border border-white/60 shadow-sm">
        <div className="absolute top-0 right-0 w-64 h-64 bg-blue-500/5 rounded-full blur-3xl -mr-20 -mt-20"></div>
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <h1 className="text-4xl font-black text-slate-900 tracking-tight">
              Welcome, <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-600">{user?.name}</span>
            </h1>
            <div className="flex items-center gap-3 mt-2">
              <span className="px-3 py-1 bg-blue-600 text-white text-[10px] font-black uppercase tracking-widest rounded-full shadow-lg shadow-blue-200">
                {user?.role} Portal
              </span>
              <div className="flex items-center gap-1.5 text-slate-400 font-bold text-xs uppercase tracking-widest">
                <CalendarIcon className="w-4 h-4" />
                {new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
              </div>
            </div>
          </div>
          
          {hasPermission('leads', 'create') && (
            <button
              onClick={() => navigate('/creator/create-lead')}
              className="group relative flex items-center justify-center gap-3 bg-slate-900 px-8 py-4 rounded-2xl text-white font-bold hover:bg-blue-600 transition-all duration-300 active:scale-95 shadow-xl shadow-slate-200"
            >
              <PlusIcon className="w-5 h-5 group-hover:rotate-90 transition-transform duration-300" />
              <span>Create New Lead</span>
            </button>
          )}
        </div>

        {/* View Switcher */}
        {(user?.role === 'worker' || user?.role === 'admin' || user?.role === 'approver') && (
          <div className="flex items-center gap-1 bg-white/60 p-1.5 rounded-2xl border border-white/80 self-start">
            <button 
              onClick={() => setActiveView('overview')}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${
                activeView === 'overview' ? 'bg-slate-900 text-white shadow-lg' : 'text-slate-500 hover:bg-slate-100'
              }`}
            >
              <Squares2X2Icon className="w-4 h-4" />
              Overview
            </button>
            <button 
              onClick={() => setActiveView('pipeline')}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${
                activeView === 'pipeline' ? 'bg-slate-900 text-white shadow-lg' : 'text-slate-500 hover:bg-slate-100'
              }`}
            >
              <ViewColumnsIcon className="w-4 h-4" />
              Sales Pipeline
            </button>
          </div>
        )}
      </div>

      {activeView === 'pipeline' ? (
        <div className="animate-in slide-in-from-bottom-4 duration-500">
           <LeadKanban />
        </div>
      ) : (
        <>

      {/* Dynamic Stats Grid */}
      <div className={`grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-${stats.length > 4 ? 3 : stats.length} xl:grid-cols-${stats.length} gap-6`}>
        {stats.map((stat, idx) => (
          <div 
            key={idx} 
            onClick={() => stat.path && navigate(stat.path)}
            className="group relative bg-white/60 backdrop-blur-md p-6 rounded-[2rem] border border-white/80 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 cursor-pointer overflow-hidden active:scale-95"
          >
            <div className={`absolute -right-4 -top-4 w-20 h-20 ${stat.bg} rounded-full opacity-0 group-hover:opacity-100 scale-50 group-hover:scale-125 transition-all duration-500`}></div>
            <div className="flex items-start justify-between relative z-10">
              <div>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-2">{stat.name}</p>
                <h3 className="text-3xl font-black text-slate-900">{stat.value}</h3>
              </div>
              <div className={`${stat.bg} ${stat.color} p-4 rounded-2xl group-hover:bg-slate-900 group-hover:text-white transition-colors duration-300 shadow-sm`}>
                <stat.icon className="w-6 h-6" />
              </div>
            </div>
            <div className="mt-4 flex items-center gap-1.5 text-[10px] font-black text-emerald-600 uppercase tracking-tighter">
              <ArrowUpIcon className="w-3 h-3" />
              Real-time update
            </div>
          </div>
        ))}
      </div>

      {/* Analytics Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 bg-white/60 backdrop-blur-md rounded-[2.5rem] p-8 border border-white/80 shadow-sm">
          <div className="flex items-center justify-between mb-10">
            <div>
              <h3 className="text-xl font-black text-slate-900">Performance Analytics</h3>
              <p className="text-slate-400 text-[10px] font-black uppercase tracking-widest mt-1">6-Month Strategic Trend</p>
            </div>
            <div className="flex items-center gap-4">
               {['total', 'approved', 'converted'].map(type => (
                 <div key={type} className="flex items-center gap-1.5">
                   <div className={`w-2 h-2 rounded-full ${type === 'total' ? 'bg-blue-500' : type === 'approved' ? 'bg-emerald-500' : 'bg-indigo-500'}`}></div>
                   <span className="text-[10px] font-black text-slate-400 uppercase">{type}</span>
                 </div>
               ))}
            </div>
          </div>
          <div className="h-[350px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={monthlyData} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorTotal" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.15} />
                    <stop offset="95%" stopColor="#3B82F6" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="colorApp" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10B981" stopOpacity={0.15} />
                    <stop offset="95%" stopColor="#10B981" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 10, fontWeight: 800 }} dy={10} />
                <YAxis axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 10, fontWeight: 800 }} />
                <Tooltip 
                  contentStyle={{ borderRadius: '24px', border: 'none', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.15)', padding: '20px' }}
                  itemStyle={{ fontWeight: 900, fontSize: '12px', textTransform: 'uppercase' }}
                />
                <Area type="monotone" dataKey="leads" name="Total" stroke="#3B82F6" strokeWidth={4} fillOpacity={1} fill="url(#colorTotal)" />
                <Area type="monotone" dataKey="approved" name="Approved" stroke="#10B981" strokeWidth={4} fillOpacity={1} fill="url(#colorApp)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Pipeline Analytics Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
         <PipelineAnalytics />
         {/* Category Distribution (Moved here to balance) */}
         <div className="bg-white/60 backdrop-blur-md rounded-[2.5rem] p-8 border border-white/80 shadow-sm flex flex-col">
            <h3 className="text-xl font-black text-slate-900">Distribution</h3>
            <p className="text-slate-400 text-[10px] font-black uppercase tracking-widest mt-1 mb-6">Lead Categories</p>

            <div className="h-64 relative flex-shrink-0">
               <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                  <Pie data={pieData} cx="50%" cy="50%" innerRadius={75} outerRadius={95} paddingAngle={8} dataKey="value" stroke="none">
                     {pieData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} cornerRadius={12} />
                     ))}
                  </Pie>
                  <Tooltip />
                  </PieChart>
               </ResponsiveContainer>
               <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                  <span className="text-4xl font-black text-slate-900 tracking-tighter">{statsData.total}</span>
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Total Units</span>
               </div>
            </div>

            <div className="mt-6 grid grid-cols-2 gap-3">
               {pieData.slice(0, 4).map((entry, index) => (
                  <div key={entry.name} className="flex items-center justify-between p-3 rounded-2xl bg-slate-50/50 border border-slate-100">
                  <div className="flex items-center gap-2">
                     <div className="w-2 h-2 rounded-full" style={{ backgroundColor: COLORS[index % COLORS.length] }}></div>
                     <span className="text-[10px] font-bold text-slate-600 truncate max-w-[80px]">{entry.name}</span>
                  </div>
                  <span className="text-[10px] font-black text-slate-900">{entry.value}</span>
                  </div>
               ))}
            </div>
         </div>
      </div>

      {/* Bottom Section: Contextual Lists */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 bg-white/60 backdrop-blur-md rounded-[2.5rem] p-8 border border-white/80 shadow-sm">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h3 className="text-xl font-black text-slate-900">
                {user?.role === 'approver' ? 'Approval Queue' : user?.role === 'worker' ? 'Active Engagements' : 'Recent Pipeline'}
              </h3>
              <p className="text-slate-400 text-[10px] font-black uppercase tracking-widest mt-1">Live updates from the field</p>
            </div>
            <button 
              onClick={() => navigate(user?.role === 'worker' ? '/worker/assigned-leads' : '/reports/leads')}
              className="px-6 py-2 bg-slate-900 text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-blue-600 transition-all shadow-lg shadow-slate-200"
            >
              Explore All
            </button>
          </div>
          
          <div className="space-y-4">
            {statsData.recent?.slice(0, 5).map((lead) => (
              <div 
                key={lead.id} 
                onClick={() => navigate(`/leads/${lead.id}`)}
                className="flex items-center justify-between p-5 rounded-[1.5rem] bg-white/50 border border-transparent hover:border-blue-100 hover:bg-white hover:shadow-xl transition-all duration-300 group cursor-pointer"
              >
                <div className="flex items-center gap-5">
                  <div className={`p-4 rounded-2xl ${lead.status === 'pending' ? 'bg-amber-50 text-amber-600' : 'bg-blue-50 text-blue-600'} group-hover:bg-slate-900 group-hover:text-white transition-all duration-500`}>
                    {lead.status === 'pending' ? <ClockIcon className="w-5 h-5" /> : <ShieldCheckIcon className="w-5 h-5" />}
                  </div>
                  <div>
                    <p className="font-black text-slate-900 group-hover:text-blue-600 transition-colors tracking-tight">{lead.name}</p>
                    <div className="flex items-center gap-2 mt-1">
                       <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest bg-slate-100 px-2 py-0.5 rounded-full">{lead.type}</span>
                       <span className="text-[9px] font-bold text-slate-400">• {new Date(lead.created_at).toLocaleDateString()}</span>
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <div className={`px-4 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest ${
                    lead.status === 'pending' ? 'bg-amber-100 text-amber-700' : 
                    lead.status === 'approved' ? 'bg-emerald-100 text-emerald-700' : 
                    'bg-blue-100 text-blue-700'
                  }`}>
                    {lead.status}
                  </div>
                </div>
              </div>
            ))}
            {(!statsData.recent || statsData.recent.length === 0) && (
              <div className="py-20 text-center flex flex-col items-center">
                 <div className="w-16 h-16 bg-slate-50 rounded-2xl flex items-center justify-center mb-4">
                    <ChartBarIcon className="w-8 h-8 text-slate-200" />
                 </div>
                 <p className="text-slate-400 font-black uppercase tracking-widest text-[10px]">No recent data detected</p>
              </div>
            )}
          </div>
        </div>

        {/* System Health / Support Card */}
        <div className="bg-gradient-to-br from-slate-900 to-blue-900 rounded-[2.5rem] p-8 text-white relative overflow-hidden shadow-2xl shadow-blue-100">
          <div className="absolute top-0 right-0 p-8 opacity-10 rotate-12">
            <ShieldCheckIcon className="w-48 h-48" />
          </div>
          <div className="relative z-10 h-full flex flex-col">
            <h3 className="text-2xl font-black tracking-tight mb-4">System <br/>Integrity Hub</h3>
            <p className="text-blue-100/60 text-xs font-bold leading-relaxed mb-8">
              Your session is secured with end-to-end encryption. All activities are being logged for audit transparency.
            </p>
            
            <div className="mt-auto space-y-4">
               <div className="p-4 bg-white/10 rounded-2xl backdrop-blur-md border border-white/10">
                  <div className="flex items-center justify-between mb-2">
                     <span className="text-[10px] font-black uppercase tracking-widest text-blue-200">System Load</span>
                     <span className="text-[10px] font-black uppercase tracking-widest text-emerald-400">Optimal</span>
                  </div>
                  <div className="w-full bg-white/10 h-1.5 rounded-full overflow-hidden">
                     <div className="bg-emerald-400 h-full w-[15%]"></div>
                  </div>
               </div>
               
               <button className="w-full py-4 bg-white text-slate-900 rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl hover:bg-blue-50 transition-all active:scale-95">
                  Get Technical Support
               </button>
            </div>
        </div>
      </div>
    </div>
    </>
      )}
    </div>
  );
};

export default UnifiedDashboard;
