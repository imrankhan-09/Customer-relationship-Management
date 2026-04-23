import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../../api/api';
import StatusBadge from '../../components/common/StatusBadge';
import ActivityTimeline from '../../components/activities/ActivityTimeline';
import { 
  CheckCircleIcon, 
  ArrowLeftIcon, 
  PhoneIcon, 
  EnvelopeIcon, 
  MapPinIcon,
  IdentificationIcon,
  AcademicCapIcon,
  BriefcaseIcon,
  ClockIcon,
  ShoppingBagIcon
} from '@heroicons/react/24/outline';
import OpportunityManager from '../../components/sales/OpportunityManager';

const LeadDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [lead, setLead] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchLeadDetails();
  }, [id]);

  const fetchLeadDetails = async () => {
    try {
      const response = await api.get(`/leads/${id}`);
      let leadData = response.data;
      
      // Parse extra_data if it's a string
      if (typeof leadData.extra_data === 'string') {
        try {
          leadData.extra_data = JSON.parse(leadData.extra_data);
        } catch (e) {
          leadData.extra_data = {};
        }
      }
      
      setLead(leadData);
    } catch (err) {
      console.error('Error fetching lead details:', err);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-40 gap-4">
        <div className="w-12 h-12 border-4 border-blue-600/20 border-t-blue-600 rounded-full animate-spin"></div>
        <p className="text-slate-500 font-bold tracking-widest text-xs uppercase">Fetching Lead Intelligence...</p>
      </div>
    );
  }

  if (!lead) {
    return (
      <div className="text-center py-20">
        <p className="text-slate-500 font-bold">Lead not found or access denied.</p>
        <button onClick={() => navigate(-1)} className="mt-4 text-blue-600 font-bold">Go Back</button>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-500 pb-20">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white/40 backdrop-blur-md p-6 rounded-3xl border border-white/40 shadow-sm">
        <div className="flex items-center gap-4">
          <button 
            onClick={() => navigate(-1)}
            className="p-2 hover:bg-white rounded-xl transition-all text-slate-500 hover:text-blue-600 border border-transparent hover:border-slate-100"
          >
            <ArrowLeftIcon className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-slate-900">{lead.name}</h1>
            <p className="text-slate-500 text-sm font-medium uppercase tracking-widest text-[10px]">{lead.type} Prospect</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
           <StatusBadge status={lead.status} />
           <div className="px-4 py-1.5 bg-slate-100 text-slate-600 rounded-full text-[10px] font-black uppercase tracking-widest border border-slate-200">
              Stage: {lead.pipeline_stage}
           </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-8">
          {/* Main Info Card */}
          <div className="glass-card rounded-3xl p-8">
            <h3 className="text-lg font-bold text-slate-900 mb-8 flex items-center gap-2 border-b pb-4">
               <IdentificationIcon className="w-5 h-5 text-blue-600" />
               Lead Intelligence
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
               <div className="space-y-6">
                  <div className="flex items-center gap-4 group">
                     <div className="p-3 bg-slate-50 text-slate-400 group-hover:bg-blue-50 group-hover:text-blue-600 rounded-2xl transition-all">
                        <PhoneIcon className="w-5 h-5" />
                     </div>
                     <div>
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Phone Number</p>
                        <p className="font-bold text-slate-800">{lead.phone || 'Not Provided'}</p>
                     </div>
                  </div>
                  <div className="flex items-center gap-4 group">
                     <div className="p-3 bg-slate-50 text-slate-400 group-hover:bg-blue-50 group-hover:text-blue-600 rounded-2xl transition-all">
                        <EnvelopeIcon className="w-5 h-5" />
                     </div>
                     <div>
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Email Address</p>
                        <p className="font-bold text-slate-800">{lead.email || 'Not Provided'}</p>
                     </div>
                  </div>
               </div>

               <div className="space-y-6">
                  <div className="flex items-center gap-4 group">
                     <div className="p-3 bg-slate-50 text-slate-400 group-hover:bg-blue-50 group-hover:text-blue-600 rounded-2xl transition-all">
                        <MapPinIcon className="w-5 h-5" />
                     </div>
                     <div>
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Assigned Worker ID</p>
                        <p className="font-bold text-slate-800">Worker #{lead.assigned_to || 'N/A'}</p>
                     </div>
                  </div>
                  <div className="flex items-center gap-4 group">
                     <div className="p-3 bg-slate-50 text-slate-400 group-hover:bg-blue-50 group-hover:text-blue-600 rounded-2xl transition-all">
                        <ClockIcon className="w-5 h-5" />
                     </div>
                     <div>
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Last Updated</p>
                        <p className="font-bold text-slate-800">{new Date(lead.updated_at).toLocaleString()}</p>
                     </div>
                  </div>
               </div>
            </div>

            {/* Extra Data Section */}
            {lead.extra_data && Object.keys(lead.extra_data).length > 0 && (
              <div className="mt-12 space-y-6">
                <h4 className="text-xs font-black text-slate-400 uppercase tracking-[0.2em] border-l-4 border-blue-600 pl-4">Custom Attributes</h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                  {Object.entries(lead.extra_data).map(([key, value]) => (
                    <div key={key} className="p-4 bg-slate-50/50 rounded-2xl border border-slate-100 group hover:bg-white hover:shadow-md transition-all">
                       <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1 group-hover:text-blue-600">{key.replace(/_/g, ' ')}</p>
                       <p className="text-sm font-bold text-slate-700">{typeof value === 'boolean' ? (value ? 'Yes' : 'No') : String(value)}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Notes Section */}
            <div className="mt-12 p-6 bg-amber-50/50 rounded-3xl border border-amber-100">
               <h4 className="text-xs font-black text-amber-700 uppercase tracking-widest mb-4 flex items-center gap-2">
                  <BriefcaseIcon className="w-4 h-4" />
                  Approver & Internal Notes
               </h4>
               <p className="text-slate-700 font-medium text-sm italic">
                  {lead.notes || 'No internal notes added yet.'}
               </p>
            </div>
          </div>

          <ActivityTimeline leadId={id} onActivityLogged={fetchLeadDetails} />
        </div>

        <div className="space-y-8">
           {/* Status Roadmap */}
           <div className="glass-card rounded-3xl p-8">
              <h3 className="font-bold text-slate-900 mb-6 flex items-center gap-2">
                 <ClockIcon className="w-5 h-5 text-indigo-600" />
                 Pipeline Roadmap
              </h3>
              <div className="space-y-6">
                 {[
                   { id: 'new', label: 'Lead Discovered', icon: AcademicCapIcon },
                   { id: 'contacted', label: 'Initial Contact', icon: PhoneIcon },
                   { id: 'demo', label: 'Product Demo', icon: ArrowLeftIcon },
                   { id: 'negotiation', label: 'Negotiation', icon: BriefcaseIcon },
                   { id: 'converted', label: 'Lead Converted', icon: CheckCircleIcon }
                 ].map((stage, idx, arr) => {
                   const isCompleted = arr.findIndex(s => s.id === lead.pipeline_stage) >= idx;
                   const isCurrent = lead.pipeline_stage === stage.id;
                   
                   return (
                     <div key={stage.id} className="flex items-center gap-4 relative">
                        {idx !== arr.length - 1 && (
                          <div className={`absolute left-[15px] top-[30px] w-0.5 h-[30px] ${isCompleted ? 'bg-emerald-500' : 'bg-slate-100'}`}></div>
                        )}
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center z-10 transition-all ${
                          isCompleted ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-100' : 'bg-slate-100 text-slate-400'
                        }`}>
                           {isCompleted ? <CheckCircleIcon className="w-5 h-5" /> : <span className="text-xs font-bold">{idx + 1}</span>}
                        </div>
                        <div className="flex-1">
                           <p className={`text-sm font-bold ${isCurrent ? 'text-indigo-600' : 'text-slate-600'}`}>{stage.label}</p>
                           {isCurrent && <p className="text-[10px] font-black text-indigo-400 uppercase tracking-widest">Active Stage</p>}
                        </div>
                     </div>
                   );
                 })}
              </div>
           </div>

           {/* Opportunity & Product Management */}
           <OpportunityManager leadId={id} leadStatus={lead.status} pipelineStage={lead.pipeline_stage} />
        </div>
      </div>
    </div>
  );
};

export default LeadDetails;