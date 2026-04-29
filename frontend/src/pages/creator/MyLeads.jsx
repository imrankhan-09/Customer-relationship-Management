import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import api from '../../api/api';
import { 
  MagnifyingGlassIcon, 
  FunnelIcon, 
  PlusIcon,
  PhoneIcon,
  EnvelopeIcon,
  ChevronRightIcon,
  InformationCircleIcon,
  TrashIcon,
  BriefcaseIcon
} from '@heroicons/react/24/outline';


const MyLeads = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [leads, setLeads] = useState([]);
  const [filteredLeads, setFilteredLeads] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterType, setFilterType] = useState('all');
  const [filterStatus, setFilterStatus] = useState(searchParams.get('status') || 'all');
  const [selectedLead, setSelectedLead] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => {
    fetchLeads();
    // Add polling for real-time status updates (every 30 seconds)
    const interval = setInterval(() => fetchLeads(true), 30000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const status = searchParams.get('status');
    if (status) setFilterStatus(status);
  }, [searchParams]);

  useEffect(() => {
    filterLeads();
  }, [search, filterType, filterStatus, leads]);

  const fetchLeads = async (isPoll = false) => {
    try {
      const response = await api.get('/leads');
      console.log('Fetched Leads:', response.data);
      setLeads(response.data);
    } catch (err) {
      console.error('Error fetching leads:', err);
    } finally {
      if (!isPoll) setIsLoading(false);
    }
  };

  const filterLeads = () => {
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
    if (filterStatus !== 'all') {
      result = result.filter(l => l.status === filterStatus);
    }
    setFilteredLeads(result);
  };

  const openLeadDetails = (lead) => {
    // Defensive parsing for extra_data
    let parsedExtra = lead.extra_data;
    if (typeof parsedExtra === 'string') {
      try {
        parsedExtra = JSON.parse(parsedExtra);
      } catch (e) {
        console.error('Error parsing extra_data string:', e);
        parsedExtra = {};
      }
    }
    setSelectedLead({ ...lead, extra_data: parsedExtra || {} });
    setIsModalOpen(true);
  };


  const handleDelete = async (e, id) => {
    e.stopPropagation(); // Prevent opening the modal
    if (window.confirm('Are you sure you want to delete this lead?')) {
      try {
        await api.delete(`/leads/${id}`);
        setLeads(leads.filter(l => l.id !== id));
        if (selectedLead?.id === id) setIsModalOpen(false);
      } catch (err) {
        console.error('Error deleting lead:', err);
        alert('Failed to delete lead.');
      }
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'pending': return 'bg-amber-100 text-amber-700 border-amber-200';
      case 'approved': return 'bg-emerald-100 text-emerald-700 border-emerald-200';
      case 'assigned': return 'bg-indigo-100 text-indigo-700 border-indigo-200';
      case 'rejected': return 'bg-rose-100 text-rose-700 border-rose-200';
      case 'converted': return 'bg-blue-100 text-blue-700 border-blue-200';
      default: return 'bg-slate-100 text-slate-700 border-slate-200';
    }
  };

  const getTypeIcon = (type, large = false) => {
    const size = large ? "w-12 h-12 text-xl" : "p-2 text-xs";
    switch (type) {
      case 'doctor': return <span className={`${size} bg-blue-100 text-blue-600 rounded-xl flex items-center justify-center font-bold`}>DR</span>;
      case 'patient': return <span className={`${size} bg-indigo-100 text-indigo-600 rounded-xl flex items-center justify-center font-bold`}>PT</span>;
      case 'lab': return <span className={`${size} bg-purple-100 text-purple-600 rounded-xl flex items-center justify-center font-bold`}>LB</span>;
      case 'pharmacy': return <span className={`${size} bg-emerald-100 text-emerald-600 rounded-xl flex items-center justify-center font-bold`}>PH</span>;
      case 'hospital': return <span className={`${size} bg-rose-100 text-rose-600 rounded-xl flex items-center justify-center font-bold`}>HS</span>;
      default: return <span className={`${size} bg-slate-100 text-slate-600 rounded-xl flex items-center justify-center font-bold`}>LD</span>;
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500 pb-12">
      {/* Lead Details Modal */}
      {isModalOpen && selectedLead && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6">
          <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={() => setIsModalOpen(false)}></div>
          <div className="relative w-full max-w-3xl bg-white rounded-3xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200 flex flex-col max-h-[90vh]">
            {/* Modal Header */}
            <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
              <div className="flex items-center gap-4">
                {getTypeIcon(selectedLead.type, true)}
                <div>
                  <h2 className="text-2xl font-black text-slate-900">{selectedLead.name}</h2>
                  <p className="text-slate-500 font-bold uppercase tracking-wider text-xs">{selectedLead.type} Lead</p>
                </div>
              </div>
              <button 
                onClick={() => setIsModalOpen(false)}
                className="p-2 hover:bg-white rounded-xl transition-all text-slate-400 hover:text-rose-500 border border-transparent hover:border-slate-100 shadow-sm"
              >
                <PlusIcon className="w-6 h-6 rotate-45" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-8 overflow-y-auto space-y-8">
              {/* Section 1: Basic Info */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Status</p>
                  <div className={`inline-block px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-tighter ${getStatusColor(selectedLead.status)}`}>
                    {selectedLead.status}
                  </div>
                </div>
                <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Pipeline Stage</p>
                  <p className="text-sm font-bold text-slate-700 capitalize">{selectedLead.pipeline_stage}</p>
                </div>
                <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Created At</p>
                  <p className="text-sm font-bold text-slate-700">{new Date(selectedLead.created_at).toLocaleDateString()}</p>
                </div>
              </div>

              {/* Rejection Alert */}
              {selectedLead.status === 'rejected' && (
                <div className="p-6 bg-rose-50 border border-rose-100 rounded-3xl space-y-3 animate-in slide-in-from-top-2 duration-500">
                   <div className="flex items-center gap-2 text-rose-700 font-black uppercase tracking-widest text-xs">
                      <InformationCircleIcon className="w-5 h-5" />
                      Attention: Lead Rejected
                   </div>
                   <p className="text-sm font-bold text-rose-800 italic">
                      "{selectedLead.rejection_reason || 'Please fill correct information'}"
                   </p>
                   <p className="text-[10px] text-rose-500 font-bold uppercase tracking-tighter">
                      Click 'Edit Details' below to correct and resubmit.
                   </p>
                </div>
              )}

              {/* Internal Notes */}
              {selectedLead.notes && (
                <div className="p-6 bg-slate-50 border border-slate-100 rounded-3xl space-y-2">
                   <div className="flex items-center gap-2 text-slate-500 font-black uppercase tracking-widest text-[10px]">
                      <BriefcaseIcon className="w-4 h-4" />
                      Latest Internal Notes
                   </div>
                   <p className="text-sm text-slate-700 font-medium">{selectedLead.notes}</p>
                </div>
              )}

              {/* Contact Info */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="flex items-center gap-4 p-4 rounded-2xl border border-slate-100">
                  <div className="p-3 bg-blue-100 text-blue-600 rounded-xl">
                    <PhoneIcon className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Phone Number</p>
                    <p className="text-base font-bold text-slate-800">{selectedLead.phone || 'N/A'}</p>
                  </div>
                </div>
                <div className="flex items-center gap-4 p-4 rounded-2xl border border-slate-100">
                  <div className="p-3 bg-indigo-100 text-indigo-600 rounded-xl">
                    <EnvelopeIcon className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Email Address</p>
                    <p className="text-base font-bold text-slate-800">{selectedLead.email || 'N/A'}</p>
                  </div>
                </div>
              </div>

              {/* Section 2: Dynamic Info (extra_data) */}
              <div className="space-y-4">
                <h3 className="text-lg font-black text-slate-900 flex items-center gap-2">
                  <div className="w-1.5 h-6 bg-blue-600 rounded-full"></div>
                  Type-Specific Details
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {Object.entries(selectedLead.extra_data || {}).map(([key, value]) => (
                    <div key={key} className="p-4 bg-white rounded-2xl border border-slate-100 shadow-sm">
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">
                        {key.replace(/_/g, ' ')}
                      </p>
                      <p className="text-sm font-bold text-slate-700">
                        {typeof value === 'boolean' ? (value ? 'Yes' : 'No') : String(value)}
                      </p>
                    </div>
                  ))}
                  {Object.keys(selectedLead.extra_data || {}).length === 0 && (
                    <p className="text-slate-400 font-medium italic col-span-full py-4 text-center">No additional details recorded for this lead.</p>
                  )}
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="p-6 bg-slate-50 border-t border-slate-100 flex justify-end gap-3">
              <button 
                onClick={(e) => handleDelete(e, selectedLead.id)}
                className="px-6 py-2.5 bg-rose-50 text-rose-600 font-bold rounded-xl border border-rose-100 hover:bg-rose-100 transition-all"
              >
                Delete Lead
              </button>
              <button 
                className="px-6 py-2.5 bg-white text-slate-600 font-bold rounded-xl border border-slate-200 hover:bg-slate-100 transition-all"
                onClick={() => navigate(`/creator/edit-lead/${selectedLead.id}`)}
              >
                Edit Details
              </button>
              <button 
                onClick={() => setIsModalOpen(false)}
                className="px-6 py-2.5 bg-blue-600 text-white font-bold rounded-xl shadow-lg shadow-blue-200 hover:bg-blue-700 transition-all"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}


      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white/40 backdrop-blur-md p-6 rounded-3xl border border-white/40 shadow-sm">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">My Leads</h1>
          <p className="text-slate-500 text-sm font-medium">Manage and track your lead pipeline</p>
        </div>
        <button 
          onClick={() => navigate('/creator/create-lead')}
          className="flex items-center gap-2 bg-blue-600 px-6 py-3 rounded-2xl text-white font-bold hover:bg-blue-700 transition-all active:scale-95 shadow-lg shadow-blue-200"
        >
          <PlusIcon className="w-5 h-5" />
          <span>Add New Lead</span>
        </button>
      </div>

      {/* Filters & Search */}
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
            placeholder="Search leads by name, email, or phone..."
          />
        </div>
        <div className="relative w-full md:w-48 group">
          <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400 group-focus-within:text-blue-600 transition-colors">
            <FunnelIcon className="w-5 h-5" />
          </div>
          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            className="w-full pl-11 pr-4 py-3 bg-slate-50/50 border border-slate-200 rounded-2xl outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all appearance-none cursor-pointer text-sm"
          >
            <option value="all">All Types</option>
            <option value="doctor">Doctors</option>
            <option value="patient">Patients</option>
            <option value="lab">Labs</option>
            <option value="pharmacy">Pharmacies</option>
            <option value="hospital">Hospitals</option>
          </select>
        </div>
        <div className="relative w-full md:w-48 group">
          <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400 group-focus-within:text-blue-600 transition-colors">
            <FunnelIcon className="w-5 h-5" />
          </div>
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="w-full pl-11 pr-4 py-3 bg-slate-50/50 border border-slate-200 rounded-2xl outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all appearance-none cursor-pointer text-sm"
          >
            <option value="all">All Statuses</option>
            <option value="pending">Pending</option>
            <option value="approved">Approved</option>
            <option value="rejected">Rejected</option>
            <option value="assigned">Assigned</option>
            <option value="converted">Converted</option>
          </select>
        </div>
      </div>

      {/* Leads List */}
      <div className="grid grid-cols-1 gap-4">
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-20 gap-4">
            <div className="w-12 h-12 border-4 border-blue-600/20 border-t-blue-600 rounded-full animate-spin"></div>
            <p className="text-slate-500 font-bold">Loading your leads...</p>
          </div>
        ) : filteredLeads.length === 0 ? (
          <div className="glass-card rounded-3xl p-12 text-center space-y-4">
            <div className="w-16 h-16 bg-slate-100 rounded-2xl flex items-center justify-center mx-auto">
              <InformationCircleIcon className="w-8 h-8 text-slate-400" />
            </div>
            <div>
              <h3 className="text-xl font-bold text-slate-900">No leads found</h3>
              <p className="text-slate-500 max-w-sm mx-auto mt-2">Try adjusting your filters or create a new lead to get started.</p>
            </div>
          </div>
        ) : (
          filteredLeads.map((lead) => (
            <div 
              key={lead.id}
              onClick={() => openLeadDetails(lead)}
              className="glass-card rounded-3xl p-6 transition-all hover:translate-x-1 border-l-4 border-l-transparent hover:border-l-blue-600 group cursor-pointer hover:shadow-xl hover:bg-white transition-all duration-300"
            >
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div className="flex items-start gap-5">
                  {getTypeIcon(lead.type)}
                  <div>
                    <h3 className="text-xl font-bold text-slate-900 group-hover:text-blue-600 transition-colors">
                      {lead.name}
                    </h3>
                    <div className="flex flex-wrap items-center gap-4 mt-2">
                      {lead.phone && (
                        <div className="flex items-center gap-1.5 text-slate-500 text-sm font-medium">
                          <PhoneIcon className="w-4 h-4" />
                          <span>{lead.phone}</span>
                        </div>
                      )}
                      {lead.email && (
                        <div className="flex items-center gap-1.5 text-slate-500 text-sm font-medium">
                          <EnvelopeIcon className="w-4 h-4" />
                          <span>{lead.email}</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-4">
                  <div className={`px-4 py-1.5 rounded-full border text-xs font-black uppercase tracking-wider ${getStatusColor(lead.status)}`}>
                    {lead.status}
                  </div>
                  <div className="px-4 py-1.5 rounded-full bg-slate-100 text-slate-600 text-xs font-black uppercase tracking-wider border border-slate-200">
                    {lead.pipeline_stage}
                  </div>
                  <button 
                    onClick={(e) => handleDelete(e, lead.id)}
                    className="p-3 bg-rose-50 text-rose-600 rounded-2xl hover:bg-rose-600 hover:text-white transition-all"
                  >
                    <TrashIcon className="w-5 h-5" />
                  </button>
                  <div className="p-3 bg-slate-50 rounded-2xl group-hover:bg-blue-600 group-hover:text-white transition-all">
                    <ChevronRightIcon className="w-5 h-5" />
                  </div>
                </div>

              </div>

              {/* Dynamic Extra Data Preview (Mini) */}
              <div className="mt-6 pt-6 border-t border-slate-100 flex flex-wrap gap-x-8 gap-y-4">
                {Object.entries(lead.extra_data || {}).slice(0, 4).map(([key, value]) => (
                  <div key={key}>
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{key.replace(/_/g, ' ')}</p>
                    <p className="text-sm font-bold text-slate-700">{typeof value === 'boolean' ? (value ? 'Yes' : 'No') : String(value)}</p>
                  </div>
                ))}
                {Object.keys(lead.extra_data || {}).length > 4 && (
                  <div className="flex items-center text-xs font-bold text-blue-600">
                    +{Object.keys(lead.extra_data).length - 4} more details
                  </div>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};


export default MyLeads;