import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../api/api';
import { 
  UserGroupIcon, 
  ArrowLeftIcon,
  CheckCircleIcon,
  ShieldCheckIcon,
  UserIcon,
  ArrowRightIcon,
  ClockIcon
} from '@heroicons/react/24/outline';

const AssignLeads = () => {
  const navigate = useNavigate();
  const [leads, setLeads] = useState([]);
  const [workers, setWorkers] = useState([]);
  const [selectedLeads, setSelectedLeads] = useState([]);
  const [selectedWorker, setSelectedWorker] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isAssigning, setIsAssigning] = useState(false);

  const fetchData = async () => {
    try {
      const [leadsRes, workersRes] = await Promise.all([
        api.get('/leads'),
        api.get('/users?role=worker')
      ]);
      
      // Show all verified leads (approved or assigned)
      const verifiedLeads = leadsRes.data.filter(l => l.status === 'approved' || l.status === 'assigned');
      setLeads(verifiedLeads);
      setWorkers(workersRes.data);
    } catch (err) {
      console.error('Error fetching assignment data:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 30000);
    return () => clearInterval(interval);
  }, []);

  const toggleLead = (lead) => {
    if (lead.status === 'assigned') return; // Prevent toggling assigned leads
    
    setSelectedLeads(prev => 
      prev.includes(lead.id) ? prev.filter(l => l !== lead.id) : [...prev, lead.id]
    );
  };

  const handleAssign = async () => {
    if (selectedLeads.length === 0 || !selectedWorker) return;
    
    setIsAssigning(true);
    try {
      // Assign each lead sequentially or via Promise.all
      await Promise.all(selectedLeads.map(leadId => 
        api.put(`/leads/${leadId}`, { assigned_to: selectedWorker })
      ));
      
      setSelectedLeads([]);
      setSelectedWorker('');
      await fetchData(); // Refresh
      alert('Leads assigned successfully!');
    } catch (err) {
      console.error('Error assigning leads:', err);
      alert('Failed to assign leads.');
    } finally {
      setIsAssigning(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-40 gap-4">
        <div className="w-12 h-12 border-4 border-blue-600/20 border-t-blue-600 rounded-full animate-spin"></div>
        <p className="text-slate-500 font-bold tracking-widest text-xs uppercase">Loading Assignment Portal...</p>
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
            <h1 className="text-2xl font-bold text-slate-900">Lead Assignment</h1>
            <p className="text-slate-500 text-sm font-medium">Distribute verified leads to workers</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Leads Selection */}
        <div className="lg:col-span-2 glass-card rounded-3xl p-8">
           <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-bold text-slate-900">Verified Repository</h3>
              <span className="text-xs font-black text-slate-400 uppercase tracking-widest">{leads.length} Records</span>
           </div>
           
           <div className="space-y-3 max-h-[600px] overflow-y-auto pr-2">
             {leads.map(lead => (
               <div 
                 key={lead.id} 
                 onClick={() => toggleLead(lead)}
                 className={`flex items-center gap-4 p-4 rounded-2xl border-2 transition-all ${
                   lead.status === 'assigned'
                     ? 'border-slate-100 bg-slate-50/50 opacity-70 cursor-not-allowed'
                     : selectedLeads.includes(lead.id) 
                       ? 'border-blue-600 bg-blue-50/50 cursor-pointer' 
                       : 'border-slate-100 bg-white hover:border-slate-200 cursor-pointer'
                 }`}
               >
                 <div className={`w-6 h-6 rounded-lg border-2 flex items-center justify-center transition-all ${
                   lead.status === 'assigned'
                     ? 'bg-slate-200 border-slate-200'
                     : selectedLeads.includes(lead.id) ? 'bg-blue-600 border-blue-600' : 'border-slate-200'
                 }`}>
                   {lead.status === 'assigned' ? (
                      <UserGroupIcon className="w-4 h-4 text-slate-500" />
                   ) : (
                      selectedLeads.includes(lead.id) && <CheckCircleIcon className="w-4 h-4 text-white" />
                   )}
                 </div>
                 <div className="flex-1">
                   <p className="font-bold text-slate-900">{lead.name}</p>
                   <p className="text-xs text-slate-500 font-medium uppercase tracking-wider">{lead.type} Category</p>
                 </div>
                 <div className="text-right">
                    <p className={`text-[10px] font-black uppercase tracking-widest ${
                       lead.status === 'assigned' ? 'text-indigo-600' : 'text-emerald-600'
                    }`}>
                       {lead.status === 'assigned' ? 'Assigned' : 'Approved'}
                    </p>
                    <p className="text-[10px] text-slate-400 font-bold">{new Date(lead.updated_at).toLocaleDateString()}</p>
                 </div>
               </div>
             ))}
             {leads.length === 0 && (
               <div className="text-center py-20 bg-slate-50/50 rounded-3xl border border-dashed border-slate-200">
                  <ShieldCheckIcon className="w-12 h-12 text-slate-300 mx-auto mb-4" />
                  <p className="text-slate-500 font-bold">No verified leads available.</p>
               </div>
             )}
           </div>
        </div>

        {/* Worker Selection */}
        <div className="space-y-8">
          <div className="glass-card rounded-3xl p-8">
             <h3 className="text-lg font-bold text-slate-900 mb-6 flex items-center gap-2">
                <UserGroupIcon className="w-5 h-5 text-blue-600" />
                Select Worker
             </h3>
             <div className="space-y-3">
                {workers.map(worker => (
                  <label 
                    key={worker.id} 
                    className={`flex items-center justify-between p-4 rounded-2xl border-2 transition-all cursor-pointer ${
                      selectedWorker === worker.id 
                        ? 'border-emerald-600 bg-emerald-50/50' 
                        : 'border-slate-100 bg-white hover:border-slate-200'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <input 
                        type="radio" 
                        name="worker" 
                        value={worker.id} 
                        checked={selectedWorker === worker.id} 
                        onChange={e => setSelectedWorker(Number(e.target.value))} 
                        className="hidden" 
                      />
                      <div className={`p-2 rounded-lg ${selectedWorker === worker.id ? 'bg-emerald-600 text-white' : 'bg-slate-100 text-slate-400'}`}>
                         <UserIcon className="w-5 h-5" />
                      </div>
                      <span className={`font-bold ${selectedWorker === worker.id ? 'text-emerald-900' : 'text-slate-700'}`}>{worker.name}</span>
                    </div>
                    {selectedWorker === worker.id && <CheckCircleIcon className="w-5 h-5 text-emerald-600" />}
                  </label>
                ))}
                {workers.length === 0 && (
                  <p className="text-center py-8 text-slate-500 font-medium italic">No active workers found.</p>
                )}
             </div>

             <button 
               onClick={handleAssign} 
               disabled={selectedLeads.length === 0 || !selectedWorker || isAssigning} 
               className="mt-8 w-full bg-blue-600 text-white py-4 rounded-2xl font-black shadow-lg shadow-blue-100 hover:bg-blue-700 hover:shadow-blue-200 transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
             >
               {isAssigning ? (
                 <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
               ) : (
                 <>
                   <span>Assign {selectedLeads.length} Lead{selectedLeads.length !== 1 ? 's' : ''}</span>
                   <ArrowRightIcon className="w-5 h-5" />
                 </>
               )}
             </button>
          </div>

          <div className="p-6 bg-amber-50 border border-amber-100 rounded-3xl">
             <div className="flex items-center gap-3 text-amber-700 mb-2 font-bold">
                <ClockIcon className="w-5 h-5" />
                Assignment Logic
             </div>
             <p className="text-xs text-amber-600 font-medium leading-relaxed">
               Assigned leads will appear in the worker's "Assigned Leads" queue immediately. 
               Workers are notified and can begin follow-up actions once assigned.
             </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AssignLeads;