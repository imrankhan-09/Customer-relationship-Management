import React, { useState, useEffect } from 'react';
import api from '../../api/api';
import { getStageLabel } from '../../utils/pipelineConstants';
import { ClockIcon, BoltIcon } from '@heroicons/react/24/outline';

const PipelineAnalytics = () => {
  const [velocity, setVelocity] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchAnalytics = async () => {
      try {
        const response = await api.get('/leads/analytics/velocity');
        setVelocity(response.data);
      } catch (err) {
        console.error('Error fetching velocity analytics:', err);
      } finally {
        setIsLoading(false);
      }
    };
    fetchAnalytics();
  }, []);

  if (isLoading) return null;

  return (
    <div className="bg-white/60 backdrop-blur-md rounded-[2.5rem] p-8 border border-white/80 shadow-sm h-full">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h3 className="text-xl font-black text-slate-900">Sales Velocity</h3>
          <p className="text-slate-400 text-[10px] font-black uppercase tracking-widest mt-1">Avg. Time Spent Per Stage</p>
        </div>
        <BoltIcon className="w-6 h-6 text-indigo-500" />
      </div>

      <div className="space-y-6">
        {velocity.map((item) => {
          const days = Math.floor(item.avg_duration / 86400);
          const hours = Math.floor((item.avg_duration % 86400) / 3600);
          
          return (
            <div key={item.stage} className="relative">
              <div className="flex justify-between items-center mb-2">
                <span className="text-xs font-black text-slate-700 uppercase tracking-wider">
                  {getStageLabel(item.stage)}
                </span>
                <span className="text-[10px] font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full">
                  {item.total_occurrences} Leads
                </span>
              </div>
              <div className="flex items-center gap-3">
                <div className="flex-1 h-2 bg-slate-100 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-indigo-500 transition-all duration-1000" 
                    style={{ width: `${Math.min((item.avg_duration / (86400 * 7)) * 100, 100)}%` }}
                  ></div>
                </div>
                <span className="text-xs font-black text-slate-900 min-w-[60px] text-right">
                  {days > 0 ? `${days}d ` : ''}{hours}h
                </span>
              </div>
            </div>
          );
        })}
        
        {velocity.length === 0 && (
          <div className="py-10 text-center">
             <ClockIcon className="w-10 h-10 text-slate-200 mx-auto mb-3" />
             <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Collecting Velocity Data...</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default PipelineAnalytics;
