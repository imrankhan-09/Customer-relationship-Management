import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../../api/api';
import { useAuth } from '../../context/AuthProvider';
import { 
  PhoneIcon, 
  CalendarIcon, 
  UserIcon, 
  ArrowRightIcon, 
  ClockIcon,
  MagnifyingGlassIcon
} from '@heroicons/react/24/outline';

const AssignedLeads = () => {
  const { user } = useAuth();
  const [leads, setLeads] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');

  const fetchLeads = async () => {
    try {
      const response = await api.get('/leads');
      // Filter leads assigned to this specific worker
      const myLeads = response.data.filter(l => Number(l.assigned_to) === Number(user?.id));
      setLeads(myLeads);
    } catch (err) {
      console.error('Error fetching worker leads:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchLeads();
    // Refresh every 30 seconds for real-time feel
    const interval = setInterval(fetchLeads, 30000);
    return () => clearInterval(interval);
  }, [user?.id]);

  const filteredLeads = leads.filter(l => 
    l.name.toLowerCase().includes(search.toLowerCase()) ||
    l.type.toLowerCase().includes(search.toLowerCase())
  );

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-40 gap-4">
        <div className="w-12 h-12 border-4 border-blue-600/20 border-t-blue-600 rounded-full animate-spin"></div>
        <p className="text-slate-500 font-bold tracking-widest text-xs uppercase italic">Syncing assigned records...</p>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white/40 backdrop-blur-md p-6 rounded-3xl border border-white/40 shadow-sm">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">My Assignments</h1>
          <p className="text-slate-500 text-sm font-medium">Manage and process leads assigned to you</p>
        </div>
        <div className="relative group w-full md:w-80">
          <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400 group-focus-within:text-blue-600 transition-colors">
            <MagnifyingGlassIcon className="w-5 h-5" />
          </div>
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-11 pr-4 py-3 bg-white border border-slate-200 rounded-2xl outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all"
            placeholder="Search assignments..."
          />
        </div>
      </div>

      {filteredLeads.length === 0 ? (
        <div className="glass-card rounded-3xl p-20 text-center space-y-4">
           <div className="w-16 h-16 bg-slate-100 rounded-2xl flex items-center justify-center mx-auto text-slate-400">
              <ClockIcon className="w-8 h-8" />
           </div>
           <div>
              <h3 className="text-xl font-bold text-slate-900">No Assignments Yet</h3>
              <p className="text-slate-500 max-w-sm mx-auto mt-2">You don't have any leads assigned to you at the moment. New leads will appear here automatically.</p>
           </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredLeads.map(lead => (
            <div key={lead.id} className="glass-card rounded-3xl p-6 hover:shadow-xl transition-all border border-white/40 group relative overflow-hidden">
              <div className="absolute top-0 right-0 p-4">
                 <span className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-[10px] font-black uppercase tracking-wider">
                    {lead.pipeline_stage}
                 </span>
              </div>
              
              <div className="flex items-center gap-4 mb-6">
                <div className="p-3 bg-blue-50 text-blue-600 rounded-2xl group-hover:bg-blue-600 group-hover:text-white transition-all">
                  <UserIcon className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="font-black text-slate-900 text-lg leading-tight group-hover:text-blue-600 transition-colors">{lead.name}</h3>
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{lead.type}</p>
                </div>
              </div>

              <div className="space-y-3 mb-8">
                <div className="flex items-center gap-3 text-slate-600 text-sm font-bold">
                  <PhoneIcon className="w-4 h-4 text-slate-400" />
                  {lead.phone || 'N/A'}
                </div>
                <div className="flex items-center gap-3 text-slate-600 text-sm font-bold">
                   <CalendarIcon className="w-4 h-4 text-slate-400" />
                   Assigned: {new Date(lead.updated_at).toLocaleDateString()}
                </div>
              </div>

              <Link 
                to={`/worker/lead/${lead.id}`} 
                className="w-full flex items-center justify-center gap-2 bg-slate-900 text-white py-3.5 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-blue-600 transition-all active:scale-95 shadow-lg shadow-slate-200"
              >
                Start Processing
                <ArrowRightIcon className="w-4 h-4" />
              </Link>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default AssignedLeads;