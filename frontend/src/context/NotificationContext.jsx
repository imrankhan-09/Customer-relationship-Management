import React, { createContext, useContext, useState, useCallback, useEffect, useRef } from 'react';
import { io } from 'socket.io-client';
import api from '../api/api';
import { useAuth } from './AuthProvider';

const NotificationContext = createContext();

export const useNotification = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotification must be used within a NotificationProvider');
  }
  return context;
};

export const NotificationProvider = ({ children }) => {
  const { user } = useAuth();
  const [toasts, setToasts] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const socket = useRef(null);
  const audioRef = useRef(new Audio('https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3'));

  // 1. Toast logic (transient alerts)
  const addToast = useCallback((message, type = 'info', duration = 5000) => {
    const id = Date.now() + Math.random();
    setToasts((prev) => [...prev, { id, message, type, duration }]);
  }, []);

  const removeToast = useCallback((id) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== id));
  }, []);

  // 2. Persistent Notification Logic
  const fetchNotifications = useCallback(async () => {
    if (!user) return;
    try {
      const res = await api.get('/notifications');
      setNotifications(res.data.data);
      setUnreadCount(res.data.unreadCount);
    } catch (err) {
      console.error('Error fetching notifications:', err);
    }
  }, [user]);

  const markAsRead = async (id) => {
    try {
      await api.put(`/notifications/read/${id}`);
      setNotifications(prev => prev.map(n => n.id === id ? { ...n, is_read: true } : n));
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (err) {
      console.error('Error marking as read:', err);
    }
  };

  const markAllAsRead = async () => {
    try {
      await api.put('/notifications/read-all');
      setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
      setUnreadCount(0);
    } catch (err) {
      console.error('Error marking all as read:', err);
    }
  };

  // 3. Socket.io Integration
  useEffect(() => {
    if (user) {
      fetchNotifications();

      const socketUrl = import.meta.env.VITE_API_BASE_URL?.replace('/api', '') || 'http://localhost:5000';
      socket.current = io(socketUrl, {
        withCredentials: true
      });

      socket.current.emit('join', user.id);

      socket.current.on('new_notification', (notification) => {
        setNotifications(prev => [notification, ...prev].slice(0, 20));
        setUnreadCount(prev => prev + 1);
        
        // Sound and Toast
        audioRef.current.play().catch(e => console.log('Audio play failed:', e));
        addToast(`New Notification: ${notification.title}`, 'info');
      });

      return () => {
        if (socket.current) socket.current.disconnect();
      };
    } else {
      setNotifications([]);
      setUnreadCount(0);
    }
  }, [user, fetchNotifications, addToast]);

  const showSuccess = (message) => addToast(message, 'success');
  const showError = (message) => addToast(message, 'error');
  const showWarning = (message) => addToast(message, 'warning');
  const showInfo = (message) => addToast(message, 'info');

  return (
    <NotificationContext.Provider value={{ 
      showSuccess, showError, showWarning, showInfo, 
      toasts, removeToast,
      notifications, unreadCount, fetchNotifications, markAsRead, markAllAsRead
    }}>
      {children}
      <NotificationContainer toasts={toasts} removeToast={removeToast} />
    </NotificationContext.Provider>
  );
};

// Internal Container Component for Toasts
import { XMarkIcon, CheckCircleIcon, ExclamationCircleIcon, InformationCircleIcon, ExclamationTriangleIcon } from '@heroicons/react/24/outline';

const NotificationContainer = ({ toasts, removeToast }) => {
  return (
    <div className="fixed top-6 right-6 z-[9999] flex flex-col gap-4 pointer-events-none">
      {toasts.map((toast) => (
        <Toast key={toast.id} {...toast} onRemove={() => removeToast(toast.id)} />
      ))}
    </div>
  );
};

const Toast = ({ message, type, duration, onRemove }) => {
  const [isClosing, setIsClosing] = React.useState(false);

  React.useEffect(() => {
    const timer = setTimeout(() => {
      setIsClosing(true);
      setTimeout(onRemove, 300); // Wait for fade-out animation
    }, duration);

    return () => clearTimeout(timer);
  }, [duration, onRemove]);

  const icons = {
    success: <CheckCircleIcon className="w-6 h-6 text-emerald-500" />,
    error: <ExclamationCircleIcon className="w-6 h-6 text-rose-500" />,
    warning: <ExclamationTriangleIcon className="w-6 h-6 text-amber-500" />,
    info: <InformationCircleIcon className="w-6 h-6 text-blue-500" />,
  };

  const backgrounds = {
    success: 'bg-emerald-50 border-emerald-100',
    error: 'bg-rose-50 border-rose-100',
    warning: 'bg-amber-50 border-amber-100',
    info: 'bg-blue-50 border-blue-100',
  };

  return (
    <div className={`
      pointer-events-auto
      flex flex-col
      min-w-[320px] max-w-md
      bg-white/80 backdrop-blur-xl
      border rounded-2xl shadow-2xl shadow-slate-200/50
      overflow-hidden
      transition-all duration-300
      ${isClosing ? 'opacity-0 translate-x-12' : 'opacity-100 translate-x-0 animate-in slide-in-from-right-8'}
    `}>
      <div className={`flex items-center gap-4 p-4 ${backgrounds[type]}`}>
        <div className="flex-shrink-0">
          {icons[type]}
        </div>
        <div className="flex-1">
          <p className="text-sm font-black text-slate-800 tracking-tight">{message}</p>
        </div>
        <button 
          onClick={() => { setIsClosing(true); setTimeout(onRemove, 300); }}
          className="p-1 hover:bg-black/5 rounded-lg transition-colors text-slate-400 hover:text-slate-600"
        >
          <XMarkIcon className="w-4 h-4" />
        </button>
      </div>
      
      {/* Animated Progress Bar */}
      <div className="h-1 w-full bg-black/5">
        <div 
          className={`h-full transition-all linear ${
            type === 'success' ? 'bg-emerald-500' :
            type === 'error' ? 'bg-rose-500' :
            type === 'warning' ? 'bg-amber-500' :
            'bg-blue-500'
          }`}
          style={{ 
            width: '100%',
            animation: `toast-progress ${duration}ms linear forwards`
          }}
        />
      </div>

      <style dangerouslySetInnerHTML={{ __html: `
        @keyframes toast-progress {
          from { width: 100%; }
          to { width: 0%; }
        }
      `}} />
    </div>
  );
};
