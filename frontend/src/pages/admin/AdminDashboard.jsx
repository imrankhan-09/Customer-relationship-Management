import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../../api/api';
import LoginHistoryModal from './LoginHistoryModal';
import {
  UsersIcon,
  ShieldCheckIcon,
  UserPlusIcon,
  ArrowTrendingUpIcon,
  ClockIcon,
  UserMinusIcon,
  CheckBadgeIcon,
  ExclamationTriangleIcon
} from '@heroicons/react/24/outline';

const AdminDashboard = () => {
  const [stats, setStats] = useState(null);
  const [recentActivity, setRecentActivity] = useState([]);
  const [isHistoryModalOpen, setIsHistoryModalOpen] = useState(false);
  const [selectedUserId, setSelectedUserId] = useState(null);
  const [selectedUserName, setSelectedUserName] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const statsRes = await api.get('/admin/dashboard-stats');
      setStats(statsRes.data);
      setRecentActivity(statsRes.data?.recent_activity || statsRes.data?.recentActivity || []);
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
      value: stats?.total_users ?? stats?.totalUsers ?? 0,
      icon: UsersIcon,
      color: 'bg-blue-500',
      lightColor: 'bg-blue-50',
      textColor: 'text-blue-600',
      link: '/admin/users?status=all',
    },
    {
      title: 'Active Users',
      value: stats?.active_users ?? stats?.activeUsers ?? 0,
      icon: ArrowTrendingUpIcon,
      color: 'bg-emerald-500',
      lightColor: 'bg-emerald-50',
      textColor: 'text-emerald-600',
      link: '/admin/users?status=active'
    },
    {
      title: 'Deactivated Users',
      value: stats?.deactivated_users ?? stats?.deactivatedUsers ?? 0,
      icon: UserMinusIcon,
      color: 'bg-violet-500',
      lightColor: 'bg-violet-50',
      textColor: 'text-violet-600',
      link: '/admin/users?status=inactive'
    },
    {
      title: 'Total Leads',
      value: stats?.total_leads ?? stats?.totalLeads ?? 0,
      icon: ShieldCheckIcon,
      color: 'bg-cyan-500',
      lightColor: 'bg-cyan-50',
      textColor: 'text-cyan-600',
      link: '/admin/leads?status=all'
    },
    {
      title: 'Converted Leads',
      value: stats?.converted_leads ?? stats?.convertedLeads ?? 0,
      icon: CheckBadgeIcon,
      color: 'bg-indigo-500',
      lightColor: 'bg-indigo-50',
      textColor: 'text-indigo-600',
      link: '/admin/leads?status=converted'
    },
    {
      title: 'Failed Login Attempts',
      value: stats?.failed_login_attempts ?? stats?.failedLoginAttempts ?? 0,
      icon: ExclamationTriangleIcon,
      color: 'bg-rose-500',
      lightColor: 'bg-rose-50',
      textColor: 'text-rose-600',
      link: '/admin/users?status=all'
    },
  ];

  const formatTime = (timestamp) => {
    if (!timestamp) return 'Never';
    return new Date(timestamp).toLocaleString('en-US', {
      day: 'numeric', month: 'short', year: 'numeric',
      hour: '2-digit', minute: '2-digit'
    });
  };

  const openHistoryModal = (activity) => {
    setSelectedUserId(activity.id);
    setSelectedUserName(activity.user_name || 'Unknown User');
    setIsHistoryModalOpen(true);
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
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
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

      <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
        <div className="flex items-center gap-2 mb-4">
          <ClockIcon className="w-5 h-5 text-blue-600" />
          <h2 className="text-lg font-semibold text-gray-900">Recent Activity</h2>
        </div>
        <div className="space-y-3">
          {recentActivity.map((item) => (
            <div
              key={item.id}
              onClick={() => openHistoryModal(item)}
              className="p-4 rounded-xl bg-gray-50 border border-gray-100 flex flex-col md:flex-row md:items-center md:justify-between gap-2 cursor-pointer hover:bg-gray-100 transition"
            >
              <div>
                <p className="text-sm font-semibold text-gray-900">{item.user_name || 'Unknown User'}</p>
                <p className="text-xs text-gray-600 capitalize">{item.role_name || 'unknown'} - {item.action || 'activity'}</p>
              </div>
              <div className="text-xs text-gray-500">
                <p>Time: {formatTime(item.action_time)}</p>
                <p>Last Seen: {formatTime(item.last_seen)}</p>
              </div>
            </div>
          ))}
          {recentActivity.length === 0 && (
            <p className="text-sm text-gray-400 text-center py-4">No recent activity</p>
          )}
        </div>
      </div>

      <LoginHistoryModal
        isOpen={isHistoryModalOpen}
        onClose={() => setIsHistoryModalOpen(false)}
        userId={selectedUserId}
        userName={selectedUserName}
      />
    </div>
  );
};

export default AdminDashboard;
