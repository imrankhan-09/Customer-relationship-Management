// src/pages/reports/AppointmentReport.jsx
import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

const appointmentData = [
  { day: 'Mon', scheduled: 12, completed: 10, cancelled: 2 },
  { day: 'Tue', scheduled: 15, completed: 13, cancelled: 1 },
  { day: 'Wed', scheduled: 18, completed: 16, cancelled: 1 },
  { day: 'Thu', scheduled: 14, completed: 12, cancelled: 2 },
  { day: 'Fri', scheduled: 20, completed: 18, cancelled: 1 },
];

const AppointmentReport = () => {
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-800">Appointment Report</h1>
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-white p-5 rounded-2xl shadow-sm border"><p className="text-gray-500">Total Appointments</p><p className="text-2xl font-bold">79</p></div>
        <div className="bg-white p-5 rounded-2xl shadow-sm border"><p className="text-gray-500">Completed</p><p className="text-2xl font-bold text-green-600">69</p></div>
        <div className="bg-white p-5 rounded-2xl shadow-sm border"><p className="text-gray-500">Cancellation Rate</p><p className="text-2xl font-bold text-red-600">8.8%</p></div>
      </div>
      <div className="bg-white rounded-2xl shadow-sm border p-5"><h3 className="font-semibold mb-4">Weekly Appointments</h3><div className="h-80"><ResponsiveContainer><BarChart data={appointmentData}><CartesianGrid strokeDasharray="3 3" /><XAxis dataKey="day" /><YAxis /><Tooltip /><Legend /><Bar dataKey="scheduled" fill="#3B82F6" /><Bar dataKey="completed" fill="#10B981" /><Bar dataKey="cancelled" fill="#EF4444" /></BarChart></ResponsiveContainer></div></div>
    </div>
  );
};

export default AppointmentReport;