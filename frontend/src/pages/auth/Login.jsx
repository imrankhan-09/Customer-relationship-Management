import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthProvider';
import api from '../../api/api';
import { 
  EnvelopeIcon, 
  LockClosedIcon, 
  CheckCircleIcon,
  ShieldCheckIcon,
} from '@heroicons/react/24/outline';

const Login = () => {

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      const response = await api.post('/auth/login', { email, password });
      
      const { token, user } = response.data;

      // Store token in localStorage
      localStorage.setItem('token', token);

      // Update Auth context (includes permissions)
      login(user);

      // Dynamic redirect based on role from database
      const role = user.role?.toLowerCase();
      const dashboardMap = {
        admin: '/admin-dashboard',
        manager: '/manager-dashboard',
        employee: '/employee-dashboard',
        hr: '/hr-dashboard',
        sales: '/sales-dashboard',
        creator: '/creator/dashboard',
        approver: '/approver/dashboard',
        worker: '/worker/dashboard',
      };

      const redirectPath = dashboardMap[role] || `/${role}/dashboard`;
      navigate(redirectPath);
    } catch (err) {
      console.error('Login error:', err);
      setError(err.response?.data?.message || 'Something went wrong. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full flex overflow-hidden bg-slate-50 relative">
      {/* Background Decorative Elements */}
      <div className="absolute top-0 -left-4 w-72 h-72 bg-blue-400 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob"></div>
      <div className="absolute top-0 -right-4 w-72 h-72 bg-purple-400 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-2000"></div>
      <div className="absolute -bottom-8 left-20 w-72 h-72 bg-indigo-400 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-4000"></div>

      {/* Left Side: Branding (Hidden on mobile) */}
      <div className="hidden lg:flex lg:w-1/2 flex-col justify-center p-12 bg-blue-600 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-blue-600 to-indigo-800"></div>
        
        {/* Abstract shapes in background */}
        <div className="absolute top-1/4 -right-20 w-64 h-64 border-4 border-white/10 rounded-full animate-float"></div>
        <div className="absolute bottom-1/4 -left-20 w-96 h-96 border-4 border-white/5 rounded-full animate-float animation-delay-2000"></div>
        
        <div className="relative z-10 max-w-lg">
          <div className="flex items-center space-x-3 mb-8">
            <div className="p-3 bg-white/10 backdrop-blur-md rounded-2xl border border-white/20">
              <ShieldCheckIcon className="w-10 h-10 text-white" />
            </div>
            <h1 className="text-4xl font-bold text-white tracking-tight">Medbridge CRM</h1>
          </div>
          <p className="text-blue-200/60 text-sm font-medium tracking-widest uppercase mb-4">Advanced Healthcare & Lead Management System</p>
          
          <h2 className="text-5xl font-extrabold text-white leading-tight mb-6">
            The Next Generation of <span className="text-blue-200">Patient & Sales Management.</span>
          </h2>
          <p className="text-xl text-blue-100/80 leading-relaxed mb-8">
            Streamline your clinical workflows, manage patient data securely, and improve care coordination with our unified platform.
          </p>
          
          <div className="space-y-4">
            {[
              'End-to-end encrypted medical records',
              'Real-time coordination between teams',
              'Automated reporting & analytics'
            ].map((feature, idx) => (
              <div key={idx} className="flex items-center space-x-3 text-blue-50">
                <CheckCircleIcon className="w-6 h-6 text-blue-300" />
                <span className="font-medium">{feature}</span>
              </div>
            ))}
          </div>
        </div>
        
        <div className="absolute bottom-10 left-12 text-blue-200/50 text-sm">
          © 2024 Medbridge CRM Solutions Inc. All rights reserved.
        </div>
      </div>

      {/* Right Side: Login Form */}
      <div className="w-full lg:w-1/2 flex flex-col items-center justify-center p-6 sm:p-12 relative">
        <div className="w-full max-w-md">
          {/* Mobile Header */}
          <div className="lg:hidden flex items-center justify-center space-x-2 mb-8">
            <ShieldCheckIcon className="w-8 h-8 text-blue-600" />
            <h1 className="text-2xl font-bold text-slate-800 tracking-tight">Medbridge CRM</h1>
          </div>
          <p className="lg:hidden text-center text-slate-500 text-xs font-medium uppercase tracking-wider mb-6">Advanced Healthcare & Lead Management System</p>

          <div className="mb-10">
            <h2 className="text-3xl font-bold text-slate-900 mb-2">Welcome Back</h2>
            <p className="text-slate-500">Sign in to access your dashboard</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {error && (
              <div className="p-4 bg-rose-50 border border-rose-100 rounded-2xl flex items-start space-x-3 animate-in slide-in-from-top-2 duration-300">
                <div className="bg-rose-100 p-1 rounded-lg">
                  <ShieldCheckIcon className="w-4 h-4 text-rose-600" />
                </div>
                <p className="text-sm font-bold text-rose-800">{error}</p>
              </div>
            )}

            <div className="space-y-2">
              <label className="text-sm font-semibold text-slate-700 ml-1">Email Address</label>
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400 group-focus-within:text-blue-600 transition-colors">
                  <EnvelopeIcon className="w-5 h-5" />
                </div>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-11 pr-4 py-3.5 glass-input rounded-2xl outline-none"
                  placeholder="name@company.com"
                />
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex justify-between items-center ml-1">
                <label className="text-sm font-semibold text-slate-700">Password</label>
                <Link to="/forgot-password" size="sm" className="text-xs font-semibold text-blue-600 hover:text-blue-700">Forgot password?</Link>
              </div>

              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400 group-focus-within:text-blue-600 transition-colors">
                  <LockClosedIcon className="w-5 h-5" />
                </div>
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-11 pr-4 py-3.5 glass-input rounded-2xl outline-none"
                  placeholder="••••••••"
                />
              </div>
            </div>

            <div className="flex items-center space-x-2 ml-1">
              <input type="checkbox" id="remember" className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500 border-slate-300" />
              <label htmlFor="remember" className="text-sm text-slate-600">Keep me signed in</label>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-4 bg-blue-600 text-white rounded-2xl font-bold shadow-lg shadow-blue-200 hover:bg-blue-700 hover:shadow-blue-300 transform active:scale-[0.98] transition-all flex items-center justify-center space-x-2 disabled:opacity-70"
            >
              {isLoading ? (
                <div className="w-6 h-6 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
              ) : (
                <>
                  <span>Sign In to Dashboard</span>
                </>
              )}
            </button>
          </form>

          <div className="mt-10 pt-6 border-t border-slate-100 text-center">
            <p className="text-slate-500 text-sm">
              Don't have an account? <a href="#" className="font-bold text-blue-600 hover:text-blue-700">Contact Admin</a>
            </p>
          </div>
          
          <div className="mt-8 p-4 rounded-2xl bg-amber-50 border border-amber-100 flex items-start space-x-3">
            <div className="bg-amber-100 p-1 rounded-lg mt-0.5">
              <CheckCircleIcon className="w-4 h-4 text-amber-600" />
            </div>
            <p className="text-xs text-amber-800 leading-relaxed">
              <strong>Secure Login:</strong> Your role and permissions are automatically detected from your account. No manual role selection needed.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;