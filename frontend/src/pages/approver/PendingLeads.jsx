import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../api/api';
import { useNotification } from '../../context/NotificationContext';
import { 
  CheckCircleIcon, 
  XCircleIcon, 
  ArrowLeftIcon,
  MagnifyingGlassIcon,
  FunnelIcon,
  UserIcon,
  PhoneIcon,
  EnvelopeIcon,
  ShieldCheckIcon,
  InformationCircleIcon,
  UserGroupIcon
} from '@heroicons/react/24/outline';

const PendingLeads = () => {
  const navigate = useNavigate();
  const { showSuccess, showError } = useNotification();
  const [leads, setLeads] = useState([]);
  const [filteredLeads, setFilteredLeads] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterType, setFilterType] = useState('all');
  const [isProcessing, setIsProcessing] = useState(false);
  const [workers, setWorkers] = useState([]);
  const [selectedWorkerId, setSelectedWorkerId] = useState('');

  const [selectedLead, setSelectedLead] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [notes, setNotes] = useState('');
  const [rejectionReason, setRejectionReason] = useState('');
  const [showRejectInput, setShowRejectInput] = useState(false);

  useEffect(() => {
    fetchLeads();
    // Background polling for new submissions (every 30 seconds)
    const interval = setInterval(() => fetchLeads(true), 30000);
    return () => clearInterval(interval);
  }, []);

  const fetchLeads = async (isPoll = false) => {
    try {
      const [leadsRes, workersRes] = await Promise.all([
        api.get('/leads'),
        api.get('/users?role=worker')
      ]);
      const pendingLeads = leadsRes.data.filter(l => l.status === 'pending');
      setLeads(pendingLeads);
      setFilteredLeads(pendingLeads);
      setWorkers(workersRes.data);
    } catch (err) {
      console.error('Error fetching data:', err);
    } finally {
      if (!isPoll) setIsLoading(false);
    }
  };

  const handleAction = async (leadId, action) => {
    if (action === 'rejected' && !showRejectInput) {
      setShowRejectInput(true);
      return;
    }

    if (action === 'rejected' && !rejectionReason) {
      showError('Please provide a reason for rejection');
      return;
    }

    setIsProcessing(true);
    try {
      await api.put(`/leads/${leadId}`, { 
        status: action,
        notes: notes,
        rejection_reason: action === 'rejected' ? rejectionReason : null,
        assigned_to: action === 'approved' && selectedWorkerId ? selectedWorkerId : undefined
      });
      await fetchLeads(); // Refresh list
      showSuccess(`Lead ${action === 'approved' ? 'Approved' : 'Rejected'} Successfully`);
      setIsModalOpen(false);
      setNotes('');
      setRejectionReason('');
      setShowRejectInput(false);
      setSelectedWorkerId('');
    } catch (err) {
      console.error(`Error updating lead to ${action}:`, err);
      showError(`Failed to ${action} lead`);
    } finally {
      setIsProcessing(false);
    }
  };

  const openReviewModal = (lead) => {
    let parsedExtra = lead.extra_data;
    if (typeof parsedExtra === 'string') {
      try { parsedExtra = JSON.parse(parsedExtra); } catch (e) { parsedExtra = {}; }
    }
    setSelectedLead({ ...lead, extra_data: parsedExtra || {} });
    setNotes(lead.notes || '');
    setRejectionReason(lead.rejection_reason || '');
    setSelectedWorkerId(lead.assigned_to || '');
    setShowRejectInput(false);
    setIsModalOpen(true);
  };

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
      {/* Review Modal */}
      {isModalOpen && selectedLead && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6">
          <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={() => setIsModalOpen(false)}></div>
          <div className="relative w-full max-w-2xl bg-white rounded-3xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200 flex flex-col max-h-[90vh]">
            <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
              <div className="flex items-center gap-4">
                 <div className="p-3 bg-blue-100 text-blue-600 rounded-2xl">
                    <ShieldCheckIcon className="w-6 h-6" />
                 </div>
                 <div>
                    <h2 className="text-2xl font-black text-slate-900">{selectedLead.name}</h2>
                    <p className="text-slate-500 font-bold uppercase tracking-wider text-xs">Approval Review</p>
                 </div>
              </div>
              <button onClick={() => setIsModalOpen(false)} className="p-2 hover:bg-white rounded-xl transition-all text-slate-400 hover:text-rose-500 border border-transparent hover:border-slate-100 shadow-sm">
                <XCircleIcon className="w-6 h-6" />
              </button>
            </div>
            <div className="p-8 overflow-y-auto space-y-8">
              <div className="grid grid-cols-2 gap-4">
                 <div className="flex items-center gap-4 p-4 rounded-2xl border border-slate-100">
                    <div className="p-3 bg-slate-100 text-slate-600 rounded-xl"><PhoneIcon className="w-5 h-5" /></div>
                    <div><p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Phone</p><p className="font-bold text-slate-800">{selectedLead.phone || 'N/A'}</p></div>
                 </div>
                 <div className="flex items-center gap-4 p-4 rounded-2xl border border-slate-100">
                    <div className="p-3 bg-slate-100 text-slate-600 rounded-xl"><EnvelopeIcon className="w-5 h-5" /></div>
                    <div><p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Email</p><p className="font-bold text-slate-800 text-xs truncate max-w-[150px]">{selectedLead.email || 'N/A'}</p></div>
                 </div>
              </div>

              <div className="space-y-4">
                <h3 className="text-sm font-black text-slate-900 uppercase tracking-widest border-b pb-2">Category Specific Data</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {Object.entries(selectedLead.extra_data || {}).map(([key, value]) => (
                    <div key={key} className="p-4 bg-white rounded-2xl border border-slate-100 shadow-sm">
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">{key.replace(/_/g, ' ')}</p>
                      <p className="text-sm font-bold text-slate-700">{typeof value === 'boolean' ? (value ? 'Yes' : 'No') : String(value)}</p>
                    </div>
                  ))}
                </div>
              </div>

              <div className="space-y-4 bg-slate-50 p-6 rounded-3xl border border-slate-100">
                <h3 className="text-sm font-black text-slate-900 uppercase tracking-widest">Approval Feedback</h3>
                <div className="space-y-4">
                   <div className="space-y-2">
                      <label className="text-xs font-bold text-slate-500 ml-1">Internal Notes</label>
                      <textarea 
                        value={notes}
                        onChange={(e) => setNotes(e.target.value)}
                        placeholder="Add internal notes for the team..."
                        className="w-full px-4 py-3 bg-white border border-slate-200 rounded-2xl outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all resize-none text-sm min-h-[80px]"
                      />
                   </div>

                   {showRejectInput && (
                     <div className="space-y-2 animate-in slide-in-from-top-2 duration-300">
                        <label className="text-xs font-bold text-rose-600 ml-1">Rejection Reason</label>
                        <textarea 
                          value={rejectionReason}
                          onChange={(e) => setRejectionReason(e.target.value)}
                          placeholder="Tell the Creator what to fix..."
                          className="w-full px-4 py-3 bg-white border border-rose-200 rounded-2xl outline-none focus:ring-4 focus:ring-rose-500/10 focus:border-rose-500 transition-all resize-none text-sm min-h-[80px]"
                        />
                     </div>
                   )}

                   {/* Assignment Selection */}
                   {!showRejectInput && (
                     <div className="space-y-2 animate-in slide-in-from-top-2 duration-300 pt-2 border-t border-slate-100 mt-4">
                        <label className="text-xs font-bold text-blue-600 ml-1 flex items-center gap-1">
                           <UserGroupIcon className="w-3.5 h-3.5" />
                           Assign to Worker (Optional)
                        </label>
                        <select
                          value={selectedWorkerId}
                          onChange={(e) => setSelectedWorkerId(e.target.value)}
                          className="w-full px-4 py-3 bg-white border border-slate-200 rounded-2xl outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all appearance-none cursor-pointer text-sm font-bold text-slate-700"
                        >
                          <option value="">-- Select Worker --</option>
                          {workers.map(w => (
                            <option key={w.id} value={w.id}>{w.name}</option>
                          ))}
                        </select>
                     </div>
                   )}
                </div>
              </div>
            </div>
            <div className="p-6 bg-slate-50 border-t border-slate-100 flex justify-end gap-3">
              <button 
                disabled={isProcessing}
                onClick={() => handleAction(selectedLead.id, 'rejected')}
                className={`px-6 py-2.5 font-bold rounded-xl border transition-all ${
                  showRejectInput 
                    ? 'bg-rose-600 text-white border-rose-600' 
                    : 'bg-rose-50 text-rose-600 border-rose-100 hover:bg-rose-100'
                }`}
              >
                {showRejectInput ? 'Confirm Rejection' : 'Reject Lead'}
              </button>
              {!showRejectInput && (
                <button 
                  disabled={isProcessing}
                  onClick={() => handleAction(selectedLead.id, 'approved')}
                  className="px-8 py-2.5 bg-emerald-600 text-white font-bold rounded-xl shadow-lg shadow-emerald-200 hover:bg-emerald-700 transition-all flex items-center gap-2"
                >
                  <ShieldCheckIcon className="w-5 h-5" />
                  {selectedWorkerId ? 'Approve & Assign' : 'Approve'}
                </button>
              )}
            </div>
          </div>
        </div>
      )}

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
            <h1 className="text-2xl font-bold text-slate-900">Approval Queue</h1>
            <p className="text-slate-500 text-sm font-medium">Review and approve incoming leads</p>
          </div>
        </div>
        <div className="px-5 py-2 bg-amber-50 text-amber-700 rounded-2xl border border-amber-100 font-bold text-sm">
          {leads.length} Pending Actions
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
            placeholder="Search queue by name or email..."
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

      {/* Table/List */}
      <div className="glass-card rounded-3xl overflow-hidden border border-white/40">
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-20 gap-4">
            <div className="w-12 h-12 border-4 border-blue-600/20 border-t-blue-600 rounded-full animate-spin"></div>
            <p className="text-slate-500 font-bold tracking-widest text-xs uppercase">Fetching Queue...</p>
          </div>
        ) : filteredLeads.length === 0 ? (
          <div className="p-20 text-center space-y-4">
            <div className="w-16 h-16 bg-emerald-50 rounded-2xl flex items-center justify-center mx-auto">
               <CheckCircleIcon className="w-8 h-8 text-emerald-600" />
            </div>
            <div>
               <h3 className="text-xl font-bold text-slate-900">Queue is Clear</h3>
               <p className="text-slate-500 max-w-sm mx-auto mt-2 font-medium">All submitted leads have been reviewed and processed.</p>
            </div>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50/50 border-b border-slate-100">
                  <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Lead Details</th>
                  <th className="px-6 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">Category</th>
                  <th className="px-6 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Contact Info</th>
                  <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {filteredLeads.map((lead) => (
                  <tr key={lead.id} className="group hover:bg-slate-50/30 transition-colors">
                    <td className="px-8 py-6">
                      <div className="flex items-center gap-4">
                        <div className="p-3 bg-white rounded-2xl border border-slate-100 text-blue-600 group-hover:bg-blue-600 group-hover:text-white transition-all">
                          <UserIcon className="w-5 h-5" />
                        </div>
                        <div>
                          <p className="font-bold text-slate-900 text-base">{lead.name}</p>
                          <p className="text-xs text-slate-500 font-medium">Submitted {new Date(lead.created_at).toLocaleDateString()}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-6 text-center">
                      <span className="px-3 py-1 bg-white border border-slate-100 text-slate-600 rounded-lg text-xs font-bold uppercase tracking-wider">
                        {lead.type}
                      </span>
                    </td>
                    <td className="px-6 py-6">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2 text-slate-600 text-xs font-bold">
                          <PhoneIcon className="w-3.5 h-3.5 text-slate-400" />
                          <span>{lead.phone || 'N/A'}</span>
                        </div>
                        <div className="flex items-center gap-2 text-slate-600 text-xs font-bold">
                          <EnvelopeIcon className="w-3.5 h-3.5 text-slate-400" />
                          <span>{lead.email || 'N/A'}</span>
                        </div>
                      </div>
                    </td>
                    <td className="px-8 py-6 text-right">
                      <button 
                        onClick={() => openReviewModal(lead)}
                        className="px-6 py-2.5 bg-blue-600 text-white rounded-xl font-bold text-sm shadow-lg shadow-blue-100 hover:bg-blue-700 transition-all flex items-center gap-2 ml-auto"
                      >
                        <ShieldCheckIcon className="w-5 h-5" />
                        <span>Review</span>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <div className="bg-blue-600 rounded-3xl p-8 text-white relative overflow-hidden shadow-xl shadow-blue-200">
        <div className="absolute top-0 right-0 p-8 opacity-10">
          <InformationCircleIcon className="w-32 h-32" />
        </div>
        <div className="relative z-10 max-w-2xl">
          <h3 className="text-2xl font-black mb-2 flex items-center gap-3">
            <ShieldCheckIcon className="w-8 h-8" />
            Approver Guidelines
          </h3>
          <p className="text-blue-100 font-medium leading-relaxed">
            Please ensure you have verified the contact details and type-specific data before approving. 
            Once approved, leads will be visible to Workers for follow-up and conversion.
          </p>
        </div>
      </div>
    </div>
  );
};

export default PendingLeads;