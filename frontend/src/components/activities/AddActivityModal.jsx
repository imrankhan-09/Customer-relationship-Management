import React, { Fragment, useState } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import api from '../../api/api';

const activityTypes = ['Call', 'Demo', 'Follow-up', 'Negotiation', 'Meeting', 'Site Visit'];

const AddActivityModal = ({ isOpen, onClose, leadId, onSuccess }) => {
  const [type, setType] = useState('Call');
  const [description, setDescription] = useState('');
  const [date, setDate] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!description.trim()) {
      alert('Please provide a description.');
      return;
    }

    setIsSubmitting(true);
    try {
      const payload = {
        lead_id: Number(leadId),
        type,
        description: description.trim(),
        next_followup: date || null
      };

      console.log('Sending activity payload:', payload);

      await api.post('/activities', payload);
      
      // Clear form and notify success
      setDescription('');
      setDate('');
      if (onSuccess) onSuccess();
      onClose(); 
    } catch (err) {
      console.error('Error adding activity:', err.response?.data || err.message);
      alert(err.response?.data?.message || 'Failed to log activity.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Transition appear show={isOpen} as={Fragment}>
      <Dialog as="div" className="relative z-50" onClose={onClose}>
        <Transition.Child
          as={Fragment}
          enter="ease-out duration-300"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-200"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm" />
        </Transition.Child>
        <div className="fixed inset-0 overflow-y-auto">
          <div className="flex min-h-full items-center justify-center p-4">
            <Transition.Child
              as={Fragment}
              enter="ease-out duration-300"
              enterFrom="opacity-0 scale-95"
              enterTo="opacity-100 scale-100"
              leave="ease-in duration-200"
              leaveFrom="opacity-100 scale-100"
              leaveTo="opacity-0 scale-95"
            >
              <Dialog.Panel className="w-full max-w-md transform overflow-hidden rounded-[2.5rem] bg-white p-8 shadow-2xl transition-all border border-slate-100">
                <Dialog.Title as="h3" className="text-2xl font-black text-slate-900 mb-2">Log Interaction</Dialog.Title>
                <p className="text-slate-500 text-xs font-bold uppercase tracking-widest mb-8">Record your engagement with lead #{leadId}</p>
                
                <form onSubmit={handleSubmit} className="space-y-6">
                  <div>
                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">Activity Type</label>
                    <select 
                      value={type} 
                      onChange={(e) => setType(e.target.value)} 
                      className="w-full px-5 py-4 bg-slate-50 border border-slate-100 rounded-2xl outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all font-bold text-slate-700"
                    >
                      {activityTypes.map(t => <option key={t} value={t}>{t}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">Detailed Description</label>
                    <textarea 
                      value={description} 
                      onChange={(e) => setDescription(e.target.value)} 
                      rows="4" 
                      placeholder="What was discussed? Any specific requirements?"
                      className="w-full px-5 py-4 bg-slate-50 border border-slate-100 rounded-2xl outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all font-medium text-slate-700 resize-none" 
                      required 
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">Next Follow-up (Optional)</label>
                    <input 
                      type="datetime-local" 
                      value={date} 
                      onChange={(e) => setDate(e.target.value)} 
                      className="w-full px-5 py-4 bg-slate-50 border border-slate-100 rounded-2xl outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all font-bold text-slate-700" 
                    />
                  </div>
                  <div className="flex justify-end gap-3 mt-10">
                    <button 
                      type="button" 
                      onClick={onClose} 
                      className="px-6 py-3 border border-slate-200 text-slate-500 rounded-xl font-black text-xs uppercase tracking-widest hover:bg-slate-50 transition-all"
                    >
                      Cancel
                    </button>
                    <button 
                      type="submit" 
                      disabled={isSubmitting}
                      className="px-8 py-3 bg-slate-900 text-white rounded-xl font-black text-xs uppercase tracking-widest hover:bg-blue-600 transition-all active:scale-95 disabled:opacity-50 shadow-lg shadow-slate-200"
                    >
                      {isSubmitting ? 'Logging...' : 'Save Activity'}
                    </button>
                  </div>
                </form>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition>
  );
};

export default AddActivityModal;