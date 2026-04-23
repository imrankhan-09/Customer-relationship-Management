import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthProvider';
import api from '../../api/api';
import { 
  PhoneIcon, 
  CalendarIcon, 
  CheckCircleIcon, 
  ClockIcon,
  ArrowTrendingUpIcon,
  UserGroupIcon,
  InboxStackIcon,
  CurrencyDollarIcon,
  ExclamationCircleIcon,
  VideoCameraIcon,
  ArrowRightIcon
} from '@heroicons/react/24/outline';
import { 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer 
} from 'recharts';

const WorkerDashboard = () => {
  const { user } = useAuth();
  const [statsData, setStatsData] = useState({
    assigned: 0,
    in_progress: 0,
    completed: 0,
    pending_action: 0
  });
  const [oppStats, setOppStats] = useState({
    total_deals: 0,
    total_revenue: 0,
    open_deals: 0,
    won_deals: 0,
    lost_deals: 0
  });
  const [activities, setActivities] = useState([]);
  const [performanceData, setPerformanceData] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchData = async () => {
    try {
      // 1. Fetch Lead Stats
      const leadRes = await api.get('/leads');
      const myLeads = leadRes.data.filter(l => Number(l.assigned_to) === Number(user?.id));
      
      const stats = {
        assigned: myLeads.filter(l => l.status === 'assigned').length,
        in_progress: myLeads.filter(l => l.pipeline_stage !== 'new' && l.status !== 'converted' && l.status !== 'Lost').length,
        completed: myLeads.filter(l => l.status === 'converted' || l.status === 'Converted').length,
        pending_action: myLeads.filter(l => l.pipeline_stage === 'new').length
      };
      setStatsData(stats);

      // 2. Fetch Opportunity Stats
      const oppRes = await api.get('/opportunities/stats');
      setOppStats(oppRes.data);

      // 3. Fetch Recent Activities
      const actRes = await api.get('/activities');
      setActivities(actRes.data);

      // 4. Generate dynamic distribution data for graphs
      const graphData = [
        { name: 'Negotiation', value: myLeads.filter(l => l.pipeline_stage === 'negotiation').length },
        { name: 'Won', value: oppRes.data.won_deals },
        { name: 'Lost', value: oppRes.data.lost_deals }
      ];
      setPerformanceData(graphData);

    } catch (err) {
      console.error('Error fetching worker dashboard data:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 30000);
    return () => clearInterval(interval);
  }, [user?.id]);

  const handleMarkCompleted = async (id) => {
    try {
      await api.put(`/activities/${id}/complete`);
      fetchData();
    } catch (err) {
      console.error('Error completing activity:', err);
    }
  };

  const isToday = (dateStr) => {
    if (!dateStr) return false;
    const today = new Date().toISOString().split('T')[0];
    const target = new Date(dateStr).toISOString().split('T')[0];
    return today === target;
  };

  const todayActivities = activities.filter(act => isToday(act.next_followup) && !act.completed);
  const recentActivities = activities.filter(act => !act.completed).slice(0, 4);

  const cards = [
    { name: 'Total Deals Created', value: oppStats.total_deals, icon: InboxStackIcon, color: 'text-indigo-600', bg: 'bg-indigo-100/50' },
    { name: 'Total Revenue ($)', value: parseFloat(oppStats.total_revenue || 0).toLocaleString(), icon: CurrencyDollarIcon, color: 'text-emerald-600', bg: 'bg-emerald-100/50' },
    { name: 'Won Deals', value: oppStats.won_deals, icon: CheckCircleIcon, color: 'text-blue-600', bg: 'bg-blue-100/50' },
    { name: 'In Pipeline', value: oppStats.open_deals, icon: ArrowTrendingUpIcon, color: 'text-amber-600', bg: 'bg-amber-100/50' },
  ];

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-40 gap-4">
        <div className="w-12 h-12 border-4 border-indigo-600/20 border-t-indigo-600 rounded-full animate-spin"></div>
        <p className="text-slate-500 font-bold tracking-widest text-xs uppercase">Initializing Worker Dashboard...</p>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-500 pb-10">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white/40 backdrop-blur-md p-6 rounded-3xl border border-white/40 shadow-sm">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Sales Intelligence</h1>
          <p className="text-slate-500 text-sm font-medium">Performance metrics for {user?.name}</p>
        </div>
      </div>

      {/* Reminder Banner */}
      {todayActivities.length > 0 && (
        <div className="bg-indigo-600 text-white rounded-[2.5rem] p-8 shadow-2xl shadow-indigo-200 relative overflow-hidden flex flex-col md:flex-row items-center justify-between gap-6">
           <div className="flex items-center gap-6 relative z-10">
              <div className="p-4 bg-white/20 rounded-3xl backdrop-blur-md">
                 <ExclamationCircleIcon className="w-10 h-10" />
              </div>
              <div>
                 <h3 className="text-xl font-black">Daily Action Alert</h3>
                 <p className="text-indigo-100 text-sm font-medium">You have {todayActivities.length} pending follow-ups for today.</p>
              </div>
           </div>
           <a href="/worker/follow-ups" className="relative z-10 px-8 py-4 bg-white text-indigo-600 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-indigo-50 transition-all shadow-xl">
              Launch Follow-ups
           </a>
           <div className="absolute right-0 top-0 -mr-20 -mt-20 w-80 h-80 bg-white/10 rounded-full blur-3xl"></div>
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {cards.map((stat) => (
          <div key={stat.name} className="glass-card rounded-3xl p-6 border border-white/40 shadow-sm group hover:shadow-xl transition-all">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">{stat.name}</p>
                <p className="text-2xl font-black text-slate-900">{stat.value}</p>
              </div>
              <div className={`${stat.bg} p-4 rounded-2xl group-hover:scale-110 transition-transform`}>
                <stat.icon className={`w-6 h-6 ${stat.color}`} />
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-8">
           {/* Chart */}
           <div className="glass-card rounded-3xl p-8">
              <h3 className="text-lg font-bold text-slate-900 mb-6 flex items-center gap-2">
                 <ArrowTrendingUpIcon className="w-5 h-5 text-indigo-600" />
                 Pipeline Distribution
              </h3>
              <div className="h-[300px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={performanceData}>
                    <defs>
                      <linearGradient id="colorAct" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#6366F1" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="#6366F1" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                    <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 12, fontWeight: 600}} />
                    <YAxis axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 12, fontWeight: 600}} />
                    <Tooltip contentStyle={{borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)'}} />
                    <Area type="monotone" dataKey="value" stroke="#6366F1" strokeWidth={4} fillOpacity={1} fill="url(#colorAct)" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
           </div>

           {/* Recent Activities List */}
           <div className="glass-card rounded-[2.5rem] p-8 border border-white/40 shadow-sm relative overflow-hidden">
              <div className="flex justify-between items-center mb-8">
                 <div>
                    <h3 className="text-lg font-bold text-slate-900">Priority Follow-ups</h3>
                    <p className="text-slate-400 text-[10px] font-black uppercase tracking-widest">Upcoming engagements</p>
                 </div>
                 <a href="/worker/follow-ups" className="text-blue-600 text-[10px] font-black uppercase tracking-widest hover:underline flex items-center gap-1">
                    View All <ArrowRightIcon className="w-3 h-3" />
                 </a>
              </div>
              
              <div className="space-y-4">
                 {recentActivities.length === 0 ? (
                    <div className="text-center py-10 bg-slate-50/50 rounded-3xl border border-dashed border-slate-200">
                       <p className="text-slate-400 text-xs font-bold">No pending activities</p>
                    </div>
                 ) : (
                    recentActivities.map((act) => (
                       <div key={act.id} className="flex items-center justify-between p-5 bg-slate-50/50 rounded-3xl border border-white hover:bg-white transition-all group">
                          <div className="flex items-center gap-4">
                             <div className={`p-3 rounded-2xl ${
                                act.type === 'Call' ? 'bg-emerald-100 text-emerald-600' : 'bg-blue-100 text-blue-600'
                             }`}>
                                {act.type === 'Call' ? <PhoneIcon className="w-5 h-5" /> : <CalendarIcon className="w-5 h-5" />}
                             </div>
                             <div>
                                <p className="font-bold text-slate-900">{act.lead_name}</p>
                                <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest">{act.type} • {act.next_followup ? new Date(act.next_followup).toLocaleDateString() : 'N/A'}</p>
                             </div>
                          </div>
                          <div className="flex items-center gap-2">
                             <a 
                               href={`/worker/lead/${act.lead_id}`}
                               className="p-3 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition-all"
                             >
                                <ArrowRightIcon className="w-5 h-5" />
                             </a>
                             <button 
                               onClick={() => handleMarkCompleted(act.id)}
                               className="p-3 text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-xl transition-all"
                             >
                                <CheckCircleIcon className="w-6 h-6" />
                             </button>
                          </div>
                       </div>
                    ))
                 )}
              </div>
           </div>
        </div>

        <div className="space-y-8">
           <div className="glass-card rounded-[2.5rem] p-8 bg-slate-900 text-white relative overflow-hidden flex flex-col justify-center min-h-[300px]">
              <div className="relative z-10 text-center">
                 <CheckCircleIcon className="w-16 h-16 text-emerald-500 mx-auto mb-6" />
                 <h3 className="text-2xl font-black mb-2">Deal Closure</h3>
                 <p className="text-slate-400 text-sm mb-8">Closure rate based on your won/lost ratio.</p>
                 
                 <div className="flex justify-around items-end h-24 gap-4">
                    <div className="flex flex-col items-center flex-1">
                       <div className="w-full bg-emerald-500 rounded-t-xl transition-all duration-1000" style={{height: `${(oppStats.won_deals / (oppStats.total_deals || 1)) * 100}%`}}></div>
                       <p className="text-[10px] font-black uppercase mt-2">Won</p>
                    </div>
                    <div className="flex flex-col items-center flex-1">
                       <div className="w-full bg-rose-500 rounded-t-xl transition-all duration-1000" style={{height: `${(oppStats.lost_deals / (oppStats.total_deals || 1)) * 100}%`}}></div>
                       <p className="text-[10px] font-black uppercase mt-2">Lost</p>
                    </div>
                    <div className="flex flex-col items-center flex-1">
                       <div className="w-full bg-amber-500 rounded-t-xl transition-all duration-1000" style={{height: `${(oppStats.open_deals / (oppStats.total_deals || 1)) * 100}%`}}></div>
                       <p className="text-[10px] font-black uppercase mt-2">Open</p>
                    </div>
                 </div>
              </div>
              <div className="absolute top-0 right-0 -mr-20 -mt-20 w-64 h-64 bg-blue-500/10 rounded-full blur-3xl"></div>
           </div>

           <div className="glass-card rounded-[2.5rem] p-8 bg-white border border-slate-100 shadow-sm">
              <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-6">Engagement Summary</h4>
              <div className="space-y-6">
                 <div className="flex items-center justify-between">
                    <span className="text-sm font-bold text-slate-600">Calls Logged</span>
                    <span className="text-sm font-black text-slate-900">{activities.filter(a => a.type === 'Call').length}</span>
                 </div>
                 <div className="flex items-center justify-between">
                    <span className="text-sm font-bold text-slate-600">Meetings Scheduled</span>
                    <span className="text-sm font-black text-slate-900">{activities.filter(a => a.type === 'Meeting').length}</span>
                 </div>
                 <div className="flex items-center justify-between pt-4 border-t border-slate-50">
                    <span className="text-sm font-bold text-blue-600">Pending Actions</span>
                    <span className="text-sm font-black text-blue-600">{activities.filter(a => !a.completed).length}</span>
                 </div>
              </div>
           </div>
        </div>
      </div>
    </div>
  );
};

export default WorkerDashboard;