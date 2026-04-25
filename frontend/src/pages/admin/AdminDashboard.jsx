import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../../api/api';
import {
  UsersIcon,
  DocumentTextIcon,
  ShieldCheckIcon,
  UserPlusIcon,
  ChartBarIcon,
  ArrowTrendingUpIcon,
  ClockIcon
} from '@heroicons/react/24/outline';

const AdminDashboard = () => {
  const [stats, setStats] = useState(null);
  const [loginStats, setLoginStats] = useState(null);
  const [recentLogins, setRecentLogins] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [statsRes, loginStatsRes, loginsRes] = await Promise.all([
        api.get('/admin/dashboard-stats'),
        api.get('/admin/login-stats'),
        api.get('/admin/recent-logins')
      ]);
      setStats(statsRes.data);
      setLoginStats(loginStatsRes.data);
      setRecentLogins(loginsRes.data);
    } catch (err) {
      console.error('Dashboard data error:', err);
      setError(err.response?.data?.message || 'Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 bg-red-50 border border-red-200 rounded-xl text-red-700">
        {error}
      </div>
    );
  }

  const statCards = [
    {
      title: 'Total Users',
      value: stats?.totalUsers || 0,
      icon: UsersIcon,
      color: 'bg-blue-500',
      lightColor: 'bg-blue-50',
      textColor: 'text-blue-600',
      link: '/admin/users',
    },
    {
      title: 'Active Users',
      value: stats?.activeUsers || 0,
      icon: ArrowTrendingUpIcon,
      color: 'bg-emerald-500',
      lightColor: 'bg-emerald-50',
      textColor: 'text-emerald-600',
    },
    {
      title: 'Total Logins',
      value: loginStats?.totalLogins || 0,
      icon: DocumentTextIcon,
      color: 'bg-violet-500',
      lightColor: 'bg-violet-50',
      textColor: 'text-violet-600',
    },
    {
      title: 'Failed Attempts',
      value: loginStats?.failedLogins || 0,
      icon: ShieldCheckIcon,
      color: 'bg-rose-500',
      lightColor: 'bg-rose-50',
      textColor: 'text-rose-600',
    },
  ];

  const formatTime = (timestamp) => {
    return new Date(timestamp).toLocaleString('en-US', {
      day: 'numeric', month: 'short', year: 'numeric',
      hour: '2-digit', minute: '2-digit'
    });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Admin Dashboard</h1>
          <p className="text-gray-500 mt-1">Manage users, track logins, and system settings</p>
        </div>
        <div className="flex gap-3">
          <Link
            to="/admin/users"
            className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-xl text-sm font-medium hover:bg-blue-700 transition"
          >
            <UserPlusIcon className="w-4 h-4" />
            Manage Users
          </Link>
          <Link
            to="/admin/roles"
            className="inline-flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 text-gray-700 rounded-xl text-sm font-medium hover:bg-gray-50 transition"
          >
            <ShieldCheckIcon className="w-4 h-4" />
            Manage Roles
          </Link>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((card, idx) => {
          const Icon = card.icon;
          const Wrapper = card.link ? Link : 'div';
          const wrapperProps = card.link ? { to: card.link } : {};
          return (
            <Wrapper
              key={idx}
              {...wrapperProps}
              className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm hover:shadow-md transition-shadow cursor-pointer"
            >
              <div className="flex items-center justify-between mb-3">
                <div className={`p-2.5 rounded-xl ${card.lightColor}`}>
                  <Icon className={`w-5 h-5 ${card.textColor}`} />
                </div>
                <span className={`text-xs font-semibold px-2 py-1 rounded-lg ${card.lightColor} ${card.textColor}`}>
                  Live
                </span>
              </div>
              <p className="text-2xl font-bold text-gray-900">{card.value}</p>
              <p className="text-sm text-gray-500 mt-1">{card.title}</p>
            </Wrapper>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Role Distribution */}
        <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
          <div className="flex items-center gap-2 mb-4">
            <ChartBarIcon className="w-5 h-5 text-blue-600" />
            <h2 className="text-lg font-semibold text-gray-900">Role Distribution</h2>
          </div>
          <div className="space-y-3">
            {stats?.roleStats?.map((role, idx) => {
              const total = stats.totalUsers || 1;
              const percentage = Math.round((parseInt(role.count) / total) * 100);
              const colors = [
                'bg-blue-500', 'bg-emerald-500', 'bg-violet-500', 'bg-amber-500',
                'bg-rose-500', 'bg-cyan-500', 'bg-pink-500', 'bg-indigo-500',
              ];
              return (
                <div key={idx}>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm font-medium text-gray-700 capitalize">{role.role_name}</span>
                    <span className="text-sm text-gray-500">{role.count} users ({percentage}%)</span>
                  </div>
                  <div className="w-full bg-gray-100 rounded-full h-2">
                    <div
                      className={`h-2 rounded-full transition-all duration-500 ${colors[idx % colors.length]}`}
                      style={{ width: `${Math.max(percentage, 2)}%` }}
                    />
                  </div>
                </div>
              );
            })}
            {(!stats?.roleStats || stats.roleStats.length === 0) && (
              <p className="text-sm text-gray-400 text-center py-4">No role data available</p>
            )}
          </div>
        </div>

        {/* Recent Logins */}
        <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <ClockIcon className="w-5 h-5 text-blue-600" />
              <h2 className="text-lg font-semibold text-gray-900">Recent Logins</h2>
            </div>
          </div>
          <div className="space-y-3">
            {recentLogins.map((log) => (
              <div
                key={log.id}
                className="flex items-center justify-between p-3 rounded-xl bg-gray-50 border border-gray-100"
              >
                <div>
                  <p className="text-sm font-medium text-gray-900">{log.name || log.email}</p>
                  <p className="text-xs text-gray-500">{formatTime(log.login_time)}</p>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-gray-500">{log.ip_address}</span>
                  <span className={`px-2 py-1 rounded-lg text-xs font-semibold ${log.status === 'success' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
                    {log.status}
                  </span>
                </div>
              </div>
            ))}
            {recentLogins.length === 0 && (
              <p className="text-sm text-gray-400 text-center py-4">No recent logins</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
