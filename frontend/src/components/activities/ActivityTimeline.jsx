import React, { useState, useEffect } from 'react';
import api from '../../api/api';
import ActivityItem from './ActivityItem';
import AddActivityModal from './AddActivityModal';
import { PlusIcon, ClockIcon } from '@heroicons/react/24/outline';

const ActivityTimeline = ({ leadId, onActivityLogged }) => {
  const [showModal, setShowModal] = useState(false);
  const [activities, setActivities] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchActivities = async () => {
    try {
      const response = await api.get(`/activities/lead/${leadId}`);
      setActivities(response.data);
    } catch (err) {
      console.error('Error fetching activities:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchActivities();
  }, [leadId]);

  const handleActivityAdded = () => {
    fetchActivities();
    if (onActivityLogged) onActivityLogged();
  };

  return (
    <div className="glass-card rounded-3xl p-8 border border-white/40 shadow-sm relative overflow-hidden">
      <div className="absolute top-0 right-0 p-8 opacity-10 pointer-events-none">
         <ClockIcon className="w-24 h-24 text-slate-900" />
      </div>
      
      <div className="flex justify-between items-center mb-8 relative z-10">
        <div>
          <h3 className="text-xl font-bold text-slate-900">Activity Timeline</h3>
          <p className="text-slate-500 text-[10px] font-black uppercase tracking-widest">History of engagements</p>
        </div>
        <button 
          onClick={() => setShowModal(true)} 
          className="flex items-center gap-2 px-4 py-2 bg-slate-900 text-white rounded-xl text-xs font-black uppercase tracking-widest hover:bg-blue-600 transition-all active:scale-95 shadow-lg shadow-slate-200"
        >
          <PlusIcon className="w-4 h-4" /> Add Activity
        </button>
      </div>

      <div className="space-y-6 relative z-10">
        {isLoading ? (
          <div className="flex justify-center py-10">
             <div className="w-6 h-6 border-2 border-blue-600/20 border-t-blue-600 rounded-full animate-spin"></div>
          </div>
        ) : activities.length === 0 ? (
          <div className="text-center py-10 bg-slate-50/50 rounded-2xl border border-dashed border-slate-200">
             <p className="text-slate-400 text-sm font-bold">No activities logged yet.</p>
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
      
      <AddActivityModal 
        isOpen={showModal} 
        onClose={() => setShowModal(false)} 
        onSuccess={handleActivityAdded}
        leadId={leadId} 
      />
    </div>
  );
};

export default ActivityTimeline;