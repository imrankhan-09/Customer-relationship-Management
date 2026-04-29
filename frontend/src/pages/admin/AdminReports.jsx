import React, { useEffect, useState } from 'react';
import api from '../../api/api';

const AdminReports = () => {
  const [roleFilter, setRoleFilter] = useState('all');
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [reportData, setReportData] = useState({
    creatorReports: [],
    workerReports: []
  });

  const fetchReports = async () => {
    setLoading(true);
    setError('');
    try {
      const params = {};
      if (roleFilter !== 'all') params.role = roleFilter;
      if (fromDate) params.from = fromDate;
      if (toDate) params.to = toDate;

      const res = await api.get('/admin/reports', { params });
      setReportData({
        creatorReports: res.data?.creatorReports || [],
        workerReports: res.data?.workerReports || []
      });
    } catch (err) {
      setError(err?.response?.data?.message || 'Failed to load reports');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReports();
  }, [roleFilter]);

  const showCreatorTable = roleFilter === 'all' || roleFilter === 'creator';
  const showWorkerTable = roleFilter === 'all' || roleFilter === 'worker';

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Admin Reports</h1>
          <p className="text-gray-500 mt-1">Real-time creator and worker performance data</p>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-4">
        <div className="flex flex-wrap gap-3 items-end">
          <div>
            <label className="block text-xs text-gray-500 mb-1">Role</label>
            <select
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)}
              className="border border-gray-300 rounded-lg p-2 text-sm"
            >
              <option value="all">All</option>
              <option value="creator">Creator</option>
              <option value="worker">Worker</option>
            </select>
          </div>
          <div>
            <label className="block text-xs text-gray-500 mb-1">From</label>
            <input
              type="date"
              value={fromDate}
              onChange={(e) => setFromDate(e.target.value)}
              className="border border-gray-300 rounded-lg p-2 text-sm"
            />
          </div>
          <div>
            <label className="block text-xs text-gray-500 mb-1">To</label>
            <input
              type="date"
              value={toDate}
              onChange={(e) => setToDate(e.target.value)}
              className="border border-gray-300 rounded-lg p-2 text-sm"
            />
          </div>
          <button
            onClick={fetchReports}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition"
          >
            Apply
          </button>
        </div>
      </div>

      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-xl text-red-700">
          {error}
        </div>
      )}

      {loading ? (
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-8 text-center text-gray-500">
          Loading reports...
        </div>
      ) : (
        <div className="space-y-6">
          {showCreatorTable && (
            <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
              <div className="p-4 border-b border-gray-100">
                <h2 className="text-lg font-semibold text-gray-900">Creator Performance</h2>
              </div>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Name</th>
                      <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Leads Created</th>
                      <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Approved</th>
                      <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Rejected</th>
                      <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Converted</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {reportData.creatorReports.length === 0 ? (
                      <tr>
                        <td colSpan="5" className="px-4 py-6 text-center text-sm text-gray-500">
                          No creator report data found
                        </td>
                      </tr>
                    ) : (
                      reportData.creatorReports.map((row) => (
                        <tr key={row.user_id}>
                          <td className="px-4 py-3 text-sm text-gray-900">{row.name}</td>
                          <td className="px-4 py-3 text-sm text-right text-gray-700">{row.leads_created}</td>
                          <td className="px-4 py-3 text-sm text-right text-gray-700">{row.approved_leads}</td>
                          <td className="px-4 py-3 text-sm text-right text-gray-700">{row.rejected_leads}</td>
                          <td className="px-4 py-3 text-sm text-right text-gray-700">{row.converted_leads}</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {showWorkerTable && (
            <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
              <div className="p-4 border-b border-gray-100">
                <h2 className="text-lg font-semibold text-gray-900">Worker Performance</h2>
              </div>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Name</th>
                      <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Assigned Leads</th>
                      <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Completed Activities</th>
                      <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Pending Tasks</th>
                      <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Conversions</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {reportData.workerReports.length === 0 ? (
                      <tr>
                        <td colSpan="5" className="px-4 py-6 text-center text-sm text-gray-500">
                          No worker report data found
                        </td>
                      </tr>
                    ) : (
                      reportData.workerReports.map((row) => (
                        <tr key={row.user_id}>
                          <td className="px-4 py-3 text-sm text-gray-900">{row.name}</td>
                          <td className="px-4 py-3 text-sm text-right text-gray-700">{row.assigned_leads}</td>
                          <td className="px-4 py-3 text-sm text-right text-gray-700">{row.completed_activities}</td>
                          <td className="px-4 py-3 text-sm text-right text-gray-700">{row.pending_followups}</td>
                          <td className="px-4 py-3 text-sm text-right text-gray-700">{row.conversion_count}</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default AdminReports;
