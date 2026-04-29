import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../api/api';
import { PIPELINE_STAGES } from '../../utils/pipelineConstants';
import { 
  UserIcon, 
  CurrencyDollarIcon, 
  ClockIcon,
  ChevronRightIcon,
  HandRaisedIcon
} from '@heroicons/react/24/outline';
import { useNotification } from '../../context/NotificationContext';

const LeadKanban = () => {
  const [leads, setLeads] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [draggedLead, setDraggedLead] = useState(null);
  const navigate = useNavigate();
  const { showSuccess, showError } = useNotification();

  const fetchLeads = async () => {
    try {
      const response = await api.get('/leads');
      // Only show approved/assigned leads in the sales pipeline
      const salesLeads = response.data.filter(l => l.status === 'approved' || l.status === 'assigned');
      setLeads(salesLeads);
    } catch (err) {
      console.error('Error fetching leads:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchLeads();
  }, []);

  const handleDragStart = (lead) => {
    setDraggedLead(lead);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
  };

  const handleDrop = async (e, targetStage) => {
    e.preventDefault();
    if (!draggedLead || draggedLead.pipeline_stage === targetStage) return;

    // Store old stage for optimistic rollback if needed
    const oldStage = draggedLead.pipeline_stage;
    const leadId = draggedLead.id;

    // Optimistic Update
    setLeads(prev => prev.map(l => 
      l.id === leadId ? { ...l, pipeline_stage: targetStage } : l
    ));

    try {
      await api.put(`/leads/${leadId}`, { pipeline_stage: targetStage });
      showSuccess(`Lead moved to ${targetStage.toUpperCase()}`);
    } catch (err) {
      console.error('Error updating stage:', err);
      showError('Failed to update stage');
      // Rollback
      setLeads(prev => prev.map(l => 
        l.id === leadId ? { ...l, pipeline_stage: oldStage } : l
      ));
    } finally {
      setDraggedLead(null);
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center py-20">
        <div className="w-10 h-10 border-4 border-blue-600/20 border-t-blue-600 rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto pb-6">
      <div className="flex gap-6 min-w-max p-2">
        {PIPELINE_STAGES.map((stage) => {
          const stageLeads = leads.filter(l => l.pipeline_stage === stage.id || (stage.id === 'new' && !l.pipeline_stage));
          
          return (
            <div 
              key={stage.id} 
              className="w-80 flex flex-col"
              onDragOver={handleDragOver}
              onDrop={(e) => handleDrop(e, stage.id)}
            >
              {/* Stage Header */}
              <div className="flex items-center justify-between mb-4 px-2">
                <div className="flex items-center gap-2">
                  <div className={`w-2.5 h-2.5 rounded-full ${stage.color}`}></div>
                  <h3 className="font-bold text-slate-800 text-sm uppercase tracking-wider">{stage.label}</h3>
                </div>
                <span className="px-2 py-0.5 bg-slate-100 text-slate-500 rounded-lg text-[10px] font-black">
                  {stageLeads.length}
                </span>
              </div>

              {/* Column Content */}
              <div className={`flex-1 min-h-[500px] rounded-[2rem] p-3 transition-all ${
                draggedLead ? 'bg-slate-100/50 ring-2 ring-dashed ring-slate-200' : 'bg-slate-50/50'
              }`}>
                <div className="space-y-3">
                  {stageLeads.map((lead) => (
                    <div 
                      key={lead.id}
                      draggable
                      onDragStart={() => handleDragStart(lead)}
                      onClick={() => navigate(`/leads/${lead.id}`)}
                      className="bg-white p-4 rounded-2xl shadow-sm border border-slate-100 hover:shadow-md hover:border-blue-200 transition-all cursor-grab active:cursor-grabbing group"
                    >
                      <div className="flex justify-between items-start mb-3">
                        <div className="p-2 bg-blue-50 text-blue-600 rounded-xl group-hover:bg-blue-600 group-hover:text-white transition-all">
                          <UserIcon className="w-4 h-4" />
                        </div>
                        <ChevronRightIcon className="w-4 h-4 text-slate-300 group-hover:text-blue-500 transition-all" />
                      </div>
                      
                      <h4 className="font-bold text-slate-900 text-sm mb-1">{lead.name}</h4>
                      <p className="text-[10px] text-slate-500 font-medium mb-4">{lead.type.toUpperCase()}</p>
                      
                      <div className="flex items-center justify-between pt-3 border-t border-slate-50">
                        <div className="flex items-center gap-1.5">
                           <CurrencyDollarIcon className="w-3.5 h-3.5 text-emerald-500" />
                           <span className="text-xs font-black text-slate-700">
                             ${parseFloat(lead.opportunity_value || 0).toLocaleString()}
                           </span>
                        </div>
                        <div className="flex items-center gap-1.5 text-slate-400">
                           <ClockIcon className="w-3.5 h-3.5" />
                           <span className="text-[10px] font-bold">
                             {new Date(lead.updated_at).toLocaleDateString()}
                           </span>
                        </div>
                      </div>
                    </div>
                  ))}
                  
                  {stageLeads.length === 0 && !draggedLead && (
                    <div className="flex flex-col items-center justify-center py-10 text-slate-300">
                       <HandRaisedIcon className="w-8 h-8 mb-2 opacity-20" />
                       <p className="text-[10px] font-bold uppercase tracking-widest">Empty Stage</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default LeadKanban;
