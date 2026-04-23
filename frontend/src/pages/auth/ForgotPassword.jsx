import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../../api/api';
import { EnvelopeIcon, ArrowLeftIcon, CheckCircleIcon } from '@heroicons/react/24/outline';

const ForgotPassword = () => {
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState('idle'); // idle, loading, success, error
  const [message, setMessage] = useState('');
  const [resetLink, setResetLink] = useState(''); // For demo purposes as per requirements

  const handleSubmit = async (e) => {
    e.preventDefault();
    setStatus('loading');
    try {
      const response = await api.post('/auth/forgot-password', { email });
      setStatus('success');
      setMessage(response.data.message);
      setResetLink(response.data.resetLink);
    } catch (err) {
      setStatus('error');
      setMessage(err.response?.data?.message || 'Something went wrong');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#F8FAFC] p-4">
      <div className="w-full max-w-md animate-in fade-in zoom-in duration-500">
        <div className="bg-white rounded-[32px] shadow-2xl shadow-blue-100/50 p-8 md:p-10 border border-slate-100">
          <div className="mb-8">
            <Link to="/login" className="inline-flex items-center text-sm font-bold text-slate-400 hover:text-blue-600 transition-colors mb-6 group">
              <ArrowLeftIcon className="w-4 h-4 mr-2 group-hover:-translate-x-1 transition-transform" />
              Back to Login
            </Link>
            <h1 className="text-3xl font-black text-slate-900 tracking-tight">Forgot Password?</h1>
            <p className="text-slate-500 mt-2 font-medium">Enter your email and we'll help you reset it.</p>
          </div>

          {status === 'success' ? (
            <div className="space-y-6">
              <div className="p-6 bg-emerald-50 rounded-3xl border border-emerald-100 flex flex-col items-center text-center">
                <CheckCircleIcon className="w-12 h-12 text-emerald-500 mb-3" />
                <p className="text-emerald-900 font-bold">{message}</p>
              </div>
              
              {/* Reset Link Display for Demo */}
              <div className="p-4 bg-blue-50 rounded-2xl border border-blue-100">
                <p className="text-[10px] font-black text-blue-400 uppercase tracking-widest mb-2">Demo Reset Link</p>
                <a href={resetLink} className="text-sm font-bold text-blue-600 break-all underline hover:text-blue-700">
                  {resetLink}
                </a>
              </div>
              
              <Link 
                to="/login" 
                className="block w-full py-4 bg-slate-900 text-white text-center font-black rounded-2xl hover:bg-slate-800 transition-all shadow-lg"
              >
                Return to Login
              </Link>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-2">
                <label className="text-xs font-black text-slate-400 uppercase tracking-widest ml-1">Email Address</label>
                <div className="relative group">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400 group-focus-within:text-blue-600 transition-colors">
                    <EnvelopeIcon className="w-5 h-5" />
                  </div>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full pl-11 pr-4 py-4 bg-slate-50 border border-slate-100 rounded-2xl outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all font-medium"
                    placeholder="name@company.com"
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
                disabled={status === 'loading'}
                className="w-full py-4 bg-blue-600 text-white font-black rounded-2xl hover:bg-blue-700 transition-all active:scale-[0.98] shadow-xl shadow-blue-200 disabled:opacity-50 disabled:active:scale-100"
              >
                {status === 'loading' ? 'Sending...' : 'Send Reset Link'}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};

export default ForgotPassword;
