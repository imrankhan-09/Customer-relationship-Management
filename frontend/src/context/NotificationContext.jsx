import React, { createContext, useContext, useState, useCallback } from 'react';

const NotificationContext = createContext();

export const useNotification = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotification must be used within a NotificationProvider');
  }
  return context;
};

export const NotificationProvider = ({ children }) => {
  const [notifications, setNotifications] = useState([]);

  const addNotification = useCallback((message, type = 'info', duration = 5000) => {
    const id = Date.now() + Math.random();
    setNotifications((prev) => [...prev, { id, message, type, duration }]);
  }, []);

  const removeNotification = useCallback((id) => {
    setNotifications((prev) => prev.filter((notification) => notification.id !== id));
  }, []);

  const showSuccess = (message) => addNotification(message, 'success');
  const showError = (message) => addNotification(message, 'error');
  const showWarning = (message) => addNotification(message, 'warning');
  const showInfo = (message) => addNotification(message, 'info');

  return (
    <NotificationContext.Provider value={{ showSuccess, showError, showWarning, showInfo, notifications, removeNotification }}>
      {children}
      <NotificationContainer notifications={notifications} removeNotification={removeNotification} />
    </NotificationContext.Provider>
  );
};

// Internal Container Component for Toasts
import { XMarkIcon, CheckCircleIcon, ExclamationCircleIcon, InformationCircleIcon, ExclamationTriangleIcon } from '@heroicons/react/24/outline';

const NotificationContainer = ({ notifications, removeNotification }) => {
  return (
    <div className="fixed top-6 right-6 z-[9999] flex flex-col gap-4 pointer-events-none">
      {notifications.map((notification) => (
        <Toast key={notification.id} {...notification} onRemove={() => removeNotification(notification.id)} />
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
