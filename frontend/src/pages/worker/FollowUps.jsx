import React, { useState, useEffect } from 'react';
import api from '../../api/api';
import { 
  CalendarIcon, 
  ClockIcon, 
  CheckCircleIcon, 
  PhoneIcon, 
  VideoCameraIcon,
  ArrowPathIcon,
  ExclamationCircleIcon,
  FunnelIcon
} from '@heroicons/react/24/outline';
import StatusBadge from '../../components/common/StatusBadge';

const FollowUps = () => {
  const [activities, setActivities] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filter, setFilter] = useState('pending'); // 'all', 'today', 'upcoming', 'completed', 'pending'

  const fetchFollowUps = async () => {
    setIsLoading(true);
    try {
      const response = await api.get('/activities');
      setActivities(response.data);
    } catch (err) {
      console.error('Error fetching follow-ups:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchFollowUps();
  }, []);

  const handleMarkCompleted = async (id) => {
    try {
      await api.put(`/activities/${id}/complete`);
      fetchFollowUps();
    } catch (err) {
      console.error('Error completing activity:', err);
      alert('Failed to update activity.');
    }
  };

  const isToday = (dateStr) => {
    if (!dateStr) return false;
    const today = new Date().toISOString().split('T')[0];
    const target = new Date(dateStr).toISOString().split('T')[0];
    return today === target;
  };

  const isOverdue = (dateStr, completed) => {
    if (!dateStr || completed) return false;
    return new Date(dateStr) < new Date();
  };

  const filteredActivities = activities.filter(act => {
    if (filter === 'all') return true;
    if (filter === 'completed') return act.completed;
    if (filter === 'pending') return !act.completed;
    if (filter === 'today') return isToday(act.next_followup) && !act.completed;
    if (filter === 'upcoming') return new Date(act.next_followup) > new Date() && !act.completed;
    return true;
  });

  const todayCount = activities.filter(act => isToday(act.next_followup) && !act.completed).length;

  return (
    <div className="space-y-8 animate-in fade-in duration-500 pb-20">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white/40 backdrop-blur-md p-6 rounded-3xl border border-white/40 shadow-sm">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Follow-up Management</h1>
          <p className="text-slate-500 text-sm font-medium">Keep track of your leads and engagements</p>
        </div>
        <div className="flex bg-slate-100 p-1 rounded-2xl">
          {['pending', 'today', 'upcoming', 'completed', 'all'].map((t) => (
            <button
              key={t}
              onClick={() => setFilter(t)}
              className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${
                filter === t ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              {t}
            </button>
          ))}
        </div>
      </div>

      {/* Today's Alert */}
      {todayCount > 0 && (
        <div className="bg-indigo-600 text-white rounded-[2rem] p-6 shadow-xl shadow-indigo-100 relative overflow-hidden flex items-center gap-6">
           <div className="p-4 bg-white/20 rounded-2xl">
              <ExclamationCircleIcon className="w-8 h-8 text-white" />
           </div>
           <div className="relative z-10">
              <h3 className="text-lg font-bold">Action Required Today</h3>
              <p className="text-indigo-100 text-sm">You have {todayCount} follow-ups scheduled for today. Be ready to engage!</p>
           </div>
           <div className="absolute right-0 top-0 -mr-10 -mt-10 w-40 h-40 bg-white/10 rounded-full blur-3xl"></div>
        </div>
      )}

      <div className="grid grid-cols-1 gap-6">
        {isLoading ? (
          <div className="flex justify-center py-20">
             <ArrowPathIcon className="w-10 h-10 text-blue-600 animate-spin" />
          </div>
        ) : filteredActivities.length === 0 ? (
          <div className="text-center py-20 bg-slate-50/50 rounded-[2.5rem] border border-dashed border-slate-200">
             <CalendarIcon className="w-16 h-16 text-slate-200 mx-auto mb-4" />
             <p className="text-slate-400 font-bold uppercase tracking-widest text-xs">No follow-ups found for this criteria</p>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredActivities.map((act) => (
              <div 
                key={act.id} 
                className={`group glass-card rounded-[2rem] p-6 border transition-all hover:shadow-xl ${
                  isOverdue(act.next_followup, act.completed) ? 'border-rose-100 bg-rose-50/20' : 'border-white/40'
                }`}
              >
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                  <div className="flex items-start gap-5">
                    <div className={`p-4 rounded-2xl ${
                      act.type === 'Call' ? 'bg-emerald-100 text-emerald-600' : 
                      act.type === 'Meeting' ? 'bg-indigo-100 text-indigo-600' : 
                      'bg-blue-100 text-blue-600'
                    }`}>
                      {act.type === 'Call' ? <PhoneIcon className="w-6 h-6" /> :
                       act.type === 'Meeting' ? <VideoCameraIcon className="w-6 h-6" /> :
                       <CalendarIcon className="w-6 h-6" />}
                    </div>
                    <div>
                      <div className="flex items-center gap-3 mb-1">
                        <h4 className="font-black text-slate-900 text-lg">{act.lead_name}</h4>
                        {act.completed ? (
                          <span className="bg-emerald-100 text-emerald-700 text-[10px] font-black uppercase tracking-widest px-3 py-1 rounded-full">Completed</span>
                        ) : isOverdue(act.next_followup) ? (
                          <span className="bg-rose-100 text-rose-700 text-[10px] font-black uppercase tracking-widest px-3 py-1 rounded-full">Overdue</span>
                        ) : isToday(act.next_followup) ? (
                          <span className="bg-amber-100 text-amber-700 text-[10px] font-black uppercase tracking-widest px-3 py-1 rounded-full">Today</span>
                        ) : null}
                      </div>
                      <p className="text-slate-500 text-sm font-medium mb-3">{act.description}</p>
                      <div className="flex flex-wrap items-center gap-4">
                         <div className="flex items-center gap-2 text-slate-400 bg-slate-50 px-3 py-1.5 rounded-xl border border-slate-100">
                            <ClockIcon className="w-4 h-4" />
                            <span className="text-[10px] font-black uppercase tracking-widest">
                               {act.next_followup ? new Date(act.next_followup).toLocaleString() : 'No time set'}
                            </span>
                         </div>
                         <div className="flex items-center gap-2 text-slate-400">
                            <span className="text-[10px] font-black uppercase tracking-widest">Type: {act.type}</span>
                         </div>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-3 md:border-l md:pl-8 md:border-slate-100">
                    {!act.completed && (
                      <button 
                        onClick={() => handleMarkCompleted(act.id)}
                        className="px-6 py-3 bg-slate-900 text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-emerald-600 transition-all active:scale-95 shadow-lg shadow-slate-200"
                      >
                        Mark Completed
                      </button>
                    )}
                    <a 
                      href={`/worker/lead/${act.lead_id}`}
                      className="px-6 py-3 border border-slate-200 text-slate-500 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-slate-50 transition-all"
                    >
                      View Lead
                    </a>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default FollowUps;