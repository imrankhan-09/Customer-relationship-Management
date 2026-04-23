import React from 'react';
import { PhoneIcon, VideoCameraIcon, CalendarIcon, EnvelopeIcon, CheckCircleIcon, ClockIcon } from '@heroicons/react/24/outline';

const iconMap = {
  Call: PhoneIcon,
  Meeting: VideoCameraIcon,
  'Follow-up': CalendarIcon,
  Visit: EnvelopeIcon,
};

const ActivityItem = ({ activity }) => {
  const Icon = iconMap[activity.type] || CalendarIcon;
  return (
    <div className="flex gap-4 relative">
      <div className="flex flex-col items-center">
         <div className={`p-3 rounded-2xl relative z-10 ${activity.completed ? 'bg-emerald-100 text-emerald-600' : 'bg-blue-100 text-blue-600'}`}>
           <Icon className="w-5 h-5" />
         </div>
         <div className="w-px flex-1 bg-slate-100 my-2"></div>
      </div>
      
      <div className="flex-1 pb-8">
        <div className="flex justify-between items-start mb-1">
          <div className="flex items-center gap-3">
             <p className="font-bold text-slate-900">{activity.type}</p>
             {activity.completed ? (
                <span className="flex items-center gap-1 text-[10px] font-black uppercase tracking-widest text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-100">
                   <CheckCircleIcon className="w-3 h-3" /> Completed
                </span>
             ) : (
                <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 bg-slate-50 px-2 py-0.5 rounded-md border border-slate-100">
                   Pending
                </span>
             )}
          </div>
          <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">{activity.date}</span>
        </div>
        <p className="text-sm text-slate-600 font-medium mb-2">{activity.description}</p>
        
        {activity.next_followup && (
           <div className="flex items-center gap-2 text-indigo-600 bg-indigo-50/50 w-fit px-3 py-1 rounded-lg border border-indigo-100 mb-2">
              <ClockIcon className="w-3 h-3" />
              <span className="text-[10px] font-bold uppercase tracking-widest">Next: {new Date(activity.next_followup).toLocaleString()}</span>
           </div>
        )}
        
        <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">by {activity.user}</p>
      </div>
    </div>
  );
};

export default ActivityItem;