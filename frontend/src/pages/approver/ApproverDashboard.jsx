import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthProvider';
import api from '../../api/api';
import {
  CheckCircleIcon,
  ClockIcon,
  XCircleIcon,
  UserGroupIcon,
  ArrowTrendingUpIcon,
  CalendarIcon,
  MagnifyingGlassIcon,
  ArrowUpIcon,
  ShieldCheckIcon,
  BriefcaseIcon,
  UserIcon,
  PhoneIcon,
  EnvelopeIcon,
  PlusIcon
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

const ApproverDashboard = () => {
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
  const [workers, setWorkers] = useState([]);
  const [selectedWorkerId, setSelectedWorkerId] = useState('');
  const [workforceActivities, setWorkforceActivities] = useState([]);

  const currentDate = new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });

  useEffect(() => {
    fetchData();
    // Real-time sync every 30 seconds
    const interval = setInterval(() => fetchData(true), 30000);
    return () => clearInterval(interval);
  }, []);

  const fetchData = async (isPoll = false) => {
    try {
      const [statsRes, monthlyRes, workersRes, actRes] = await Promise.all([
        api.get('/leads/stats'),
        api.get('/leads/stats/monthly'),
        api.get('/users?role=worker'),
        api.get('/activities')
      ]);
      
      setStatsData(statsRes.data);
      setWorkers(workersRes.data);
      setWorkforceActivities(actRes.data);
      
      if (monthlyRes.data && monthlyRes.data.months) {
        const transformedMonthly = monthlyRes.data.months.map((month, i) => ({
          month: month,
          leads: monthlyRes.data.total[i] || 0,
          approved: monthlyRes.data.approved[i] || 0,
          rejected: monthlyRes.data.rejected[i] || 0
        }));
        setMonthlyData(transformedMonthly);
      }
    } catch (err) {
      console.error('Error fetching dashboard data:', err);
    } finally {
      if (!isPoll) setIsLoading(false);
    }
  };

  const stats = [
    { name: 'Pending Approvals', value: statsData.pending, icon: ClockIcon, color: 'text-amber-600', bg: 'bg-amber-100/50' },
    { name: 'Verified Leads', value: statsData.approved, icon: ShieldCheckIcon, color: 'text-emerald-600', bg: 'bg-emerald-100/50' },
    { name: 'Total Assigned', value: statsData.assigned, icon: UserGroupIcon, color: 'text-indigo-600', bg: 'bg-indigo-100/50' },
    { name: 'Total Rejected', value: statsData.rejected, icon: XCircleIcon, color: 'text-rose-600', bg: 'bg-rose-100/50' },
  ];

  const pieData = [
    { name: 'PENDING', value: statsData.pending },
    { name: 'APPROVED', value: statsData.approved },
    { name: 'ASSIGNED', value: statsData.assigned },
    { name: 'REJECTED', value: statsData.rejected },
    { name: 'CONVERTED', value: statsData.converted },
  ].filter(d => d.value > 0);

  const COLORS = ['#F59E0B', '#10B981', '#6366F1', '#EF4444', '#3B82F6'];

  const [notes, setNotes] = useState('');
  const [rejectionReason, setRejectionReason] = useState('');
  const [showRejectInput, setShowRejectInput] = useState(false);

  const handleLeadAction = async (leadId, action) => {
    if (action === 'rejected' && !showRejectInput) {
      setShowRejectInput(true);
      return;
    }

    if (action === 'rejected' && !rejectionReason) {
      alert('Please provide a reason for rejection.');
      return;
    }

    try {
      await api.put(`/leads/${leadId}`, { 
        status: action,
        notes: notes,
        rejection_reason: action === 'rejected' ? rejectionReason : null,
        assigned_to: (action === 'approved' && selectedWorkerId) ? parseInt(selectedWorkerId) : undefined
      });
      fetchData(); // Refresh data
      setIsModalOpen(false);
      setNotes('');
      setRejectionReason('');
      setShowRejectInput(false);
      setSelectedWorkerId('');
    } catch (err) {
      console.error(`Error ${action} lead:`, err);
      alert(`Failed to ${action} lead.`);
    }
  };

  const openLeadDetails = (lead) => {
    let parsedExtra = lead.extra_data;
    if (typeof parsedExtra === 'string') {
      try { parsedExtra = JSON.parse(parsedExtra); } catch (e) { parsedExtra = {}; }
    }
    setSelectedLead({ ...lead, extra_data: parsedExtra || {} });
    setNotes(lead.notes || '');
    setRejectionReason(lead.rejection_reason || '');
    setSelectedWorkerId(lead.assigned_to || '');
    setShowRejectInput(false);
    setIsModalOpen(true);
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-40 gap-4">
        <div className="w-12 h-12 border-4 border-blue-600/20 border-t-blue-600 rounded-full animate-spin"></div>
        <p className="text-slate-500 font-bold tracking-widest text-xs uppercase">Initializing Authority...</p>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-500 pb-12">
      {/* Lead Review Modal */}
      {isModalOpen && selectedLead && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6">
          <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={() => setIsModalOpen(false)}></div>
          <div className="relative w-full max-w-2xl bg-white rounded-3xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200 flex flex-col max-h-[90vh]">
            <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
              <div className="flex items-center gap-4">
                 <div className="p-3 bg-blue-100 text-blue-600 rounded-2xl">
                    <ShieldCheckIcon className="w-6 h-6" />
                 </div>
                 <div>
                    <h2 className="text-2xl font-black text-slate-900">{selectedLead.name}</h2>
                    <p className="text-slate-500 font-bold uppercase tracking-wider text-xs">Reviewing {selectedLead.type} Lead</p>
                 </div>
              </div>
              <button onClick={() => setIsModalOpen(false)} className="p-2 hover:bg-white rounded-xl transition-all text-slate-400 hover:text-rose-500 border border-transparent hover:border-slate-100 shadow-sm">
                <PlusIcon className="w-6 h-6 rotate-45" />
              </button>
            </div>
            <div className="p-8 overflow-y-auto space-y-8">
              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Current Status</p>
                  <p className="text-sm font-bold text-slate-700 capitalize">{selectedLead.status}</p>
                </div>
                <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Pipeline Stage</p>
                  <p className="text-sm font-bold text-slate-700 capitalize">{selectedLead.pipeline_stage}</p>
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                 <div className="flex items-center gap-4 p-4 rounded-2xl border border-slate-100">
                    <div className="p-3 bg-slate-100 text-slate-600 rounded-xl"><PhoneIcon className="w-5 h-5" /></div>
                    <div><p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Phone</p><p className="font-bold text-slate-800">{selectedLead.phone || 'N/A'}</p></div>
                 </div>
                 <div className="flex items-center gap-4 p-4 rounded-2xl border border-slate-100">
                    <div className="p-3 bg-slate-100 text-slate-600 rounded-xl"><EnvelopeIcon className="w-5 h-5" /></div>
                    <div><p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Email</p><p className="font-bold text-slate-800">{selectedLead.email || 'N/A'}</p></div>
                 </div>
              </div>

              <div className="space-y-4">
                <h3 className="text-sm font-black text-slate-900 uppercase tracking-widest border-b pb-2">Verification Details</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {Object.entries(selectedLead.extra_data || {}).map(([key, value]) => (
                    <div key={key} className="p-4 bg-white rounded-2xl border border-slate-100 shadow-sm">
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">{key.replace(/_/g, ' ')}</p>
                      <p className="text-sm font-bold text-slate-700">{typeof value === 'boolean' ? (value ? 'Yes' : 'No') : String(value)}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Notes & Feedback Section */}
              <div className="space-y-4 bg-slate-50 p-6 rounded-3xl border border-slate-100">
                <h3 className="text-sm font-black text-slate-900 uppercase tracking-widest flex items-center gap-2">
                   <BriefcaseIcon className="w-4 h-4 text-blue-600" />
                   Review Notes & Feedback
                </h3>
                <div className="space-y-4">
                   <div className="space-y-2">
                      <label className="text-xs font-bold text-slate-500 ml-1">Internal Notes (Visible to all roles)</label>
                      <textarea 
                        value={notes}
                        onChange={(e) => setNotes(e.target.value)}
                        placeholder="Add internal verification notes..."
                        className="w-full px-4 py-3 bg-white border border-slate-200 rounded-2xl outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all resize-none text-sm min-h-[80px]"
                      />
                   </div>

                   {showRejectInput && (
                     <div className="space-y-2 animate-in slide-in-from-top-2 duration-300">
                        <label className="text-xs font-bold text-rose-600 ml-1">Rejection Reason (Visible to Creator)</label>
                        <textarea 
                          value={rejectionReason}
                          onChange={(e) => setRejectionReason(e.target.value)}
                          placeholder="Why is this lead being rejected? (e.g., Please fill correct information)"
                          className="w-full px-4 py-3 bg-white border border-rose-200 rounded-2xl outline-none focus:ring-4 focus:ring-rose-500/10 focus:border-rose-500 transition-all resize-none text-sm min-h-[80px]"
                        />
                     </div>
                   )}

                   {/* Assignment Selection - Only for Approved Leads */}
                   {(selectedLead.status === 'approved' || (selectedLead.status === 'pending' && !showRejectInput)) && (
                     <div className="space-y-2 animate-in slide-in-from-top-2 duration-300 pt-2 border-t border-slate-100 mt-4">
                        <label className="text-xs font-bold text-blue-600 ml-1 flex items-center gap-1">
                           <UserGroupIcon className="w-3.5 h-3.5" />
                           Assign to Worker (Optional)
                        </label>
                        <select
                          value={selectedWorkerId}
                          onChange={(e) => setSelectedWorkerId(e.target.value)}
                          className="w-full px-4 py-3 bg-white border border-slate-200 rounded-2xl outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all appearance-none cursor-pointer text-sm font-bold text-slate-700"
                        >
                          <option value="">-- Select Worker --</option>
                          {workers.map(w => (
                            <option key={w.id} value={w.id}>{w.name}</option>
                          ))}
                        </select>
                     </div>
                   )}
                </div>
              </div>
            </div>
            <div className="p-6 bg-slate-50 border-t border-slate-100 flex justify-end gap-3">
              <button 
                onClick={() => handleLeadAction(selectedLead.id, 'rejected')}
                className={`px-6 py-2.5 font-bold rounded-xl border transition-all ${
                  showRejectInput 
                    ? 'bg-rose-600 text-white border-rose-600 hover:bg-rose-700' 
                    : 'bg-rose-50 text-rose-600 border-rose-100 hover:bg-rose-100'
                }`}
              >
                {showRejectInput ? 'Confirm Rejection' : 'Reject Lead'}
              </button>
              {!showRejectInput && (
                <button 
                  onClick={() => handleLeadAction(selectedLead.id, 'approved')}
                  className="px-8 py-2.5 bg-emerald-600 text-white font-bold rounded-xl shadow-lg shadow-emerald-200 hover:bg-emerald-700 transition-all flex items-center gap-2"
                >
                  <ShieldCheckIcon className="w-5 h-5" />
                  {selectedWorkerId ? 'Approve & Assign' : 'Approve & Verify'}
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white/40 backdrop-blur-md p-6 rounded-3xl border border-white/40 shadow-sm">
        <div className="flex-1">
          <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">
            Approver <span className="text-emerald-600">Portal</span>
          </h1>
          <div className="flex items-center gap-2 mt-1 text-slate-500 font-medium">
            <CalendarIcon className="w-4 h-4" />
            <span>{currentDate}</span>
          </div>
        </div>
        <div className="flex items-center gap-3">
           <div className="px-6 py-3 bg-emerald-50 text-emerald-700 rounded-2xl border border-emerald-100 flex items-center gap-3">
              <ShieldCheckIcon className="w-5 h-5" />
              <span className="font-bold">Admin Verified</span>
           </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat) => (
          <div key={stat.name} className="glass-card p-6 rounded-3xl transition-all hover:translate-y-[-4px] hover:shadow-xl group cursor-default relative overflow-hidden">
            <div className={`absolute -right-4 -top-4 w-24 h-24 bg-emerald-500/5 rounded-full group-hover:scale-150 transition-transform duration-500`}></div>
            <div className="flex items-start justify-between relative z-10">
              <div>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{stat.name}</p>
                <h3 className="text-2xl font-black text-slate-900 mt-2">{stat.value}</h3>
              </div>
              <div className={`${stat.bg} p-3 rounded-2xl ${stat.color} group-hover:bg-emerald-600 group-hover:text-white transition-colors duration-300`}>
                <stat.icon className="w-6 h-6" />
              </div>
            </div>
            <div className="flex items-center gap-1.5 mt-4 text-sm relative z-10">
              <div className={`flex items-center gap-0.5 font-bold text-emerald-600`}>
                <ArrowUpIcon className="w-3.5 h-3.5" />
                Live
              </div>
              <span className="text-slate-400 font-medium text-xs">Waiting for action</span>
            </div>
          </div>
        ))}
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 glass-card rounded-3xl p-8">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h3 className="text-xl font-bold text-slate-900">Weekly Approval Throughput</h3>
              <p className="text-slate-500 text-sm font-medium uppercase tracking-wider text-[10px]">Verification Performance Trend</p>
            </div>
            <div className="flex items-center gap-4">
               <div className="flex items-center gap-1.5">
                 <div className="w-2 h-2 rounded-full bg-blue-500"></div>
                 <span className="text-[10px] font-black text-slate-400 uppercase">Leads</span>
               </div>
               <div className="flex items-center gap-1.5">
                 <div className="w-2 h-2 rounded-full bg-emerald-500"></div>
                 <span className="text-[10px] font-black text-slate-400 uppercase">Approved</span>
               </div>
               <div className="flex items-center gap-1.5">
                 <div className="w-2 h-2 rounded-full bg-indigo-500"></div>
                 <span className="text-[10px] font-black text-slate-400 uppercase">Assigned</span>
               </div>
            </div>
          </div>
          <div className="h-[320px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={monthlyData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorLeads" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.2} />
                    <stop offset="95%" stopColor="#3B82F6" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="colorApproved" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10B981" stopOpacity={0.2} />
                    <stop offset="95%" stopColor="#10B981" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="colorAssigned" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#6366F1" stopOpacity={0.2} />
                    <stop offset="95%" stopColor="#6366F1" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 10, fontWeight: 700 }} dy={10} />
                <YAxis axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 10, fontWeight: 700 }} />
                <Tooltip contentStyle={{ borderRadius: '20px', border: 'none', boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)', backgroundColor: 'rgba(255,255,255,0.95)', backdropFilter: 'blur(8px)', padding: '15px' }} itemStyle={{ fontWeight: 800, fontSize: '12px' }} />
                <Area type="monotone" dataKey="leads" name="Total Incoming" stroke="#3B82F6" strokeWidth={4} fillOpacity={1} fill="url(#colorLeads)" />
                <Area type="monotone" dataKey="assigned" name="Assigned Leads" stroke="#6366F1" strokeWidth={4} fillOpacity={1} fill="url(#colorAssigned)" />
                <Area type="monotone" dataKey="approved" name="Approved" stroke="#10B981" strokeWidth={4} fillOpacity={1} fill="url(#colorApproved)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="glass-card rounded-3xl p-8 flex flex-col">
          <h3 className="text-xl font-bold text-slate-900 mb-1">Lead Distribution</h3>
          <p className="text-slate-500 text-sm font-medium mb-6">By category & source</p>

          <div className="h-64 relative">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={pieData} cx="50%" cy="50%" innerRadius={70} outerRadius={90} paddingAngle={8} dataKey="value" stroke="none">
                  {pieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} cornerRadius={10} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
              <span className="text-3xl font-black text-slate-900">{statsData.total}</span>
              <span className="text-xs font-bold text-slate-400 uppercase tracking-tighter">Verified</span>
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

      <div className="glass-card rounded-3xl p-8">
          <div className="flex items-center justify-between mb-8">
            <h3 className="text-xl font-bold text-slate-900">Awaiting Your Approval</h3>
            <button onClick={() => navigate('/approver/pending-leads')} className="px-5 py-2 bg-slate-100 text-slate-600 rounded-xl font-bold text-sm hover:bg-emerald-600 hover:text-white transition-all">View Full Queue</button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {statsData.recent?.filter(l => l.status === 'pending').slice(0, 3).map((lead) => (
              <div key={lead.id} className="p-6 rounded-3xl border border-slate-100 bg-slate-50/50 hover:bg-white transition-all hover:shadow-lg group">
                <div className="flex items-start justify-between mb-4">
                   <div className="p-3 bg-white rounded-2xl border border-slate-100 text-blue-600 group-hover:bg-blue-600 group-hover:text-white transition-colors">
                      <UserIcon className="w-6 h-6" />
                   </div>
                   <div className="px-3 py-1 bg-amber-100 text-amber-700 rounded-full text-[10px] font-black uppercase tracking-widest">Pending</div>
                </div>
                <h4 className="font-bold text-slate-900 mb-1">{lead.name}</h4>
                <p className="text-xs text-slate-500 font-medium mb-6 uppercase tracking-wider">{lead.type} Category</p>
                
                <div className="flex items-center gap-2">
                   <button 
                     onClick={() => openLeadDetails(lead)}
                     className="flex-1 py-2.5 bg-white text-slate-600 border border-slate-200 rounded-xl text-xs font-bold hover:bg-slate-50 transition-all"
                   >
                     Review Details
                   </button>
                </div>
              </div>
            ))}
            {statsData.recent?.filter(l => l.status === 'pending').length === 0 && (
              <div className="col-span-full py-12 text-center">
                 <div className="w-16 h-16 bg-slate-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                    <CheckCircleIcon className="w-8 h-8 text-emerald-600" />
                 </div>
                 <p className="text-slate-500 font-bold">Great job! All leads have been processed.</p>
              </div>
            )}
          </div>
      </div>

      {/* Workforce Activity Feed */}
      <div className="glass-card rounded-[2.5rem] p-8 border border-white/40 shadow-sm relative overflow-hidden">
        <div className="flex justify-between items-center mb-8">
           <div>
              <h3 className="text-xl font-bold text-slate-900">Workforce Activity Feed</h3>
              <p className="text-slate-500 text-[10px] font-black uppercase tracking-widest">Real-time engagement monitoring</p>
           </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
           {workforceActivities.length === 0 ? (
              <div className="col-span-full text-center py-12 bg-slate-50/50 rounded-3xl">
                 <p className="text-slate-400 font-bold uppercase tracking-widest text-[10px]">No activities recorded yet</p>
              </div>
           ) : (
              workforceActivities.slice(0, 8).map((act) => (
                 <div key={act.id} className="p-5 bg-white rounded-3xl border border-slate-100 hover:shadow-md transition-all">
                    <div className="flex items-center justify-between mb-4">
                       <div className={`p-2 rounded-xl ${
                          act.type === 'Call' ? 'bg-emerald-50 text-emerald-600' : 'bg-blue-50 text-blue-600'
                       }`}>
                          {act.type === 'Call' ? <PhoneIcon className="w-4 h-4" /> : <CalendarIcon className="w-4 h-4" />}
                       </div>
                       <span className={`text-[9px] font-black uppercase tracking-tighter px-2 py-0.5 rounded-full ${
                          act.completed ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'
                       }`}>
                          {act.completed ? 'Completed' : 'Pending'}
                       </span>
                    </div>
                    <p className="font-bold text-slate-800 text-sm mb-1 truncate">{act.lead_name}</p>
                    <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest mb-3">{act.worker_name}</p>
                    <div className="flex items-center gap-2 text-slate-400 text-[9px] font-bold">
                       <ClockIcon className="w-3 h-3" />
                       {new Date(act.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </div>
                 </div>
              ))
           )}
        </div>
      </div>
    </div>
  );
};

export default ApproverDashboard;