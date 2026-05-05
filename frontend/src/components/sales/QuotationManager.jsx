import React, { useState, useEffect } from 'react';
import api from '../../api/api';
import { useAuth } from '../../context/AuthProvider';
import { useNotification } from '../../context/NotificationContext';
import {
  DocumentTextIcon,
  PlusIcon,
  XMarkIcon,
  CheckCircleIcon,
  ClockIcon,
  BanknotesIcon
} from '@heroicons/react/24/outline';

const QuotationManager = ({ leadId, onQuotationUpdate }) => {
  const { user } = useAuth();
  const { showSuccess, showError } = useNotification();
  const [quotations, setQuotations] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [formData, setFormData] = useState({
    title: 'MedBridge CRM Quotation',
    description: '',
    base_price: '',
    discount: '',
    valid_till: '',
    notes: ''
  });

  const fetchQuotations = async () => {
    try {
      const response = await api.get(`/quotations/${leadId}`);
      setQuotations(response.data);
    } catch (error) {
      console.error('Error fetching quotations:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchQuotations();
  }, [leadId]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      await api.post('/quotations/create', {
        lead_id: leadId,
        ...formData
      });
      showSuccess('Quotation created successfully');
      setShowForm(false);
      setFormData({
        title: 'MedBridge CRM Quotation',
        description: '',
        base_price: '',
        discount: '',
        valid_till: '',
        notes: ''
      });
      fetchQuotations();
      if (onQuotationUpdate) onQuotationUpdate();
    } catch (error) {
      console.error('Error creating quotation:', error);
      showError('Failed to create quotation');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleStatusChange = async (id, newStatus) => {
    try {
      await api.patch(`/quotations/status/${id}`, { status: newStatus });
      showSuccess(`Quotation marked as ${newStatus}`);
      fetchQuotations();
      if (onQuotationUpdate) onQuotationUpdate();
    } catch (error) {
      console.error('Error updating status:', error);
      showError('Failed to update status');
    }
  };

  if (isLoading) return <div className="animate-pulse h-20 bg-slate-100 rounded-2xl"></div>;

  return (
    <div className="glass-card rounded-3xl p-8 mb-8 border border-white/60">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
          <DocumentTextIcon className="w-5 h-5 text-pink-600" />
          Quotations
        </h3>
        <button
          onClick={() => setShowForm(!showForm)}
          className="px-4 py-2 bg-slate-900 text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-pink-600 transition-all flex items-center gap-2"
        >
          {showForm ? <XMarkIcon className="w-4 h-4" /> : <PlusIcon className="w-4 h-4" />}
          {showForm ? 'Cancel' : 'New Quotation'}
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleSubmit} className="mb-8 p-6 bg-slate-50 rounded-2xl border border-slate-200 space-y-4 animate-in fade-in slide-in-from-top-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Title</label>
              <input type="text" required value={formData.title} onChange={e => setFormData({...formData, title: e.target.value})} className="w-full px-4 py-3 rounded-xl border border-slate-200 outline-none focus:ring-2 focus:ring-pink-500 bg-white" />
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Valid Till</label>
              <input type="date" required value={formData.valid_till} onChange={e => setFormData({...formData, valid_till: e.target.value})} className="w-full px-4 py-3 rounded-xl border border-slate-200 outline-none focus:ring-2 focus:ring-pink-500 bg-white" />
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Base Price ($)</label>
              <input type="number" required min="0" step="0.01" value={formData.base_price} onChange={e => setFormData({...formData, base_price: e.target.value})} className="w-full px-4 py-3 rounded-xl border border-slate-200 outline-none focus:ring-2 focus:ring-pink-500 bg-white" />
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Discount ($)</label>
              <input type="number" min="0" step="0.01" value={formData.discount} onChange={e => setFormData({...formData, discount: e.target.value})} className="w-full px-4 py-3 rounded-xl border border-slate-200 outline-none focus:ring-2 focus:ring-pink-500 bg-white" />
            </div>
          </div>
          <div className="space-y-1">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Description</label>
            <textarea value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} className="w-full px-4 py-3 rounded-xl border border-slate-200 outline-none focus:ring-2 focus:ring-pink-500 bg-white h-20 resize-none" placeholder="Product details..."></textarea>
          </div>
          <div className="space-y-1">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Notes / Terms</label>
            <textarea value={formData.notes} onChange={e => setFormData({...formData, notes: e.target.value})} className="w-full px-4 py-3 rounded-xl border border-slate-200 outline-none focus:ring-2 focus:ring-pink-500 bg-white h-20 resize-none" placeholder="T&C..."></textarea>
          </div>
          <div className="pt-2 flex justify-between items-center">
            <div className="text-sm font-bold text-slate-700">
              Final Price: <span className="text-pink-600 text-lg">${(parseFloat(formData.base_price || 0) - parseFloat(formData.discount || 0)).toFixed(2)}</span>
            </div>
            <button type="submit" disabled={isSubmitting} className="px-8 py-3 bg-pink-600 text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-pink-700 transition-all shadow-lg shadow-pink-200 disabled:opacity-50">
              {isSubmitting ? 'Saving...' : 'Save Quotation'}
            </button>
          </div>
        </form>
      )}

      <div className="space-y-4">
        {quotations.map(q => (
          <div key={q.id} className="p-5 bg-white border border-slate-100 rounded-2xl flex flex-col md:flex-row gap-4 justify-between hover:shadow-md transition-all group">
            <div>
              <div className="flex items-center gap-3 mb-1">
                <h4 className="font-bold text-slate-900">{q.title}</h4>
                <span className={`px-2.5 py-0.5 rounded-full text-[9px] font-black uppercase tracking-widest ${
                  q.status === 'Draft' ? 'bg-slate-100 text-slate-600' :
                  q.status === 'Sent' ? 'bg-blue-100 text-blue-600' :
                  q.status === 'Accepted' ? 'bg-emerald-100 text-emerald-600' :
                  'bg-rose-100 text-rose-600'
                }`}>
                  {q.status}
                </span>
              </div>
              <p className="text-xs font-medium text-slate-500 mb-2">{q.description || 'No description provided'}</p>
              <div className="flex items-center gap-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">
                <span className="flex items-center gap-1"><ClockIcon className="w-3.5 h-3.5" /> Valid till: {new Date(q.valid_till).toLocaleDateString()}</span>
                <span className="flex items-center gap-1"><BanknotesIcon className="w-3.5 h-3.5" /> Base: ${q.base_price} | Disc: ${q.discount}</span>
              </div>
            </div>
            <div className="flex flex-col items-end justify-between">
              <div className="text-xl font-black text-slate-900">${q.final_price}</div>
              {q.status === 'Draft' && (
                <div className="flex gap-2 mt-2">
                  <button onClick={() => handleStatusChange(q.id, 'Sent')} className="text-[10px] font-black uppercase tracking-widest text-blue-600 hover:text-blue-800">Mark Sent</button>
                </div>
              )}
              {q.status === 'Sent' && (
                <div className="flex gap-2 mt-2">
                  <button onClick={() => handleStatusChange(q.id, 'Accepted')} className="text-[10px] font-black uppercase tracking-widest text-emerald-600 hover:text-emerald-800">Accept</button>
                  <button onClick={() => handleStatusChange(q.id, 'Rejected')} className="text-[10px] font-black uppercase tracking-widest text-rose-600 hover:text-rose-800">Reject</button>
                </div>
              )}
            </div>
          </div>
        ))}
        {quotations.length === 0 && !showForm && (
          <div className="text-center py-8 text-slate-400 font-medium italic text-sm">
            No quotations created yet.
          </div>
        )}
      </div>
    </div>
  );
};

export default QuotationManager;
