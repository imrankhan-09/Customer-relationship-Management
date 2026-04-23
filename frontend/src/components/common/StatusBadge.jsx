// src/components/common/StatusBadge.jsx
import React from 'react';
const statusColors = {
  new: 'bg-blue-100 text-blue-800',
  contacted: 'bg-yellow-100 text-yellow-800',
  demo: 'bg-purple-100 text-purple-800',
  negotiation: 'bg-orange-100 text-orange-800',
  won: 'bg-green-100 text-green-800',
  lost: 'bg-red-100 text-red-800',
  pending: 'bg-gray-100 text-gray-800',
  verified: 'bg-green-100 text-green-800',
  rejected: 'bg-red-100 text-red-800',
};

const StatusBadge = ({ status }) => (
  <span className={`px-2 py-1 rounded-full text-xs font-medium ${statusColors[status.toLowerCase()] || 'bg-gray-100 text-gray-800'}`}>
    {status}
  </span>
);
export default StatusBadge;