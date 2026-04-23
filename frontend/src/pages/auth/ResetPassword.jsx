import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate, Link } from 'react-router-dom';
import api from '../../api/api';
import { LockClosedIcon, CheckCircleIcon, ArrowPathIcon } from '@heroicons/react/24/outline';

const ResetPassword = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const token = searchParams.get('token');

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [status, setStatus] = useState('idle'); // idle, loading, success, error
  const [message, setMessage] = useState('');

  useEffect(() => {
    if (!token) {
      setStatus('error');
      setMessage('Invalid or missing reset token.');
    }
  }, [token]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (password !== confirmPassword) {
      setStatus('error');
      setMessage('Passwords do not match.');
      return;
    }

    if (password.length < 6) {
      setStatus('error');
      setMessage('Password must be at least 6 characters.');
      return;
    }

    setStatus('loading');
    try {
      const response = await api.post('/auth/reset-password', { 
        token, 
        new_password: password 
      });
      setStatus('success');
      setMessage(response.data.message);
      setTimeout(() => navigate('/login'), 3000);
    } catch (err) {
      setStatus('error');
      setMessage(err.response?.data?.message || 'Failed to reset password');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#F8FAFC] p-4">
      <div className="w-full max-w-md animate-in fade-in zoom-in duration-500">
        <div className="bg-white rounded-[32px] shadow-2xl shadow-blue-100/50 p-8 md:p-10 border border-slate-100">
          <div className="mb-8">
            <h1 className="text-3xl font-black text-slate-900 tracking-tight">Reset Password</h1>
            <p className="text-slate-500 mt-2 font-medium">Create a strong new password for your account.</p>
          </div>

          {status === 'success' ? (
            <div className="space-y-6 text-center">
              <div className="p-6 bg-emerald-50 rounded-3xl border border-emerald-100 flex flex-col items-center">
                <CheckCircleIcon className="w-12 h-12 text-emerald-500 mb-3" />
                <p className="text-emerald-900 font-bold">{message}</p>
                <p className="text-emerald-600 text-sm mt-2">Redirecting to login...</p>
              </div>
              <Link 
                to="/login" 
                className="block w-full py-4 bg-slate-900 text-white font-black rounded-2xl hover:bg-slate-800 transition-all shadow-lg"
              >
                Go to Login
              </Link>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-2">
                <label className="text-xs font-black text-slate-400 uppercase tracking-widest ml-1">New Password</label>
                <div className="relative group">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400 group-focus-within:text-blue-600 transition-colors">
                    <LockClosedIcon className="w-5 h-5" />
                  </div>
                  <input
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full pl-11 pr-4 py-4 bg-slate-50 border border-slate-100 rounded-2xl outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all font-medium"
                    placeholder="••••••••"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-black text-slate-400 uppercase tracking-widest ml-1">Confirm New Password</label>
                <div className="relative group">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400 group-focus-within:text-blue-600 transition-colors">
                    <LockClosedIcon className="w-5 h-5" />
                  </div>
                  <input
                    type="password"
                    required
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="w-full pl-11 pr-4 py-4 bg-slate-50 border border-slate-100 rounded-2xl outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all font-medium"
                    placeholder="••••••••"
                  />
                </div>
              </div>

              {status === 'error' && (
                <div className="p-4 bg-rose-50 rounded-2xl border border-rose-100 text-rose-600 text-sm font-bold">
                  {message}
                </div>
              )}

              <button
                type="submit"
                disabled={status === 'loading' || !token}
                className="w-full py-4 bg-blue-600 text-white font-black rounded-2xl hover:bg-blue-700 transition-all active:scale-[0.98] shadow-xl shadow-blue-200 disabled:opacity-50 disabled:active:scale-100 flex items-center justify-center gap-2"
              >
                {status === 'loading' && <ArrowPathIcon className="w-5 h-5 animate-spin" />}
                {status === 'loading' ? 'Updating...' : 'Reset Password'}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};

export default ResetPassword;
