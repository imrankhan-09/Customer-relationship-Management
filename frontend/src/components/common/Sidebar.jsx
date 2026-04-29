// src/components/common/Sidebar.jsx
import React from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../../context/AuthProvider';
import {
  HomeIcon,
  UserGroupIcon,
  DocumentPlusIcon,
  ClipboardDocumentListIcon,
  CalendarIcon,
  BeakerIcon,
  ShoppingBagIcon,
  ChartBarIcon,
  CreditCardIcon,
  FolderIcon,
  UserIcon,
  ClockIcon,
  ShieldCheckIcon,
  ViewColumnsIcon
} from '@heroicons/react/24/outline';

const Sidebar = () => {
  const { user, hasPermission } = useAuth();

  // Admin gets their original dedicated navigation — untouched
  const adminLinks = [
    { to: '/admin-dashboard', icon: HomeIcon, label: 'Dashboard' },
    { to: '/admin/users', icon: UserGroupIcon, label: 'Manage Users' },
    { to: '/admin/leads', icon: ClipboardDocumentListIcon, label: 'All Leads' },
    { to: '/admin/roles', icon: ShieldCheckIcon, label: 'Manage Roles' },
    { to: '/admin/permissions', icon: DocumentPlusIcon, label: 'Permissions' },
    { to: '/dashboard?view=pipeline', icon: ViewColumnsIcon, label: 'Sales Pipeline' },
    { to: '/admin/reports', icon: ChartBarIcon, label: 'Reports' },
  ];

  // Non-admin users get dynamic permission-based navigation
  const nonAdminLinks = [
    { 
      to: '/dashboard', 
      icon: HomeIcon, 
      label: 'Dashboard', 
      show: hasPermission('leads', 'view') 
    },
    { 
      to: '/creator/create-lead', 
      icon: DocumentPlusIcon, 
      label: 'Create Lead', 
      show: hasPermission('leads', 'create') 
    },
    { 
      to: '/creator/my-leads', 
      icon: FolderIcon, 
      label: 'My Leads', 
      show: hasPermission('leads', 'create') && user?.role === 'creator'
    },
    { 
      to: '/approver/pending-leads', 
      icon: ClockIcon, 
      label: 'Pending Approval', 
      show: user?.role === 'approver' && hasPermission('leads', 'edit') 
    },
    { 
      to: '/approver/verified-leads', 
      icon: ShieldCheckIcon, 
      label: 'Approved Leads', 
      show: hasPermission('approved_leads', 'view') 
    },
    { 
      to: '/approver/assign-leads', 
      icon: UserGroupIcon, 
      label: 'Assign Leads', 
      show: user?.role === 'approver' 
    },
    { 
      to: '/approver/assigned-leads', 
      icon: ClipboardDocumentListIcon, 
      label: 'Assigned Leads', 
      show: user?.role === 'approver' 
    },
    { 
      to: '/worker/assigned-leads', 
      icon: ClipboardDocumentListIcon, 
      label: 'My Assignments', 
      show: user?.role === 'worker' 
    },
    { 
      to: '/worker/follow-ups', 
      icon: CalendarIcon, 
      label: 'Follow-ups', 
      show: user?.role === 'worker' 
    },
    { 
      to: '/doctors', 
      icon: UserIcon, 
      label: 'Doctors', 
      show: user?.role === 'worker' || user?.role === 'approver'
    },
    { 
      to: '/reports/leads', 
      icon: ChartBarIcon, 
      label: 'Reports', 
      show: hasPermission('reports', 'view') 
    },
    { 
      to: '/dashboard?view=pipeline', 
      icon: ViewColumnsIcon, 
      label: 'Sales Pipeline', 
      show: user?.role !== 'creator' // Workers and Approvers usually care about pipeline
    },
  ];

  // Admin uses its own fixed nav; others use filtered dynamic nav
  const links = user?.role === 'admin' 
    ? adminLinks 
    : nonAdminLinks.filter(l => l.show);

  return (
    <aside className="w-64 bg-white border-r border-gray-200 hidden md:flex flex-col">
      <div className="p-4 border-b border-gray-200">
        <h2 className="text-xl font-bold text-blue-600">Medbridge CRM</h2>
      </div>
      <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
        {links.map((link) => (
          <NavLink
            key={link.to}
            to={link.to}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2 rounded-xl text-sm font-medium transition ${isActive
                ? 'bg-blue-50 text-blue-700'
                : 'text-gray-700 hover:bg-gray-100'
              }`
            }
          >
            <link.icon className="w-5 h-5" />
            {link.label}
          </NavLink>
        ))}
      </nav>
    </aside>
  );
};

export default Sidebar;