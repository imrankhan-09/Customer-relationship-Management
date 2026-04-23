// src/pages/patient/PatientReports.jsx
import React from 'react';
import { DocumentIcon, ArrowDownTrayIcon } from '@heroicons/react/24/outline';

const dummyReports = [
  { id: 1, name: 'Complete Blood Count (CBC)', date: '2024-03-15', lab: 'MediLab', status: 'Final' },
  { id: 2, name: 'Lipid Profile', date: '2024-03-10', lab: 'City Diagnostics', status: 'Final' },
  { id: 3, name: 'HbA1c', date: '2024-03-05', lab: 'MediLab', status: 'Final' },
  { id: 4, name: 'ECG Report', date: '2024-02-28', lab: 'Heart Care Center', status: 'Final' },
];

const PatientReports = () => {
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-800">Patient Reports</h1>
        <button className="bg-blue-600 text-white px-4 py-2 rounded-xl text-sm font-medium">Upload New Report</button>
      </div>
      <div className="bg-white rounded-2xl shadow-sm border overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Report Name</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Lab</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Download</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {dummyReports.map(report => (
              <tr key={report.id} className="hover:bg-gray-50">
                <td className="px-6 py-4 whitespace-nowrap font-medium flex items-center gap-2"><DocumentIcon className="w-5 h-5 text-gray-400" /> {report.name}</td>
                <td className="px-6 py-4 whitespace-nowrap">{report.date}</td>
                <td className="px-6 py-4 whitespace-nowrap">{report.lab}</td>
                <td className="px-6 py-4 whitespace-nowrap"><span className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full">{report.status}</span></td>
                <td className="px-6 py-4 whitespace-nowrap"><button className="text-blue-600 hover:text-blue-800"><ArrowDownTrayIcon className="w-5 h-5" /></button></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default PatientReports;