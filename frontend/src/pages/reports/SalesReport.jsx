// src/pages/reports/SalesReport.jsx
import React from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

const revenueData = [
  { month: 'Jan', revenue: 12500 },
  { month: 'Feb', revenue: 15000 },
  { month: 'Mar', revenue: 18000 },
  { month: 'Apr', revenue: 22000 },
];

const SalesReport = () => {
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-800">Sales Report</h1>
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-white p-5 rounded-2xl shadow-sm border"><p className="text-gray-500">Total Revenue</p><p className="text-2xl font-bold">$67,500</p></div>
        <div className="bg-white p-5 rounded-2xl shadow-sm border"><p className="text-gray-500">Avg Deal Size</p><p className="text-2xl font-bold">$2,250</p></div>
        <div className="bg-white p-5 rounded-2xl shadow-sm border"><p className="text-gray-500">Conversion Rate</p><p className="text-2xl font-bold">24%</p></div>
      </div>
      <div className="bg-white rounded-2xl shadow-sm border p-5"><h3 className="font-semibold mb-4">Revenue Trend</h3><div className="h-80"><ResponsiveContainer><AreaChart data={revenueData}><CartesianGrid strokeDasharray="3 3" /><XAxis dataKey="month" /><YAxis /><Tooltip /><Area type="monotone" dataKey="revenue" stroke="#8884d8" fill="#8884d8" /></AreaChart></ResponsiveContainer></div></div>
    </div>
  );
};

export default SalesReport;