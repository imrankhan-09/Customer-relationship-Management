import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthProvider';
import api from '../../api/api';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import {
  ChartBarIcon,
  UserGroupIcon,
  ArrowDownTrayIcon,
  PhoneIcon,
  EnvelopeIcon,
  CalendarIcon,
  ClipboardDocumentCheckIcon,
  ArrowRightCircleIcon
} from '@heroicons/react/24/outline';

const LeadsReport = () => {
  const { user } = useAuth();

  const [reportView, setReportView] = useState('creator'); // 'creator' or 'worker'
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  const [dateRange, setDateRange] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');

  // For Approver only
  const [creators, setCreators] = useState([]);
  const [workers, setWorkers] = useState([]);
  const [selectedUserId, setSelectedUserId] = useState('all');

  // Lead details view for Worker
  const [selectedLeadDetails, setSelectedLeadDetails] = useState(null);

  useEffect(() => {
    if (user?.role === 'creator') {
      setReportView('creator');
      setSelectedUserId(user.id);
    } else if (user?.role === 'approver') {
      fetchUsers();
    }
  }, [user]);

  useEffect(() => {
    if (user?.role === 'creator' || user?.role === 'approver') {
      fetchReport();
    } else {
      setLoading(false);
    }
  }, [reportView, dateRange, statusFilter, selectedUserId, user]);

  const fetchUsers = async () => {
    try {
      const [cr, wr] = await Promise.all([
        api.get('/users?role=creator'),
        api.get('/users?role=worker')
      ]);
      setCreators(cr.data);
      setWorkers(wr.data);
    } catch (err) {
      console.error('Error fetching users:', err);
    }
  };

  const fetchReport = async () => {
    try {
      setLoading(true);
      setData(null);
      setSelectedLeadDetails(null);

      let start_date = '';
      let end_date = '';

      const today = new Date();
      if (dateRange === 'today') {
        start_date = today.toISOString().split('T')[0];
        end_date = start_date;
      } else if (dateRange === 'week') {
        const firstDay = new Date(today.setDate(today.getDate() - today.getDay()));
        start_date = firstDay.toISOString().split('T')[0];
        end_date = new Date().toISOString().split('T')[0];
      } else if (dateRange === 'month') {
        const firstDay = new Date(today.getFullYear(), today.getMonth(), 1);
        start_date = firstDay.toISOString().split('T')[0];
        end_date = new Date().toISOString().split('T')[0];
      }

      let query = `?status=${statusFilter}`;
      if (start_date) query += `&start_date=${start_date}`;
      if (end_date) query += `&end_date=${end_date}`;

      if (user?.role === 'approver') {
        if (reportView === 'creator') query += `&creator_id=${selectedUserId}`;
        if (reportView === 'worker') query += `&worker_id=${selectedUserId}`;
      }

      const endpoint = reportView === 'creator' ? `/reports/creator${query}` : `/reports/worker${query}`;
      const res = await api.get(endpoint);
      console.log('Reports API Response:', res.data);
      setData(res.data);
    } catch (err) {
      console.error('Error fetching reports:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadPDF = () => {
    if (!data) return;
    const doc = new jsPDF();

    doc.setFontSize(20);
    const title = reportView === 'creator' ? 'Creator Performance Report' : 'Worker Performance Report';
    doc.text(title, 14, 22);

    doc.setFontSize(12);
    const printedName = user.role === 'approver' && selectedUserId !== 'all'
      ? (reportView === 'creator' ? creators.find(c => c.id == selectedUserId)?.name : workers.find(w => w.id == selectedUserId)?.name)
      : (user.role === 'creator' ? user.name : 'All');

    doc.text(`User: ${printedName || 'Unknown'}`, 14, 32);
    doc.text(`Date Range: ${dateRange.toUpperCase()}`, 14, 38);
    doc.text(`Status Filter: ${statusFilter.toUpperCase()}`, 14, 44);

    if (reportView === 'creator') {
      doc.text(`Total Leads: ${data.total_leads}`, 14, 54);
      doc.text(`Pending: ${data.status_counts.pending}`, 14, 60);
      doc.text(`Approved: ${data.status_counts.approved}`, 14, 66);
      doc.text(`Rejected: ${data.status_counts.rejected}`, 14, 72);
      doc.text(`Assigned: ${data.status_counts.assigned}`, 14, 78);
      doc.text(`Converted: ${data.status_counts.converted}`, 14, 84);

      if (data.leads && data.leads.length > 0) {
        const tableColumn = ["Date", "Name", "Type", "Status"];
        const tableRows = data.leads.map(lead => [
          new Date(lead.created_at).toLocaleDateString(),
          lead.name,
          lead.type || 'N/A',
          (lead.status === 'approved' && lead.assigned_to) ? 'assigned' : lead.status
        ]);
        autoTable(doc, { startY: 94, head: [tableColumn], body: tableRows });
      }
    } else {
      // Worker PDF Output
      const sum = data.summary || {};
      doc.text(`Assigned Leads: ${sum.total_assigned || 0}`, 14, 54);
      doc.text(`Worked On: ${sum.total_worked_on || 0}`, 14, 60);
      doc.text(`In Progress: ${sum.in_progress || 0}`, 14, 66);
      doc.text(`Converted (Won): ${sum.converted || 0}`, 14, 72);
      doc.text(`Lost: ${sum.lost || 0}`, 14, 78);
      doc.text(`Total Activities: ${sum.total_activities || 0}`, 14, 84);
      doc.text(`Pending Follow-ups: ${sum.pending_followups || 0}`, 14, 90);

      if (data.leads && data.leads.length > 0) {
        const tableColumn = ["Date Assigned", "Name", "Stage", "Activities"];
        const tableRows = data.leads.map(lead => {
          const actCount = data.activities.filter(a => a.lead_id === lead.id).length;
          return [
            new Date(lead.created_at).toLocaleDateString(),
            lead.name,
            lead.pipeline_stage || 'new',
            actCount
          ];
        });
        autoTable(doc, { startY: 100, head: [tableColumn], body: tableRows });
      }
    }

    doc.save(`${reportView}_report_${new Date().getTime()}.pdf`);
  };

  if (user?.role !== 'creator' && user?.role !== 'approver') {
    return (
      <div className="bg-white rounded-2xl border p-12 text-center shadow-sm">
        <h2 className="text-xl font-bold text-gray-800 mb-2">Access Restricted</h2>
        <p className="text-gray-500 font-medium">Detailed reports are not available for your role.</p>
      </div>
    );
  }

  // Creator View Render Component
  const renderCreatorView = () => {
    if (!data) return null;
    if (data.total_leads === 0) return <EmptyState />;

    const pieData = Object.entries(data.status_counts)
      .filter(([_, count]) => count > 0)
      .map(([status, count]) => ({ name: status.toUpperCase(), value: count }));

    return (
      <>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          <StatCard title="Total Leads" value={data.total_leads} color="slate" />
          <StatCard title="Pending" value={data.status_counts.pending} color="amber" />
          <StatCard title="Approved" value={data.status_counts.approved} color="emerald" />
          <StatCard title="Rejected" value={data.status_counts.rejected} color="rose" />
          <StatCard title="Assigned" value={data.status_counts.assigned} color="blue" />
          <StatCard title="Converted" value={data.status_counts.converted} color="purple" />
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <ChartCard title="Leads Over Time">
            <ResponsiveContainer>
              <BarChart data={data.timeline}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                <XAxis dataKey="date" tick={{ fontSize: 12, fill: '#64748B' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 12, fill: '#64748B' }} axisLine={false} tickLine={false} />
                <RechartsTooltip cursor={{ fill: '#F1F5F9' }} contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                <Bar dataKey="count" fill="#3B82F6" radius={[6, 6, 0, 0]} name="Leads Created" />
              </BarChart>
            </ResponsiveContainer>
          </ChartCard>
          <ChartCard title="Status Distribution">
            <ResponsiveContainer>
              <PieChart>
                <Pie data={pieData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={100} label>
                  {pieData.map((entry, index) => {
                    const colors = { 'PENDING': '#F59E0B', 'APPROVED': '#10B981', 'REJECTED': '#E11D48', 'ASSIGNED': '#3B82F6', 'CONVERTED': '#9333EA' };
                    return <Cell key={index} fill={colors[entry.name] || '#CBD5E1'} />;
                  })}
                </Pie>
                <RechartsTooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                <Legend wrapperStyle={{ paddingTop: '20px' }} />
              </PieChart>
            </ResponsiveContainer>
          </ChartCard>
        </div>
      </>
    );
  };

  // Worker View Render Component
  const renderWorkerView = () => {
    if (!data) return null;
    const sum = data.summary || {};
    if ((sum.total_assigned || 0) === 0 && (sum.total_activities || 0) === 0) return <EmptyState />;

    const pieData = Object.entries(data.act_types || {})
      .filter(([_, count]) => count > 0)
      .map(([type, count]) => ({ name: type, value: count }));

    const stageColors = { 'new': '#94A3B8', 'contacted': '#3B82F6', 'demo': '#8B5CF6', 'negotiation': '#F59E0B', 'won': '#10B981', 'lost': '#EF4444' };
    const COLORS_ARRAY = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#14B8A6'];

    return (
      <div className="space-y-6">
        {/* Summary Stats */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          <StatCard title="Assigned Leads" value={sum.total_assigned || 0} color="slate" />
          <StatCard title="Worked On" value={sum.total_worked_on || 0} color="blue" />
          <StatCard title="In Progress" value={sum.in_progress || 0} color="amber" />
          <StatCard title="Won (Converted)" value={sum.converted || 0} color="emerald" />
          <StatCard title="Lost" value={sum.lost || 0} color="rose" />
        </div>

        {/* Activity Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="glass-card rounded-3xl p-6 flex items-center justify-between col-span-1 border-l-4 border-indigo-500">
            <div>
              <p className="text-sm font-bold text-slate-500 uppercase tracking-widest">Total Activities</p>
              <p className="text-4xl font-black text-slate-800 mt-2">{sum.total_activities || 0}</p>
            </div>
            <ClipboardDocumentCheckIcon className="w-12 h-12 text-indigo-200" />
          </div>
          <div className="glass-card rounded-3xl p-6 flex flex-col justify-center col-span-2">
            <div className="flex items-center justify-between gap-4">
              <div className="flex-1">
                <p className="text-xs font-bold text-emerald-500 uppercase tracking-widest">Completed Follow-ups</p>
                <p className="text-2xl font-black text-emerald-600">{sum.completed_followups || 0}</p>
              </div>
              <div className="h-12 w-px bg-slate-200"></div>
              <div className="flex-1">
                <p className="text-xs font-bold text-amber-500 uppercase tracking-widest">Pending Follow-ups</p>
                <p className="text-2xl font-black text-amber-600">{sum.pending_followups || 0}</p>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <ChartCard title="Activity Types">
            <ResponsiveContainer>
              <PieChart>
                <Pie data={pieData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={100} label>
                  {pieData.map((entry, index) => (
                    <Cell key={index} fill={COLORS_ARRAY[index % COLORS_ARRAY.length]} />
                  ))}
                </Pie>
                <RechartsTooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                <Legend wrapperStyle={{ paddingTop: '20px' }} />
              </PieChart>
            </ResponsiveContainer>
          </ChartCard>
          <ChartCard title="Activities Over Time">
            <ResponsiveContainer>
              <BarChart data={data.timeline || []}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                <XAxis dataKey="date" tick={{ fontSize: 12, fill: '#64748B' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 12, fill: '#64748B' }} axisLine={false} tickLine={false} />
                <RechartsTooltip cursor={{ fill: '#F1F5F9' }} contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                <Bar dataKey="count" fill="#8B5CF6" radius={[6, 6, 0, 0]} name="Activities" />
              </BarChart>
            </ResponsiveContainer>
          </ChartCard>
        </div>

        {/* Lead Level Details List */}
        <div className="glass-card rounded-3xl p-6">
          <h3 className="text-lg font-black text-slate-900 mb-6">Assigned Leads Tracking</h3>
          <div className="space-y-4">
            {(data.leads || []).map(lead => {
              const leadActs = (data.activities || []).filter(a => a.lead_id === lead.id);
              const leadOps = data.opportunities?.filter(o => o.lead_id === lead.id) || [];
              const stage = lead.pipeline_stage || 'new';

              return (
                <div key={lead.id} className="p-4 border border-slate-100 rounded-2xl hover:bg-slate-50 transition-colors">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div>
                      <h4 className="font-bold text-slate-800 text-lg">{lead.name}</h4>
                      <p className="text-xs font-medium text-slate-500 uppercase tracking-widest">{lead.type} Lead</p>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="px-3 py-1 bg-slate-100 text-slate-700 text-xs font-bold uppercase rounded-lg border border-slate-200">
                        {stage}
                      </div>
                      <div className="flex items-center gap-2 text-sm font-bold text-indigo-600 bg-indigo-50 px-3 py-1 rounded-lg">
                        <ClipboardDocumentCheckIcon className="w-4 h-4" />
                        {leadActs.length} Activities
                      </div>
                      <button
                        onClick={() => setSelectedLeadDetails(selectedLeadDetails === lead.id ? null : lead.id)}
                        className="p-2 hover:bg-slate-200 rounded-xl transition-colors"
                      >
                        <ArrowRightCircleIcon className={`w-5 h-5 text-slate-400 transition-transform ${selectedLeadDetails === lead.id ? 'rotate-90' : ''}`} />
                      </button>
                    </div>
                  </div>

                  {/* Expanded Timeline View */}
                  {selectedLeadDetails === lead.id && (
                    <div className="mt-4 pt-4 border-t border-slate-100 pl-4 border-l-2 border-indigo-200 space-y-4 animate-in slide-in-from-top-2">
                      {leadOps.length > 0 && (
                        <div className="bg-emerald-50 text-emerald-800 p-3 rounded-xl text-sm font-medium border border-emerald-100">
                          Opportunity created. Status: <span className="font-bold uppercase">{leadOps[0].status}</span>
                          {leadOps[0].status === 'won' && <span> | Value: ${leadOps[0].total_amount}</span>}
                          {leadOps[0].status === 'lost' && <span className="block text-xs mt-1 text-emerald-600">Reason: {leadOps[0].lost_reason}</span>}
                        </div>
                      )}

                      {leadActs.length === 0 ? (
                        <p className="text-sm text-slate-400 italic">No activities recorded yet.</p>
                      ) : (
                        leadActs.map(act => (
                          <div key={act.id} className="relative">
                            <div className="flex items-start gap-3">
                              <div className="mt-1 flex-shrink-0 w-2 h-2 rounded-full bg-indigo-500"></div>
                              <div>
                                <p className="text-sm font-bold text-slate-700">
                                  {act.type} <span className="text-xs text-slate-400 font-normal ml-2">{new Date(act.created_at).toLocaleString()}</span>
                                </p>
                                <p className="text-sm text-slate-600 mt-0.5">{act.description}</p>
                                {act.next_followup && (
                                  <p className="text-xs text-amber-600 font-bold mt-1 flex items-center gap-1">
                                    <CalendarIcon className="w-3 h-3" />
                                    Follow-up: {new Date(act.next_followup).toLocaleDateString()}
                                  </p>
                                )}
                              </div>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500 pb-12">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white/40 backdrop-blur-md p-6 rounded-3xl border border-white/40 shadow-sm">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">
            {user?.role === 'creator' ? 'My Leads Analytics' : 'Performance Analytics'}
          </h1>
          <p className="text-slate-500 text-sm font-medium">Track performance, activities, and export reports</p>
        </div>
        <button
          onClick={handleDownloadPDF}
          disabled={loading || !data}
          className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-2xl font-bold transition-all shadow-lg shadow-blue-200 active:scale-95 disabled:opacity-50"
        >
          <ArrowDownTrayIcon className="w-5 h-5" />
          Download PDF Report
        </button>
      </div>

      {/* Filters */}
      <div className="glass-card rounded-3xl p-6 flex flex-wrap gap-4 items-center">
        {user?.role === 'approver' && (
          <div className="flex items-center bg-slate-100 p-1 rounded-2xl">
            <button
              onClick={() => { setReportView('creator'); setSelectedUserId('all'); }}
              className={`px-6 py-2 rounded-xl text-sm font-bold transition-all ${reportView === 'creator' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
            >
              Creator Reports
            </button>
            <button
              onClick={() => { setReportView('worker'); setSelectedUserId('all'); }}
              className={`px-6 py-2 rounded-xl text-sm font-bold transition-all ${reportView === 'worker' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
            >
              Worker Reports
            </button>
          </div>
        )}

        {user?.role === 'approver' && reportView === 'creator' && (
          <select
            value={selectedUserId}
            onChange={(e) => setSelectedUserId(e.target.value)}
            className="w-full md:w-48 px-4 py-3 bg-slate-50/50 border border-slate-200 rounded-2xl outline-none focus:ring-4 focus:ring-blue-500/10 text-sm font-medium text-slate-700"
          >
            <option value="all">All Creators</option>
            {creators.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
        )}

        {user?.role === 'approver' && reportView === 'worker' && (
          <select
            value={selectedUserId}
            onChange={(e) => setSelectedUserId(e.target.value)}
            className="w-full md:w-48 px-4 py-3 bg-slate-50/50 border border-slate-200 rounded-2xl outline-none focus:ring-4 focus:ring-blue-500/10 text-sm font-medium text-slate-700"
          >
            <option value="all">All Workers</option>
            {workers.map(w => <option key={w.id} value={w.id}>{w.name}</option>)}
          </select>
        )}

        <select
          value={dateRange}
          onChange={(e) => setDateRange(e.target.value)}
          className="w-full md:w-40 px-4 py-3 bg-slate-50/50 border border-slate-200 rounded-2xl outline-none focus:ring-4 focus:ring-blue-500/10 text-sm font-medium text-slate-700"
        >
          <option value="all">All Time</option>
          <option value="today">Today</option>
          <option value="week">This Week</option>
          <option value="month">This Month</option>
        </select>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="w-full md:w-40 px-4 py-3 bg-slate-50/50 border border-slate-200 rounded-2xl outline-none focus:ring-4 focus:ring-blue-500/10 text-sm font-medium text-slate-700"
        >
          <option value="all">All Statuses</option>
          {reportView === 'creator' ? (
            <>
              <option value="pending">Pending</option>
              <option value="approved">Approved</option>
              <option value="rejected">Rejected</option>
              <option value="assigned">Assigned</option>
              <option value="converted">Converted</option>
            </>
          ) : (
            <>
              <option value="new">New</option>
              <option value="contacted">Contacted</option>
              <option value="demo">Demo</option>
              <option value="negotiation">Negotiation</option>
              <option value="won">Won (Converted)</option>
              <option value="lost">Lost</option>
            </>
          )}
        </select>
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 gap-4">
          <div className="w-10 h-10 border-4 border-blue-600/20 border-t-blue-600 rounded-full animate-spin"></div>
          <p className="text-slate-500 font-bold">Aggregating Report Data...</p>
        </div>
      ) : (
        reportView === 'creator' ? renderCreatorView() : renderWorkerView()
      )}
    </div>
  );
};

const StatCard = ({ title, value, color }) => {
  const styles = {
    slate: { text1: 'text-slate-500', text2: 'text-slate-800', border: 'border-b-slate-200' },
    amber: { text1: 'text-amber-500', text2: 'text-amber-600', border: 'border-b-amber-500' },
    emerald: { text1: 'text-emerald-500', text2: 'text-emerald-600', border: 'border-b-emerald-500' },
    rose: { text1: 'text-rose-500', text2: 'text-rose-600', border: 'border-b-rose-500' },
    blue: { text1: 'text-blue-500', text2: 'text-blue-600', border: 'border-b-blue-500' },
    purple: { text1: 'text-purple-500', text2: 'text-purple-600', border: 'border-b-purple-500' },
  };
  return (
    <div className={`glass-card rounded-3xl p-5 text-center border-b-4 ${styles[color].border}`}>
      <p className={`text-[10px] font-black uppercase tracking-widest mb-1 ${styles[color].text1}`}>{title}</p>
      <p className={`text-3xl font-black ${styles[color].text2}`}>{value}</p>
    </div>
  );
};

const ChartCard = ({ title, children }) => (
  <div className="glass-card rounded-3xl p-6">
    <h3 className="text-lg font-black text-slate-900 mb-6">{title}</h3>
    <div className="h-72">
      {children}
    </div>
  </div>
);

const EmptyState = () => (
  <div className="glass-card rounded-3xl p-12 text-center shadow-sm">
    <p className="text-slate-500 font-bold text-lg">No data found for the selected filters.</p>
    <p className="text-slate-400 mt-2">Try adjusting your date range or selecting a different user.</p>
  </div>
);

export default LeadsReport;