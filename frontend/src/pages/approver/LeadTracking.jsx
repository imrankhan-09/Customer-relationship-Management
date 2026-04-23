import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../../api/api';
import { 
  ArrowLeftIcon, 
  UserIcon, 
  PhoneIcon, 
  EnvelopeIcon, 
  MapPinIcon,
  CalendarIcon,
  ClockIcon,
  ArrowTrendingUpIcon,
  CurrencyDollarIcon,
  InboxStackIcon,
  CheckCircleIcon,
  ShoppingBagIcon,
  TagIcon
} from '@heroicons/react/24/outline';
import ActivityItem from '../../components/activities/ActivityItem';

const LeadTracking = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [lead, setLead] = useState(null);
  const [activities, setActivities] = useState([]);
  const [opportunity, setOpportunity] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  const fetchData = async () => {
    try {
      const [leadRes, actRes, oppRes] = await Promise.all([
        api.get(`/leads/${id}`),
        api.get(`/activities/lead/${id}`),
        api.get(`/opportunities/lead/${id}`)
      ]);
      setLead(leadRes.data);
      setActivities(actRes.data);
      setOpportunity(oppRes.data);
    } catch (err) {
      console.error('Error fetching lead tracking data:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 30000);
    return () => clearInterval(interval);
  }, [id]);

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-40 gap-4">
        <div className="w-12 h-12 border-4 border-indigo-600/20 border-t-indigo-600 rounded-full animate-spin"></div>
        <p className="text-slate-500 font-bold tracking-widest text-xs uppercase">Loading Lead Intelligence...</p>
      </div>
    );
  }

  if (!lead) return <div className="p-10 text-center">Lead not found</div>;

  return (
    <div className="space-y-8 animate-in fade-in duration-500 pb-20">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 bg-white/40 backdrop-blur-md p-8 rounded-[2.5rem] border border-white/40 shadow-sm relative overflow-hidden">
        <div className="flex items-center gap-6 relative z-10">
          <button 
            onClick={() => navigate(-1)}
            className="p-4 bg-white/80 hover:bg-white rounded-2xl transition-all text-slate-500 hover:text-indigo-600 shadow-sm border border-slate-100"
          >
            <ArrowLeftIcon className="w-6 h-6" />
          </button>
          <div>
            <div className="flex items-center gap-3 mb-2">
              <h1 className="text-3xl font-black text-slate-900">{lead.name}</h1>
              <span className="px-4 py-1 bg-indigo-100 text-indigo-700 rounded-full text-[10px] font-black uppercase tracking-widest">
                {lead.pipeline_stage}
              </span>
            </div>
            <p className="text-slate-500 font-bold uppercase tracking-wider text-xs flex items-center gap-2">
               Lead Tracking & Activity Audit
            </p>
          </div>
        </div>
        
        <div className="flex items-center gap-4 relative z-10">
           <div className="text-right hidden md:block">
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Worker Assigned</p>
              <p className="font-bold text-slate-900">{lead.assigned_worker_name || 'Processing Agent'}</p>
           </div>
           <div className="p-4 bg-indigo-600 text-white rounded-3xl shadow-xl shadow-indigo-100">
              <UserIcon className="w-8 h-8" />
           </div>
        </div>
        
        <div className="absolute right-0 top-0 -mr-20 -mt-20 w-80 h-80 bg-indigo-500/5 rounded-full blur-3xl"></div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column: Info & Timeline */}
        <div className="lg:col-span-2 space-y-8">
           {/* Activity Timeline */}
           <div className="glass-card rounded-[2.5rem] p-8 border border-white/40 shadow-sm">
              <div className="flex justify-between items-center mb-10">
                 <div>
                    <h3 className="text-xl font-bold text-slate-900">Worker Activity Timeline</h3>
                    <p className="text-slate-500 text-[10px] font-black uppercase tracking-widest">Complete history of worker engagements</p>
                 </div>
                 <div className="p-3 bg-slate-50 text-slate-400 rounded-2xl">
                    <ClockIcon className="w-6 h-6" />
                 </div>
              </div>

              <div className="space-y-2">
                 {activities.length === 0 ? (
                    <div className="text-center py-20 bg-slate-50/50 rounded-3xl border border-dashed border-slate-200">
                       <p className="text-slate-400 font-bold uppercase tracking-widest text-xs">No activity logs recorded yet</p>
                    </div>
                 ) : (
                    activities.map((act) => (
                       <ActivityItem 
                          key={act.id} 
                          activity={{
                             ...act,
                             user: act.user_name,
                             date: new Date(act.created_at).toLocaleString()
                          }} 
                       />
                    ))
                 )}
              </div>
           </div>
        </div>

        {/* Right Column: Details & Deal */}
        <div className="space-y-8">
           {/* Lead Info Card */}
           <div className="glass-card rounded-[2.5rem] p-8 border border-white/40 shadow-sm bg-slate-900 text-white relative overflow-hidden">
              <h3 className="text-lg font-black uppercase tracking-widest text-slate-400 mb-8">Contact Profile</h3>
              
              <div className="space-y-6 relative z-10">
                 <div className="flex items-center gap-4">
                    <div className="p-3 bg-white/10 rounded-2xl"><PhoneIcon className="w-5 h-5 text-indigo-400" /></div>
                    <div>
                       <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Phone</p>
                       <p className="font-bold">{lead.phone || 'N/A'}</p>
                    </div>
                 </div>
                 <div className="flex items-center gap-4">
                    <div className="p-3 bg-white/10 rounded-2xl"><EnvelopeIcon className="w-5 h-5 text-emerald-400" /></div>
                    <div>
                       <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Email</p>
                       <p className="font-bold truncate max-w-[200px]">{lead.email || 'N/A'}</p>
                    </div>
                 </div>
                 <div className="flex items-center gap-4">
                    <div className="p-3 bg-white/10 rounded-2xl"><TagIcon className="w-5 h-5 text-amber-400" /></div>
                    <div>
                       <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Lead Type</p>
                       <p className="font-bold capitalize">{lead.type}</p>
                    </div>
                 </div>
              </div>
              <div className="absolute top-0 right-0 -mr-20 -mt-20 w-64 h-64 bg-indigo-500/20 rounded-full blur-3xl"></div>
           </div>

           {/* Opportunity Card */}
           <div className="glass-card rounded-[2.5rem] p-8 border border-white/40 shadow-sm relative overflow-hidden">
              <div className="flex items-center justify-between mb-8">
                 <h3 className="text-xl font-bold text-slate-900">Deal Details</h3>
                 {opportunity ? (
                    <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${
                       opportunity.status === 'won' ? 'bg-emerald-100 text-emerald-700' :
                       opportunity.status === 'lost' ? 'bg-rose-100 text-rose-700' :
                       'bg-amber-100 text-amber-700'
                    }`}>
                       {opportunity.status}
                    </span>
                 ) : (
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">No Active Deal</span>
                 )}
              </div>

              {opportunity ? (
                 <div className="space-y-6">
                    <div className="p-5 bg-slate-50 rounded-3xl border border-slate-100">
                       <div className="flex items-center gap-4 mb-4">
                          <div className="p-3 bg-white rounded-2xl text-indigo-600 shadow-sm border border-slate-100">
                             <CurrencyDollarIcon className="w-6 h-6" />
                          </div>
                          <div>
                             <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Est. Deal Value</p>
                             <p className="text-2xl font-black text-slate-900">${parseFloat(opportunity.total_amount).toLocaleString()}</p>
                          </div>
                       </div>
                    </div>

                    <div className="space-y-3">
                       <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-2">Line Items ({opportunity.items?.length || 0})</p>
                       {opportunity.items?.map((item, idx) => (
                          <div key={idx} className="flex items-center justify-between p-4 bg-white rounded-2xl border border-slate-100 group hover:border-indigo-200 transition-all">
                             <div>
                                <p className="font-bold text-slate-800 text-sm">{item.product_name}</p>
                                <p className="text-[10px] text-slate-400 font-bold uppercase">Qty: {item.quantity}</p>
                             </div>
                             <p className="font-black text-slate-900 text-sm">${parseFloat(item.total).toLocaleString()}</p>
                          </div>
                       ))}
                    </div>
                    
                    {opportunity.status === 'lost' && (
                       <div className="p-4 bg-rose-50 text-rose-700 rounded-2xl border border-rose-100">
                          <p className="text-[10px] font-black uppercase tracking-widest mb-1">Loss Reason</p>
                          <p className="text-sm font-medium italic">{opportunity.lost_reason || 'No reason provided'}</p>
                       </div>
                    )}
                 </div>
              ) : (
                 <div className="text-center py-10 bg-slate-50/50 rounded-3xl border border-dashed border-slate-200">
                    <ShoppingBagIcon className="w-12 h-12 text-slate-200 mx-auto mb-3" />
                    <p className="text-slate-400 text-xs font-bold uppercase tracking-widest">No products added yet</p>
                 </div>
              )}
           </div>
        </div>
      </div>
    </div>
  );
};

export default LeadTracking;
