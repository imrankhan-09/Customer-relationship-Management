import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthProvider';
import api from '../../api/api';
import {
  UserGroupIcon,
  CheckCircleIcon,
  XCircleIcon,
  ClockIcon,
  ArrowTrendingUpIcon,
  PlusIcon,
  MagnifyingGlassIcon,
  CalendarIcon,
  PhoneIcon,
  EnvelopeIcon,
  ChatBubbleBottomCenterTextIcon,
  ArrowUpIcon,
  DocumentTextIcon,
  CurrencyDollarIcon
} from '@heroicons/react/24/outline';
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

const CreatorDashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [statsData, setStatsData] = useState({
    total: 0,
    approved: 0,
    rejected: 0,
    pending: 0,
    converted: 0,
    active: 0,
    byType: [],
    recent: []
  });
  const [monthlyData, setMonthlyData] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedLead, setSelectedLead] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);


  const currentDate = new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });

  const fetchData = async () => {
    try {
      const [statsRes, monthlyRes] = await Promise.all([
        api.get('/leads/stats'),
        api.get('/leads/stats/monthly')
      ]);
      
      console.log('Dashboard Stats Response:', statsRes.data);
      console.log('Monthly Stats Response:', monthlyRes.data);
      
      setStatsData(statsRes.data);
      
      // Transform monthly stats for Recharts
      if (monthlyRes.data && monthlyRes.data.months) {
        const transformedMonthly = monthlyRes.data.months.map((month, i) => ({
          month: month,
          leads: monthlyRes.data.total[i] || 0,
          approved: monthlyRes.data.approved[i] || 0,
          converted: monthlyRes.data.converted[i] || 0
        }));
        setMonthlyData(transformedMonthly);
      }
    } catch (err) {
      console.error('Error fetching dashboard data:', err);
    } finally {
      setIsLoading(false);
    }
  };


  useEffect(() => {
    fetchData();
  }, []);

  // Get the last 5 leads for activity
  const recentActivity = statsData.recent || [];

  const stats = [
    { name: 'Total Leads', value: statsData.total, icon: UserGroupIcon, color: 'text-blue-600', bg: 'bg-blue-100/50' },
    { name: 'Approved', value: statsData.approved, icon: CheckCircleIcon, color: 'text-emerald-600', bg: 'bg-emerald-100/50' },
    { name: 'Rejected', value: statsData.rejected, icon: XCircleIcon, color: 'text-rose-600', bg: 'bg-rose-100/50' },
    { name: 'Pending', value: statsData.pending, icon: ClockIcon, color: 'text-amber-600', bg: 'bg-amber-100/50' },
    { name: 'Converted', value: statsData.converted, icon: ArrowTrendingUpIcon, color: 'text-indigo-600', bg: 'bg-indigo-100/50' },
  ];

  const pieData = statsData.byType.length > 0
    ? statsData.byType.map(item => ({ name: item.type.toUpperCase(), value: parseInt(item.value) }))
    : [{ name: 'No Data', value: 1 }];

  const COLORS = ['#3B82F6', '#EF4444', '#10B981', '#F59E0B', '#8B5CF6'];

  const openLeadDetails = (lead) => {
    // Defensive parsing for extra_data
    let parsedExtra = lead.extra_data;
    if (typeof parsedExtra === 'string') {
      try {
        parsedExtra = JSON.parse(parsedExtra);
      } catch (e) {
        console.error('Error parsing extra_data string:', e);
        parsedExtra = {};
      }
    }
    setSelectedLead({ ...lead, extra_data: parsedExtra || {} });
    setIsModalOpen(true);
  };


  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-40 gap-4">
        <div className="w-12 h-12 border-4 border-blue-600/20 border-t-blue-600 rounded-full animate-spin"></div>
        <p className="text-slate-500 font-bold tracking-widest text-xs uppercase">Syncing Dashboard...</p>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-500 pb-12">
      {/* Lead Details Modal */}
      {isModalOpen && selectedLead && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6">
          <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={() => setIsModalOpen(false)}></div>
          <div className="relative w-full max-w-2xl bg-white rounded-3xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200 flex flex-col max-h-[90vh]">
            <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
              <h2 className="text-2xl font-black text-slate-900">{selectedLead.name}</h2>
              <button onClick={() => setIsModalOpen(false)} className="p-2 hover:bg-white rounded-xl transition-all text-slate-400 hover:text-rose-500 border border-transparent hover:border-slate-100 shadow-sm">
                <PlusIcon className="w-6 h-6 rotate-45" />
              </button>
            </div>
            <div className="p-8 overflow-y-auto space-y-8">
              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Status</p>
                  <p className="text-sm font-bold text-slate-700 capitalize">{selectedLead.status}</p>
                </div>
                <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Pipeline Stage</p>
                  <p className="text-sm font-bold text-slate-700 capitalize">{selectedLead.pipeline_stage}</p>
                </div>
              </div>
              <div className="space-y-4">
                <h3 className="text-sm font-black text-slate-900 uppercase tracking-widest border-b pb-2">Dynamic Extra Data</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {Object.entries(selectedLead.extra_data || {}).map(([key, value]) => (
                    <div key={key} className="p-4 bg-white rounded-2xl border border-slate-100 shadow-sm">
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">{key.replace(/_/g, ' ')}</p>
                      <p className="text-sm font-bold text-slate-700">{typeof value === 'boolean' ? (value ? 'Yes' : 'No') : String(value)}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
            <div className="p-6 bg-slate-50 border-t border-slate-100 flex justify-end">
              <button onClick={() => setIsModalOpen(false)} className="px-8 py-2.5 bg-blue-600 text-white font-bold rounded-xl shadow-lg shadow-blue-200 hover:bg-blue-700 transition-all">Close</button>
            </div>
          </div>
        </div>
      )}

      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white/40 backdrop-blur-md p-6 rounded-3xl border border-white/40 shadow-sm">
        <div className="flex-1">
          <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">
            Hello, <span className="text-blue-600">{user?.name || 'Creator'}</span>!
          </h1>
          <div className="flex items-center gap-2 mt-1 text-slate-500 font-medium">
            <CalendarIcon className="w-4 h-4" />
            <span>{currentDate}</span>
          </div>
        </div>
        <div className="flex flex-col sm:flex-row gap-3">
          <button
            onClick={() => navigate('/creator/create-lead')}
            className="flex items-center justify-center gap-2 bg-blue-600 px-8 py-3 rounded-2xl text-white font-bold hover:bg-blue-700 transition-all active:scale-95 shadow-lg shadow-blue-200"
          >
            <PlusIcon className="w-5 h-5" />
            <span>New Lead</span>
          </button>
        </div>
      </div>


      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        {stats.map((stat) => (
          <div key={stat.name} className="glass-card p-6 rounded-3xl transition-all hover:translate-y-[-4px] hover:shadow-xl group cursor-default relative overflow-hidden">
            <div className={`absolute -right-4 -top-4 w-24 h-24 bg-blue-500/5 rounded-full group-hover:scale-150 transition-transform duration-500`}></div>
            <div className="flex items-start justify-between relative z-10">
              <div>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{stat.name}</p>
                <h3 className="text-2xl font-black text-slate-900 mt-2">{stat.value}</h3>
              </div>
              <div className={`${stat.bg} p-3 rounded-2xl ${stat.color} group-hover:bg-blue-600 group-hover:text-white transition-colors duration-300`}>
                <stat.icon className="w-6 h-6" />
              </div>
            </div>
            <div className="flex items-center gap-1.5 mt-4 text-sm relative z-10">
              <div className={`flex items-center gap-0.5 font-bold text-emerald-600`}>
                <ArrowUpIcon className="w-3.5 h-3.5" />
                Live
              </div>
              <span className="text-slate-400 font-medium">real-time sync</span>
            </div>
          </div>
        ))}
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Analytics Chart */}
        <div className="lg:col-span-2 glass-card rounded-3xl p-8">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h3 className="text-xl font-bold text-slate-900">Leads Performance</h3>
              <p className="text-slate-500 text-sm font-medium uppercase tracking-wider text-[10px]">6 Month Productivity Trend</p>
            </div>
            <div className="flex items-center gap-4">
               <div className="flex items-center gap-1.5">
                 <div className="w-2 h-2 rounded-full bg-blue-500"></div>
                 <span className="text-[10px] font-black text-slate-400 uppercase">Total</span>
               </div>
               <div className="flex items-center gap-1.5">
                 <div className="w-2 h-2 rounded-full bg-emerald-500"></div>
                 <span className="text-[10px] font-black text-slate-400 uppercase">Approved</span>
               </div>
            </div>
          </div>
          <div className="h-[320px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={monthlyData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorTotal" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.2} />
                    <stop offset="95%" stopColor="#3B82F6" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="colorApproved" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10B981" stopOpacity={0.2} />
                    <stop offset="95%" stopColor="#10B981" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis
                  dataKey="month"
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: '#64748b', fontSize: 10, fontWeight: 700 }}
                  dy={10}
                />
                <YAxis
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: '#64748b', fontSize: 10, fontWeight: 700 }}
                />
                <Tooltip
                  contentStyle={{
                    borderRadius: '20px',
                    border: 'none',
                    boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)',
                    backgroundColor: 'rgba(255,255,255,0.95)',
                    backdropFilter: 'blur(8px)',
                    padding: '15px'
                  }}
                  itemStyle={{ fontWeight: 800, fontSize: '12px' }}
                />
                <Area
                  type="monotone"
                  dataKey="leads"
                  name="Total Leads"
                  stroke="#3B82F6"
                  strokeWidth={4}
                  fillOpacity={1}
                  fill="url(#colorTotal)"
                  animationDuration={1500}
                />
                <Area
                  type="monotone"
                  dataKey="approved"
                  name="Approved"
                  stroke="#10B981"
                  strokeWidth={4}
                  fillOpacity={1}
                  fill="url(#colorApproved)"
                  animationDuration={1500}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>


        {/* Status Distribution */}
        <div className="glass-card rounded-3xl p-8 flex flex-col">
          <h3 className="text-xl font-bold text-slate-900 mb-1">Status Breakdown</h3>
          <p className="text-slate-500 text-sm font-medium mb-6">Current lead health</p>

          <div className="h-64 relative">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  innerRadius={70}
                  outerRadius={90}
                  paddingAngle={8}
                  dataKey="value"
                  stroke="none"
                >
                  {pieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} cornerRadius={10} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
              <span className="text-3xl font-black text-slate-900">{statsData.total}</span>
              <span className="text-xs font-bold text-slate-400 uppercase tracking-tighter">Total</span>
            </div>
          </div>

          <div className="mt-8 space-y-4 overflow-y-auto max-h-48 pr-2">
            {pieData.map((entry, index) => (
              <div key={entry.name} className="flex items-center justify-between p-3 rounded-2xl bg-slate-50/50 border border-slate-100">
                <div className="flex items-center gap-3">
                  <div className="w-3 h-3 rounded-full" style={{ backgroundColor: COLORS[index % COLORS.length] }}></div>
                  <span className="text-sm font-bold text-slate-700">{entry.name}</span>
                </div>
                <span className="text-sm font-black text-slate-900">{entry.value}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Bottom Section: Activities */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 pb-12">
        <div className="lg:col-span-2 glass-card rounded-3xl p-8">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-xl font-bold text-slate-900">Recent Activity</h3>
            <button onClick={() => navigate('/creator/my-leads')} className="text-sm font-bold text-blue-600 hover:text-blue-700">View All</button>
          </div>
          <div className="space-y-4">
            {recentActivity.map((lead) => (
              <div 
                key={lead.id} 
                onClick={() => openLeadDetails(lead)}
                className="flex items-center justify-between p-4 rounded-2xl hover:bg-slate-50/80 transition-colors group cursor-pointer"
              >
                <div className="flex items-center gap-4">
                  <div className={`p-2.5 rounded-xl bg-blue-100 text-blue-600`}>
                    <PlusIcon className="w-6 h-6" />
                  </div>
                  <div>
                    <p className="font-bold text-slate-900 group-hover:text-blue-600 transition-colors">New {lead.type} lead created</p>
                    <p className="text-sm font-medium text-slate-500">{lead.name}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm font-bold text-slate-400">
                    {new Date(lead.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </p>
                </div>
              </div>
            ))}
            {recentActivity.length === 0 && (
              <p className="text-center py-8 text-slate-500 font-medium">No recent activity found.</p>
            )}
          </div>


        </div>

        {/* Support Card */}
        <div className="bg-gradient-to-br from-indigo-600 to-blue-700 rounded-3xl p-8 text-white relative overflow-hidden shadow-xl shadow-blue-200">
          <div className="absolute top-0 right-0 p-8 opacity-10">
            <ChatBubbleBottomCenterTextIcon className="w-32 h-32" />
          </div>
          <div className="relative z-10">
            <h3 className="text-2xl font-black mb-2">Need help?</h3>
            <p className="text-blue-100 font-medium mb-8 leading-relaxed">
              Our support team is available 24/7 to help you with your lead management.
            </p>
            <button className="w-full bg-white text-blue-600 py-3.5 rounded-2xl font-black shadow-lg hover:bg-blue-50 transition-all active:scale-95">
              Contact Support
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CreatorDashboard;