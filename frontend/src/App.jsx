// src/App.jsx
import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthProvider';
import { NotificationProvider } from './context/NotificationContext';
// import Login from './pages/auth/Login';
import ProtectedRoute from './routes/ProtectedRoute';
import Login from './pages/auth/Login';
import Layout from './components/common/Layout';
import { lazy, Suspense } from 'react';
import Loader from './components/common/Loader';

const ForgotPassword = lazy(() => import('./pages/auth/ForgotPassword'));
const ResetPassword = lazy(() => import('./pages/auth/ResetPassword'));

// Shared Pages
const UnifiedDashboard = lazy(() => import('./pages/dashboard/UnifiedDashboard'));

// Admin pages
const AdminDashboard = lazy(() => import('./pages/admin/AdminDashboard'));
const UserManagement = lazy(() => import('./pages/admin/UserManagement'));
const AdminLeads = lazy(() => import('./pages/admin/AdminLeads'));
const RoleManagement = lazy(() => import('./pages/admin/RoleManagement'));
const PermissionManagement = lazy(() => import('./pages/admin/PermissionManagement'));
const AdminReports = lazy(() => import('./pages/admin/AdminReports'));

// Lazy load pages
const CreatorDashboard = lazy(() => import('./pages/creator/CreatorDashboard'));
const CreateLead = lazy(() => import('./pages/creator/CreateLead'));
const MyLeads = lazy(() => import('./pages/creator/MyLeads'));
const EditLead = lazy(() => import('./pages/creator/EditLead'));


const ApproverDashboard = lazy(() => import('./pages/approver/ApproverDashboard'));
const AssignLeads = lazy(() => import('./pages/approver/AssignLeads'));
const PendingLeads = lazy(() => import('./pages/approver/PendingLeads'));
const ApprovedLeads = lazy(() => import('./pages/approver/VerifiedLeads'));
const ApproverAssignedLeads = lazy(() => import('./pages/approver/AssignedLeads'));
const LeadTracking = lazy(() => import('./pages/approver/LeadTracking'));

const WorkerDashboard = lazy(() => import('./pages/worker/WorkerDashboard'));
const AssignedLeads = lazy(() => import('./pages/worker/AssignedLeads'));
const FollowUps = lazy(() => import('./pages/worker/FollowUps'));
const LeadDetails = lazy(() => import('./pages/worker/LeadDetails'));

const DoctorList = lazy(() => import('./pages/doctors/DoctorList'));
const DoctorProfile = lazy(() => import('./pages/doctors/DoctorProfile'));
const DoctorSchedule = lazy(() => import('./pages/doctors/DoctorSchedule'));

const PatientProfile = lazy(() => import('./pages/patient/PatientProfile'));
const PatientReports = lazy(() => import('./pages/patient/PatientReports'));

const LabDashboard = lazy(() => import('./pages/lab/LabDashboard'));
const TestCatalog = lazy(() => import('./pages/lab/TestCatalog'));
const TestBooking = lazy(() => import('./pages/lab/TestBooking'));
const LabReports = lazy(() => import('./pages/lab/LabReports'));

const Inventory = lazy(() => import('./pages/pharmacy/Inventory'));
const Billing = lazy(() => import('./pages/pharmacy/Billing'));

const Plans = lazy(() => import('./pages/subscription/Plans'));
const SubscriptionStatus = lazy(() => import('./pages/subscription/SubscriptionStatus'));

const LeadsReport = lazy(() => import('./pages/reports/LeadsReport'));
const SalesReport = lazy(() => import('./pages/reports/SalesReport'));
const AppointmentReport = lazy(() => import('./pages/reports/AppointmentReport'));

function App() {
  return (
    <BrowserRouter>
      <NotificationProvider>
        <AuthProvider>
        <Suspense fallback={<Loader />}>
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/forgot-password" element={<ForgotPassword />} />
            <Route path="/reset-password" element={<ResetPassword />} />
            <Route path="/" element={<Navigate to="/login" replace />} />

            {/* Unified Dashboard (Accessible by any logged-in user) */}
            <Route element={<ProtectedRoute />}>
              <Route element={<Layout />}>
                <Route path="/dashboard" element={<UnifiedDashboard />} />
                <Route path="/leads/:id" element={<LeadDetails />} />
              </Route>
            </Route>

            {/* Admin Routes */}
            <Route element={<ProtectedRoute allowedRoles={['admin']} />}>
              <Route element={<Layout />}>
                <Route path="/admin-dashboard" element={<AdminDashboard />} />
                <Route path="/admin/users" element={<UserManagement />} />
                <Route path="/admin/leads" element={<AdminLeads />} />
                <Route path="/admin/roles" element={<RoleManagement />} />
                <Route path="/admin/permissions" element={<PermissionManagement />} />
                <Route path="/admin/reports" element={<AdminReports />} />
              </Route>
            </Route>


            {/* Creator Routes */}
            <Route element={<ProtectedRoute module="leads" action="create" />}>
              <Route element={<Layout />}>
                <Route path="/creator/dashboard" element={<UnifiedDashboard />} />
                <Route path="/creator/create-lead" element={<CreateLead />} />
                <Route path="/creator/my-leads" element={<MyLeads />} />
                <Route path="/creator/edit-lead/:id" element={<EditLead />} />
              </Route>
            </Route>

            {/* Approver Routes */}
            <Route element={<ProtectedRoute allowedRoles={['approver']} />}>
              <Route element={<Layout />}>
                <Route path="/approver/dashboard" element={<UnifiedDashboard />} />
                <Route path="/approver/assign-leads" element={<AssignLeads />} />
                <Route path="/approver/pending-leads" element={<PendingLeads />} />
                <Route path="/approver/verified-leads" element={<ApprovedLeads />} />
                <Route path="/approver/assigned-leads" element={<ApproverAssignedLeads />} />
                <Route path="/approver/track-lead/:id" element={<LeadTracking />} />
              </Route>
            </Route>

            {/* Worker Routes */}
            <Route element={<ProtectedRoute allowedRoles={['worker']} />}>
              <Route element={<Layout />}>
                <Route path="/worker/dashboard" element={<UnifiedDashboard />} />
                <Route path="/worker/assigned-leads" element={<AssignedLeads />} />
                <Route path="/worker/follow-ups" element={<FollowUps />} />
                <Route path="/worker/lead/:id" element={<LeadDetails />} />
              </Route>
            </Route>

            {/* Restricted Common Modules */}
            <Route element={<ProtectedRoute allowedRoles={['approver', 'worker']} />}>
              <Route element={<Layout />}>
                <Route path="/doctors" element={<DoctorList />} />
                <Route path="/doctors/:id" element={<DoctorProfile />} />
                <Route path="/doctors/:id/schedule" element={<DoctorSchedule />} />
                <Route path="/patients/:id" element={<PatientProfile />} />
                <Route path="/patients/:id/reports" element={<PatientReports />} />
                <Route path="/lab" element={<LabDashboard />} />
                <Route path="/lab/catalog" element={<TestCatalog />} />
                <Route path="/lab/booking" element={<TestBooking />} />
                <Route path="/lab/reports" element={<LabReports />} />
                <Route path="/pharmacy/inventory" element={<Inventory />} />
                <Route path="/pharmacy/billing" element={<Billing />} />
                <Route path="/subscription/plans" element={<Plans />} />
                <Route path="/subscription/status" element={<SubscriptionStatus />} />
              </Route>
            </Route>

            {/* Reports Modules */}
            <Route element={<ProtectedRoute module="reports" action="view" />}>
              <Route element={<Layout />}>
                <Route path="/reports/leads" element={<LeadsReport />} />
                <Route path="/reports/sales" element={<SalesReport />} />
                <Route path="/reports/appointments" element={<AppointmentReport />} />
              </Route>
            </Route>
          </Routes>
        </Suspense>
      </AuthProvider>
      </NotificationProvider>
    </BrowserRouter>
  );
}

export default App;