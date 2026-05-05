import React, { useState, useEffect } from 'react';
import { useNotification } from '../../context/NotificationContext';
import api from '../../api/api';
import { 
  BellIcon, 
  CheckIcon, 
  TrashIcon, 
  ChevronLeftIcon, 
  ChevronRightIcon,
  ClockIcon,
  CheckCircleIcon
} from '@heroicons/react/24/outline';
import { useNavigate } from 'react-router-dom';

const NotificationHistory = () => {
  const { markAsRead, markAllAsRead, fetchNotifications } = useNotification();
  const [notifications, setNotifications] = useState([]);
  const [pagination, setPagination] = useState({ total: 0, page: 1, limit: 20, pages: 1 });
  const [filter, setFilter] = useState('all');
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  const loadHistory = async (page = 1, currentFilter = filter) => {
    setIsLoading(true);
    try {
      const res = await api.get(`/notifications/history?page=${page}&filter=${currentFilter}`);
      setNotifications(res.data.data);
      setPagination(res.data.pagination);
    } catch (err) {
      console.error('Error loading notification history:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadHistory(1, filter);
  }, [filter]);

  const handleMarkAsRead = async (id, redirect_url) => {
    await markAsRead(id);
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, is_read: true } : n));
    if (redirect_url) {
      navigate(redirect_url);
    }
  };

  const handleMarkAllRead = async () => {
    await markAllAsRead();
    setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
    fetchNotifications(); // Sync dropdown
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleString('en-IN', {
      timeZone: 'Asia/Kolkata',
      hour12: true,
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="max-w-4xl mx-auto py-8 px-4">
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-blue-100 text-blue-600 rounded-2xl">
            <BellIcon className="w-8 h-8" />
          </div>
          <div>
            <h1 className="text-2xl font-black text-slate-900 tracking-tight">Notification History</h1>
            <p className="text-sm font-bold text-slate-400 uppercase tracking-widest">Manage your alerts and activity</p>
          </div>
        </div>
        
        <button 
          onClick={handleMarkAllRead}
          className="flex items-center gap-2 px-4 py-2 bg-emerald-50 text-emerald-600 border border-emerald-100 rounded-xl text-xs font-black uppercase tracking-widest hover:bg-emerald-600 hover:text-white transition-all active:scale-95"
        >
          <CheckCircleIcon className="w-4 h-4" />
          Mark All Read
        </button>
      </div>

      {/* Filters */}
      <div className="flex gap-2 mb-6">
        {['all', 'unread', 'read'].map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-6 py-2 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${
              filter === f 
                ? 'bg-slate-900 text-white shadow-lg' 
                : 'bg-white text-slate-400 border border-slate-100 hover:bg-slate-50'
            }`}
          >
            {f}
          </button>
        ))}
      </div>

      {/* List */}
      <div className="bg-white rounded-[2rem] border border-slate-100 shadow-xl shadow-slate-100/50 overflow-hidden">
        {isLoading ? (
          <div className="p-12 flex justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        ) : notifications.length === 0 ? (
          <div className="p-12 text-center">
            <BellIcon className="w-12 h-12 text-slate-200 mx-auto mb-4" />
            <p className="text-slate-400 font-bold">No notifications found.</p>
          </div>
        ) : (
          <div className="divide-y divide-slate-50">
            {notifications.map((n) => {
              const isAdminAlert = n.type === 'admin_alert';
              return (
                <div 
                  key={n.id} 
                  onClick={() => handleMarkAsRead(n.id, n.redirect_url)}
                  className={`p-6 flex items-start gap-4 hover:bg-slate-50 transition-colors cursor-pointer group ${
                    !n.is_read ? (isAdminAlert ? 'bg-rose-50/40' : 'bg-blue-50/30') : ''
                  }`}
                >
                  <div className={`mt-1 w-2 h-2 rounded-full flex-shrink-0 ${
                    !n.is_read 
                      ? (isAdminAlert ? 'bg-rose-600' : 'bg-blue-600 animate-pulse') 
                      : 'bg-transparent'
                  }`} />
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-1">
                      <h3 className={`text-sm font-black ${
                        !n.is_read ? (isAdminAlert ? 'text-rose-900' : 'text-slate-900') : 'text-slate-600'
                      }`}>
                        {n.title}
                        {isAdminAlert && <span className="ml-2 px-1.5 py-0.5 bg-rose-100 text-rose-600 text-[8px] uppercase rounded">System Alert</span>}
                      </h3>
                      <span className="text-[10px] font-bold text-slate-400 flex items-center gap-1">
                        <ClockIcon className="w-3 h-3" />
                        {formatDate(n.created_at)}
                      </span>
                    </div>
                    <p className={`text-sm leading-relaxed ${isAdminAlert ? 'text-rose-700 font-bold' : 'text-slate-500'}`}>
                      {n.message}
                    </p>
                  </div>
                  {!n.is_read && (
                    <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                      <div className="p-2 bg-white rounded-lg border border-slate-100 text-blue-600 shadow-sm">
                        <CheckIcon className="w-4 h-4" />
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Pagination */}
      {pagination.pages > 1 && (
        <div className="mt-8 flex items-center justify-center gap-4">
          <button
            disabled={pagination.page === 1 || isLoading}
            onClick={() => loadHistory(pagination.page - 1)}
            className="p-2 rounded-xl border border-slate-100 bg-white text-slate-600 disabled:opacity-50 hover:bg-slate-50 transition-all shadow-sm"
          >
            <ChevronLeftIcon className="w-5 h-5" />
          </button>
          <span className="text-xs font-black text-slate-400 uppercase tracking-widest">
            Page {pagination.page} of {pagination.pages}
          </span>
          <button
            disabled={pagination.page === pagination.pages || isLoading}
            onClick={() => loadHistory(pagination.page + 1)}
            className="p-2 rounded-xl border border-slate-100 bg-white text-slate-600 disabled:opacity-50 hover:bg-slate-50 transition-all shadow-sm"
          >
            <ChevronRightIcon className="w-5 h-5" />
          </button>
        </div>
      )}
    </div>
  );
};

export default NotificationHistory;
