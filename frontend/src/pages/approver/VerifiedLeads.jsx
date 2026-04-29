import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../api/api';
import { 
  ShieldCheckIcon, 
  ArrowLeftIcon,
  MagnifyingGlassIcon,
  FunnelIcon,
  UserIcon,
  PhoneIcon,
  EnvelopeIcon,
  EyeIcon,
  CheckBadgeIcon,
  ArrowTrendingUpIcon
} from '@heroicons/react/24/outline';

const ApprovedLeads = () => {
  const navigate = useNavigate();
  const [leads, setLeads] = useState([]);
  const [filteredLeads, setFilteredLeads] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterType, setFilterType] = useState('all');

  const fetchLeads = async () => {
    try {
      const response = await api.get('/leads');
      // Filter only approved/converted leads for this page
      const approvedLeads = response.data.filter(l => l.status === 'approved' || l.status === 'assigned' || l.status === 'converted');
      setLeads(approvedLeads);
      setFilteredLeads(approvedLeads);
    } catch (err) {
      console.error('Error fetching approved leads:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchLeads();
  }, []);

  useEffect(() => {
    let result = leads;
    if (search) {
      result = result.filter(l => 
        l.name.toLowerCase().includes(search.toLowerCase()) || 
        l.email?.toLowerCase().includes(search.toLowerCase())
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
            <h1 className="text-2xl font-bold text-slate-900">Approved Repository</h1>
            <p className="text-slate-500 text-sm font-medium">Archive of all approved and converted leads</p>
          </div>
        </div>
        <div className="px-5 py-2 bg-emerald-50 text-emerald-700 rounded-2xl border border-emerald-100 font-bold text-sm flex items-center gap-2">
          <CheckBadgeIcon className="w-5 h-5" />
          {leads.length} Records Approved
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
            placeholder="Search repository..."
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

      {/* Data Table */}
      <div className="glass-card rounded-3xl overflow-hidden">
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-20 gap-4">
            <div className="w-12 h-12 border-4 border-emerald-600/20 border-t-emerald-600 rounded-full animate-spin"></div>
            <p className="text-slate-500 font-bold tracking-widest text-xs uppercase">Loading Repository...</p>
          </div>
        ) : filteredLeads.length === 0 ? (
          <div className="p-20 text-center text-slate-500 font-medium italic">
            No approved leads found in the repository.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50/50 border-b border-slate-100">
                  <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Approved Lead</th>
                  <th className="px-6 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Type</th>
                  <th className="px-6 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Contact</th>
                  <th className="px-6 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Status</th>
                  <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {filteredLeads.map((lead) => (
                  <tr key={lead.id} className="hover:bg-slate-50/30 transition-colors">
                    <td className="px-8 py-6 font-bold text-slate-900">{lead.name}</td>
                    <td className="px-6 py-6 font-medium text-slate-600 capitalize">{lead.type}</td>
                    <td className="px-6 py-6">
                       <div className="text-xs text-slate-500 space-y-1">
                          <p className="flex items-center gap-1.5 font-bold"><PhoneIcon className="w-3 h-3"/> {lead.phone || 'N/A'}</p>
                          <p className="flex items-center gap-1.5"><EnvelopeIcon className="w-3 h-3"/> {lead.email || 'N/A'}</p>
                       </div>
                    </td>
                    <td className="px-6 py-6">
                       <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider ${
                         lead.status === 'converted' ? 'bg-blue-100 text-blue-700' : 'bg-emerald-100 text-emerald-700'
                       }`}>
                          {lead.status}
                       </span>
                    </td>
                    <td className="px-8 py-6 text-right">
                       <button 
                         onClick={() => navigate(`/approver/track-lead/${lead.id}`)}
                         className="px-4 py-2 bg-slate-900 text-white rounded-xl hover:bg-blue-600 transition-all text-[10px] font-black uppercase tracking-widest flex items-center gap-2 shadow-lg shadow-slate-200 ml-auto"
                       >
                          <ArrowTrendingUpIcon className="w-3.5 h-3.5" />
                          Track
                       </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default ApprovedLeads;