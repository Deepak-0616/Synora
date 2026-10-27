import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "./context/AuthContext";
import { MainLayout } from "./layouts/MainLayout";
import { LoginPage } from "./pages/LoginPage";
import { RegisterPage } from "./pages/RegisterPage";
import { ClientDashboard } from "./pages/ClientDashboard";
import { SubmitComplaintPage } from "./pages/SubmitComplaintPage";
import { MyComplaintsPage } from "./pages/MyComplaintsPage";
import { ComplaintDetailPage } from "./pages/ComplaintDetailPage";
import { AdminDashboard } from "./pages/AdminDashboard";
import { AdminComplaintsPage } from "./pages/AdminComplaintsPage";
import { ReportsPage } from "./pages/ReportsPage";
import { UserManagementPage } from "./pages/UserManagementPage";
import { HelpCenterPage } from "./pages/HelpCenterPage";
import { LoadingSpinner } from "./components/LoadingSpinner";
const ProtectedRoute = ({
  children,
  allowedRoles
}) => {
  const { user, token, loading } = useAuth();
  if (loading) {
    return <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <LoadingSpinner message="Verifying institutional session credentials..." size="lg" />
      </div>;
  }
  if (!token || !user) {
    return <Navigate to="/login" replace />;
  }
  if (allowedRoles && !allowedRoles.includes(user.role)) {
    return <Navigate to={user.role === "complainant" ? "/dashboard" : "/admin"} replace />;
  }
  return <>{children}</>;
};
const RootRedirect = () => {
  const { user, token, loading } = useAuth();
  if (loading) {
    return <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <LoadingSpinner message="Initializing SYNORA Portal..." size="lg" />
      </div>;
  }
  if (!token || !user) {
    return <Navigate to="/login" replace />;
  }
  return <Navigate to={user.role === "complainant" ? "/dashboard" : "/admin"} replace />;
};
export const App = () => {
  return <AuthProvider>
      <BrowserRouter>
        <Routes>
          {
    /* Public Authentication Routes */
  }
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />

          {
    /* Root redirect */
  }
          <Route path="/" element={<RootRedirect />} />

          {
    /* Protected Routes inside Main Shell Layout */
  }
          <Route
    element={<ProtectedRoute>
                <MainLayout />
              </ProtectedRoute>}
  >
            {
    /* Complainant views */
  }
            <Route path="/dashboard" element={<ClientDashboard />} />
            <Route path="/submit" element={<SubmitComplaintPage />} />
            <Route path="/complaints" element={<MyComplaintsPage />} />
            <Route path="/complaints/:id" element={<ComplaintDetailPage />} />

            {
    /* Staff / Administrative views */
  }
            <Route
    path="/admin"
    element={<ProtectedRoute allowedRoles={["officer", "bureau_admin", "system_admin", "reviewer"]}>
                  <AdminDashboard />
                </ProtectedRoute>}
  />
            <Route
    path="/admin/complaints"
    element={<ProtectedRoute allowedRoles={["officer", "bureau_admin", "system_admin", "reviewer"]}>
                  <AdminComplaintsPage />
                </ProtectedRoute>}
  />
            <Route
    path="/admin/reports"
    element={<ProtectedRoute allowedRoles={["officer", "bureau_admin", "system_admin", "reviewer"]}>
                  <ReportsPage />
                </ProtectedRoute>}
  />
            <Route
    path="/admin/users"
    element={<ProtectedRoute allowedRoles={["system_admin"]}>
                  <UserManagementPage />
                </ProtectedRoute>}
  />
            <Route
    path="/admin/audit"
    element={<ProtectedRoute allowedRoles={["system_admin", "reviewer"]}>
                  <UserManagementPage />
                </ProtectedRoute>}
  />

            {
    /* Shared Help and Procedures */
  }
            <Route path="/help" element={<HelpCenterPage />} />
          </Route>

          {
    /* Fallback */
  }
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>;
};
