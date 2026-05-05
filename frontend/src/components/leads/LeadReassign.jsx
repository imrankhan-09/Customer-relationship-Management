import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import api from '../../api/api';
import { useAuth } from '../../context/AuthProvider';
import { useNotification } from '../../context/NotificationContext';
import {
  ArrowsRightLeftIcon,
  XMarkIcon,
  UserPlusIcon,
  ChatBubbleLeftEllipsisIcon
} from '@heroicons/react/24/outline';

const LeadReassign = ({ leadId, currentAssignee, onReassignSuccess }) => {
  const { user } = useAuth();
  const { showSuccess, showError } = useNotification();
  const [showModal, setShowModal] = useState(false);
  const [users, setUsers] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    to_user_id: '',
    reason: ''
  });

  const fetchUsers = async () => {
    try {
      // Get all workers for reassignment
      const response = await api.get('/users?role=worker');
      setUsers(response.data.filter(u => u.id !== currentAssignee));
    } catch (error) {
      console.error('Error fetching workers:', error);
    }
  };

  useEffect(() => {
    if (showModal) {
      fetchUsers();
    }
  }, [showModal]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      await api.post('/leads/reassign', {
        lead_id: leadId,
        to_user_id: formData.to_user_id,
        reason: formData.reason
      });
      showSuccess('Lead successfully reassigned');
      setShowModal(false);
      setFormData({ to_user_id: '', reason: '' });
      if (onReassignSuccess) onReassignSuccess();
    } catch (error) {
      console.error('Error reassigning lead:', error);
      showError('Failed to reassign lead');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <button 
        onClick={() => setShowModal(true)}
        className="px-6 py-2.5 bg-amber-50 text-amber-700 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-amber-100 transition-all border border-amber-200 shadow-sm flex items-center gap-2"
      >
        <ArrowsRightLeftIcon className="w-4 h-4" />
        Transfer Ownership
      </button>

      {showModal && createPortal(
        <div className="fixed inset-0 z-[99999] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-300">
          <div className="bg-white w-full max-w-md rounded-3xl p-6 shadow-2xl relative animate-in zoom-in-95 duration-300 border border-white/20">
            <button 
              onClick={() => setShowModal(false)}
              className="absolute top-5 right-5 p-2 hover:bg-slate-100 rounded-xl transition-all text-slate-400 hover:text-rose-500"
            >
              <XMarkIcon className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-4 mb-6">
              <div className="p-3 bg-blue-50 text-blue-600 rounded-2xl">
                <ArrowsRightLeftIcon className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-xl font-black text-slate-900 leading-tight">Transfer Ownership</h3>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-0.5">Lead Reassignment</p>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">New Owner</label>
                <div className="relative group">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400">
                    <UserPlusIcon className="w-5 h-5" />
                  </div>
                  <select 
                    value={formData.to_user_id}
                    onChange={(e) => setFormData({...formData, to_user_id: e.target.value})}
                    className="w-full pl-11 pr-4 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all text-sm font-bold text-slate-700 appearance-none cursor-pointer"
                    required
                  >
                    <option value="">Select Target Worker...</option>
                    {users.map(u => (
                      <option key={u.id} value={u.id}>{u.name} ({u.role})</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Transfer Rationale</label>
                <div className="relative">
                  <textarea 
                    value={formData.reason}
                    onChange={(e) => setFormData({...formData, reason: e.target.value})}
                    className="w-full px-5 py-4 pl-12 rounded-2xl border border-slate-200 focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 outline-none transition-all text-sm font-medium h-28 bg-slate-50 resize-none"
                    placeholder="Why are you transferring this lead?"
                    required
                  />
                  <ChatBubbleLeftEllipsisIcon className="w-5 h-5 text-slate-300 absolute left-4 top-4" />
                </div>
              </div>

              <div className="flex gap-3 pt-2">
                <button 
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="flex-1 px-6 py-3.5 text-slate-500 text-[10px] font-black uppercase tracking-widest hover:bg-slate-100 rounded-2xl transition-all"
                >
                  Cancel
                </button>
                <button 
                  type="submit"
                  disabled={isLoading}
                  className="flex-1 px-8 py-3.5 bg-slate-900 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-blue-600 transition-all shadow-xl shadow-slate-200 disabled:opacity-50"
                >
                  {isLoading ? 'Processing...' : 'Confirm Transfer'}
                </button>
              </div>
            </form>
          </div>
        </div>,
        document.body
      )}
    </>
  );
};

export default LeadReassign;
