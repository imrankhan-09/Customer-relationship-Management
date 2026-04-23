// src/pages/lab/LabReports.jsx
import React from 'react';
import { DocumentIcon, ArrowDownTrayIcon, EyeIcon } from '@heroicons/react/24/outline';
import StatusBadge from '../../components/common/StatusBadge';

const dummyLabReports = [
  { id: 'RPT001', patient: 'John Smith', test: 'CBC', date: '2024-03-15', status: 'Completed' },
  { id: 'RPT002', patient: 'Emma Watson', test: 'Lipid Profile', date: '2024-03-14', status: 'Pending' },
  { id: 'RPT003', patient: 'Robert Brown', test: 'HbA1c', date: '2024-03-13', status: 'Completed' },
  { id: 'RPT004', patient: 'Lisa Ray', test: 'Thyroid', date: '2024-03-12', status: 'Completed' },
];

const LabReports = () => {
  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold text-gray-800">Lab Reports</h1>
      <div className="bg-white rounded-2xl shadow-sm border overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50"><tr><th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Report ID</th><th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Patient</th><th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Test</th><th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th><th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th><th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th></tr></thead>
          <tbody className="divide-y divide-gray-200">
            {dummyLabReports.map(r => (
              <tr key={r.id}><td className="px-6 py-4">{r.id}</td><td className="px-6 py-4">{r.patient}</td><td className="px-6 py-4">{r.test}</td><td className="px-6 py-4">{r.date}</td><td className="px-6 py-4"><StatusBadge status={r.status} /></td><td className="px-6 py-4"><button className="text-blue-600 mr-3"><EyeIcon className="w-5 h-5" /></button><button className="text-green-600"><ArrowDownTrayIcon className="w-5 h-5" /></button></td></tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default LabReports;