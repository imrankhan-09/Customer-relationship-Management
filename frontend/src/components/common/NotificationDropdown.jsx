import React, { Fragment, useState } from 'react';
import { Menu, Transition } from '@headlessui/react';
import { BellIcon, ClockIcon, CheckCircleIcon, MegaphoneIcon, PaperAirplaneIcon } from '@heroicons/react/24/outline';
import { useNotification } from '../../context/NotificationContext';
import { useAuth } from '../../context/AuthProvider';
import { useNavigate, Link } from 'react-router-dom';
import api from '../../api/api';

const NotificationDropdown = () => {
  const { notifications, unreadCount, markAsRead, markAllAsRead, fetchNotifications, showSuccess, showError } = useNotification();
  const { user } = useAuth();
  const navigate = useNavigate();
  
  const [alertMessage, setAlertMessage] = useState('');
  const [isSending, setIsSending] = useState(false);

  const handleNotificationClick = async (notification) => {
    if (!notification.is_read) {
      await markAsRead(notification.id);
    }
    if (notification.redirect_url && notification.type !== 'admin_alert') {
      navigate(notification.redirect_url);
    }
  };

  const handleSendBroadcast = async () => {
    if (!alertMessage.trim()) return;
    setIsSending(true);
    try {
      await api.post('/notifications/broadcast', { message: alertMessage });
      setAlertMessage('');
      showSuccess('Alert broadcasted successfully');
      fetchNotifications();
    } catch (err) {
      console.error('Error broadcasting alert:', err);
      showError('Failed to broadcast alert');
    } finally {
      setIsSending(false);
    }
  };

  const formatTime = (dateString) => {
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

  // Separate admin alerts for top display
  const adminAlerts = notifications.filter(n => n.type === 'admin_alert');
  const otherNotifications = notifications.filter(n => n.type !== 'admin_alert');

  return (
    <Menu as="div" className="relative">
      <Menu.Button className="relative p-2 rounded-xl hover:bg-slate-100 transition-all active:scale-95 group">
        <BellIcon className={`w-6 h-6 text-slate-600 transition-colors ${unreadCount > 0 ? 'group-hover:text-blue-600' : ''}`} />
        {unreadCount > 0 && (
          <span className="absolute top-1.5 right-1.5 flex h-4 w-4">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-4 w-4 bg-rose-500 text-[10px] font-black text-white items-center justify-center border-2 border-white">
              {unreadCount > 9 ? '9+' : unreadCount}
            </span>
          </span>
        )}
      </Menu.Button>

      <Transition
        as={Fragment}
        enter="transition ease-out duration-200"
        enterFrom="transform opacity-0 scale-95 translate-y-2"
        enterTo="transform opacity-100 scale-100 translate-y-0"
        leave="transition ease-in duration-150"
        leaveFrom="transform opacity-100 scale-100 translate-y-0"
        leaveTo="transform opacity-0 scale-95 translate-y-2"
      >
        <Menu.Items className="absolute right-0 mt-3 w-80 lg:w-96 origin-top-right bg-white rounded-3xl shadow-2xl border border-slate-100 focus:outline-none z-50 overflow-hidden ring-1 ring-black/5">
          {/* Admin Broadcast Tool */}
          {user?.role === 'admin' && (
            <div className="p-4 bg-slate-900 border-b border-slate-800">
              <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-3 flex items-center gap-2">
                <MegaphoneIcon className="w-3 h-3" />
                System Broadcast
              </h4>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={alertMessage}
                  onChange={(e) => setAlertMessage(e.target.value)}
                  placeholder="Write alert message..."
                  className="flex-1 bg-slate-800 border-none rounded-xl px-4 py-2 text-xs text-white placeholder:text-slate-500 focus:ring-2 focus:ring-blue-500 transition-all"
                  onKeyDown={(e) => e.key === 'Enter' && handleSendBroadcast()}
                />
                <button
                  onClick={handleSendBroadcast}
                  disabled={isSending || !alertMessage.trim()}
                  className="p-2 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 disabled:hover:bg-blue-600 text-white rounded-xl transition-all active:scale-95"
                >
                  <PaperAirplaneIcon className={`w-4 h-4 ${isSending ? 'animate-pulse' : ''}`} />
                </button>
              </div>
            </div>
          )}

          <div className="p-4 border-b border-slate-50 flex items-center justify-between bg-slate-50/50">
            <div>
              <h3 className="font-black text-slate-900 tracking-tight">Notifications</h3>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                {unreadCount} UNREAD ALERTS
              </p>
            </div>
            {unreadCount > 0 && (
              <button 
                onClick={(e) => { e.stopPropagation(); markAllAsRead(); }}
                className="text-[10px] font-black text-blue-600 uppercase tracking-widest hover:text-blue-800 transition-colors"
              >
                Mark all read
              </button>
            )}
          </div>

          <div className="max-h-[400px] overflow-y-auto overscroll-contain divide-y divide-slate-50">
            {/* Admin Alerts Section */}
            {adminAlerts.length > 0 && (
              <div className="bg-rose-50/30">
                <div className="px-4 py-2 bg-rose-50/50 border-b border-rose-100/50">
                  <p className="text-[9px] font-black text-rose-600 uppercase tracking-widest flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 bg-rose-500 rounded-full animate-pulse"></span>
                    Admin Alerts
                  </p>
                </div>
                {adminAlerts.map((n) => (
                  <NotificationItem key={n.id} n={n} formatTime={formatTime} onClick={() => handleNotificationClick(n)} isAdminAlert={true} />
                ))}
              </div>
            )}

            {/* Other Notifications */}
            {otherNotifications.length === 0 && adminAlerts.length === 0 ? (
              <div className="p-8 text-center">
                <BellIcon className="w-10 h-10 text-slate-200 mx-auto mb-2" />
                <p className="text-xs font-bold text-slate-400">No notifications yet</p>
              </div>
            ) : (
              otherNotifications.map((n) => (
                <NotificationItem key={n.id} n={n} formatTime={formatTime} onClick={() => handleNotificationClick(n)} />
              ))
            )}
          </div>

          <div className="p-3 bg-slate-50/50 border-t border-slate-50">
            <Link 
              to="/notifications" 
              className="block w-full py-2 text-center text-xs font-black text-slate-600 uppercase tracking-widest hover:text-blue-600 transition-colors"
            >
              View all notifications
            </Link>
          </div>
        </Menu.Items>
      </Transition>
    </Menu>
  );
};

const NotificationItem = ({ n, formatTime, onClick, isAdminAlert = false }) => (
  <Menu.Item>
    {({ active }) => (
      <div 
        onClick={onClick}
        className={`px-4 py-4 cursor-pointer transition-all ${
          active ? 'bg-slate-50' : ''
        } ${!n.is_read ? (isAdminAlert ? 'bg-rose-50/50' : 'bg-blue-50/30') : ''} flex items-start gap-3`}
      >
        <div className={`mt-1.5 w-2 h-2 rounded-full flex-shrink-0 ${
          !n.is_read 
            ? (isAdminAlert ? 'bg-rose-600 shadow-[0_0_8px_rgba(225,29,72,0.4)]' : 'bg-blue-600 shadow-[0_0_8px_rgba(37,99,235,0.4)]') 
            : 'bg-transparent'
        }`} />
        <div className="flex-1">
          <p className={`text-sm leading-snug ${!n.is_read ? 'font-black text-slate-900' : 'text-slate-600 font-medium'}`}>
            {n.title}
          </p>
          <p className={`text-xs mt-1 line-clamp-2 ${isAdminAlert ? 'text-rose-700 font-bold' : 'text-slate-500'}`}>
            {n.message}
          </p>
          <div className="flex items-center gap-1.5 mt-2">
            <ClockIcon className="w-3 h-3 text-slate-400" />
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter">
              {formatTime(n.created_at)}
            </span>
          </div>
        </div>
      </div>
    )}
  </Menu.Item>
);

export default NotificationDropdown;