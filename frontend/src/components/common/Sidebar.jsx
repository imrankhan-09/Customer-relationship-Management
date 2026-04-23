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
} from '@heroicons/react/24/outline';

const Sidebar = () => {
  const { user } = useAuth();
  const role = user?.role;

  const creatorLinks = [
    { to: '/creator/dashboard', icon: HomeIcon, label: 'Dashboard' },
    { to: '/creator/create-lead', icon: DocumentPlusIcon, label: 'Create Lead' },
    { to: '/creator/my-leads', icon: ClipboardDocumentListIcon, label: 'My Leads' },
    { to: '/reports/leads', icon: ChartBarIcon, label: 'Reports' },
  ];

  const approverLinks = [
    { to: '/approver/dashboard', icon: HomeIcon, label: 'Dashboard' },
    { to: '/approver/pending-leads', icon: ClockIcon, label: 'Pending Leads' },
    { to: '/approver/verified-leads', icon: ClipboardDocumentListIcon, label: 'Approved' },
    { to: '/approver/assign-leads', icon: UserGroupIcon, label: 'Assign Portal' },
    { to: '/approver/assigned-leads', icon: UserGroupIcon, label: 'Track Assignments' },
    { to: '/reports/leads', icon: ChartBarIcon, label: 'Reports' },
  ];

  const workerLinks = [
    { to: '/worker/dashboard', icon: HomeIcon, label: 'Dashboard' },
    { to: '/worker/assigned-leads', icon: ClipboardDocumentListIcon, label: 'Assigned Leads' },
    { to: '/worker/follow-ups', icon: CalendarIcon, label: 'Follow-ups' },
  ];

  const commonLinks = [
    { to: '/doctors', icon: UserIcon, label: 'Doctors' },
    { to: '/lab', icon: BeakerIcon, label: 'Lab' },
    { to: '/pharmacy/inventory', icon: ShoppingBagIcon, label: 'Pharmacy' },
    { to: '/reports/leads', icon: ChartBarIcon, label: 'Reports' },
    { to: '/subscription/plans', icon: CreditCardIcon, label: 'Subscription' },
  ];

  let links = [];
  if (role === 'creator') links = creatorLinks;
  else if (role === 'approver') links = approverLinks;
  else if (role === 'worker') links = workerLinks;

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
        {role !== 'creator' && (
          <div className="pt-4 mt-4 border-t border-gray-200">
            <p className="px-3 text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
              Modules
            </p>
            {commonLinks.map((link) => (
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
          </div>
        )}
      </nav>
    </aside>
  );
};

export default Sidebar;