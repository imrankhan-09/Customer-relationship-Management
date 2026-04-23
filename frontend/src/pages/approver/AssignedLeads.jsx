import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../api/api';
import { 
  UserGroupIcon, 
  ArrowLeftIcon,
  MagnifyingGlassIcon,
  FunnelIcon,
  UserIcon,
  PhoneIcon,
  EnvelopeIcon,
  ClockIcon,
  CheckBadgeIcon,
  ArrowTrendingUpIcon
} from '@heroicons/react/24/outline';

const AssignedLeads = () => {
  const navigate = useNavigate();
  const [leads, setLeads] = useState([]);
  const [filteredLeads, setFilteredLeads] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterType, setFilterType] = useState('all');

  const fetchLeads = async () => {
    try {
      const response = await api.get('/leads');
      // Filter only leads that are assigned
      const assignedLeads = response.data.filter(l => l.status === 'assigned');
      setLeads(assignedLeads);
      setFilteredLeads(assignedLeads);
    } catch (err) {
      console.error('Error fetching assigned leads:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchLeads();
    // Real-time sync every 30 seconds
    const interval = setInterval(fetchLeads, 30000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    let result = leads;
    if (search) {
      result = result.filter(l => 
        l.name.toLowerCase().includes(search.toLowerCase()) || 
        l.email?.toLowerCase().includes(search.toLowerCase()) ||
        l.phone?.includes(search)
      );
    }
    if (filterType !== 'all') {
      result = result.filter(l => l.type === filterType);
    }
    setFilteredLeads(result);
  }, [search, filterType, leads]);

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
            <h1 className="text-2xl font-bold text-slate-900">Assigned Leads</h1>
            <p className="text-slate-500 text-sm font-medium">Tracking all leads currently with workers</p>
          </div>
        </div>
        <div className="px-5 py-2 bg-indigo-50 text-indigo-700 rounded-2xl border border-indigo-100 font-bold text-sm flex items-center gap-2">
          <UserGroupIcon className="w-5 h-5" />
          {leads.length} Active Assignments
        </div>
      </div>

      {/* Filters */}
      <div className="glass-card rounded-3xl p-6 flex flex-col md:flex-row gap-4 items-center">
        <div className="relative flex-1 group">
          <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400 group-focus-within:text-blue-600 transition-colors">
            <MagnifyingGlassIcon className="w-5 h-5" />
          </div>
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-11 pr-4 py-3 bg-slate-50/50 border border-slate-200 rounded-2xl outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all"
            placeholder="Search assigned leads..."
          />
        </div>
        <div className="relative w-full md:w-64 group">
          <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400 group-focus-within:text-blue-600 transition-colors">
            <FunnelIcon className="w-5 h-5" />
          </div>
          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            className="w-full pl-11 pr-4 py-3 bg-slate-50/50 border border-slate-200 rounded-2xl outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all appearance-none cursor-pointer"
          >
            <option value="all">All Categories</option>
            <option value="doctor">Doctors</option>
            <option value="patient">Patients</option>
            <option value="lab">Labs</option>
            <option value="pharmacy">Pharmacies</option>
            <option value="hospital">Hospitals</option>
          </select>
        </div>
      </div>

      {/* Data List */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {isLoading ? (
          <div className="col-span-full flex flex-col items-center justify-center py-20 gap-4">
            <div className="w-12 h-12 border-4 border-indigo-600/20 border-t-indigo-600 rounded-full animate-spin"></div>
            <p className="text-slate-500 font-bold tracking-widest text-xs uppercase">Loading Assignment Data...</p>
          </div>
        ) : filteredLeads.length === 0 ? (
          <div className="col-span-full p-20 text-center glass-card rounded-3xl border border-dashed border-slate-200 text-slate-500 font-medium italic">
            No assigned leads found matching your criteria.
          </div>
        ) : (
          filteredLeads.map((lead) => (
            <div key={lead.id} className="glass-card rounded-3xl p-6 hover:shadow-xl transition-all border border-white/40 group">
               <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-4">
                     <div className="p-3 bg-indigo-50 text-indigo-600 rounded-2xl group-hover:bg-indigo-600 group-hover:text-white transition-all">
                        <UserIcon className="w-6 h-6" />
                     </div>
                     <div>
                        <h3 className="font-black text-slate-900 text-lg leading-tight">{lead.name}</h3>
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{lead.type}</p>
                     </div>
                  </div>
                  <div className="flex flex-col items-end">
                     <span className="px-3 py-1 bg-indigo-100 text-indigo-700 rounded-full text-[10px] font-black uppercase tracking-wider mb-1">
                        Assigned
                     </span>
                     <span className="text-[10px] font-bold text-slate-400 flex items-center gap-1">
                        <ClockIcon className="w-3 h-3" />
                        {new Date(lead.updated_at).toLocaleDateString()}
                     </span>
                  </div>
               </div>
               
               <div className="grid grid-cols-2 gap-4 mb-6">
                  <div className="p-3 bg-slate-50/50 rounded-2xl border border-slate-100">
                     <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Worker</p>
                     <p className="text-xs font-bold text-slate-700 truncate">{lead.assigned_worker_name || 'Assigned to Agent'}</p>
                  </div>
                  <div className="p-3 bg-slate-50/50 rounded-2xl border border-slate-100">
                     <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Pipeline</p>
                     <p className="text-xs font-bold text-slate-700 capitalize">{lead.pipeline_stage}</p>
                  </div>
               </div>

                <div className="flex items-center justify-between pt-4 border-t border-slate-50">
                   <div className="flex items-center gap-4">
                      <div className="flex items-center gap-1.5 text-slate-500 text-xs font-bold">
                         <PhoneIcon className="w-3.5 h-3.5 text-slate-400" />
                         {lead.phone || 'N/A'}
                      </div>
                      <div className="flex items-center gap-1.5 text-slate-500 text-xs font-bold">
                         <EnvelopeIcon className="w-3.5 h-3.5 text-slate-400" />
                         <span className="max-w-[100px] truncate">{lead.email || 'N/A'}</span>
                      </div>
                   </div>
                   <button 
                     onClick={() => navigate(`/approver/track-lead/${lead.id}`)}
                     className="px-4 py-2 bg-slate-900 text-white rounded-xl hover:bg-blue-600 transition-all text-[10px] font-black uppercase tracking-widest flex items-center gap-2 shadow-lg shadow-slate-200"
                   >
                      <ArrowTrendingUpIcon className="w-3.5 h-3.5" />
                      Track Journey
                   </button>
                </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default AssignedLeads;
