import { BrowserRouter as Router, Routes, Route, Navigate, Outlet } from 'react-router-dom';
import LoginPage from './pages/LoginPage';
import TaskPage from './pages/TaskPage';
import DashboardLayout from './components/DashboardLayout';
import DashboardOverviewPage from './pages/DashboardOverviewPage';
import UserManagementPage from './pages/UserManagementPage';
import TaskManagementPage from './pages/TaskManagementPage';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import React from 'react';

// Componente para rutas protegidas
const ProtectedRoute = ({ children, requireAdmin = false }) => {
  const { isAuthenticated, isAdmin, loading } = useAuth();

  if (loading) {
    return <div>Cargando...</div>;
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" />;
  }

  if (requireAdmin && !isAdmin) {
    return <Navigate to="/tasks" />;
  }

  return children;
};

function AppRoutes() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />

      {/* Rutas de administración protegidas con DashboardLayout */}
      <Route
        path="/admin"
        element={
          <ProtectedRoute requireAdmin>
            <DashboardLayout>
              <Outlet />
            </DashboardLayout>
          </ProtectedRoute>
        }
      >
        <Route index element={<DashboardOverviewPage />} />
        <Route path="users" element={<UserManagementPage />} />
        <Route path="tasks" element={<TaskManagementPage />} />
      </Route>

      {/* Ruta para usuarios regulares (Mis Tareas) */}
      <Route
        path="/tasks"
        element={
          <ProtectedRoute>
            <TaskPage />
          </ProtectedRoute>
        }
      />
      
      {/* Redirecciones de inicio */}
      <Route
        path="/"
        element={
          <ProtectedRoute>
            {({ isAdmin }) => (
              isAdmin ? <Navigate to="/admin" /> : <Navigate to="/tasks" />
            )}
          </ProtectedRoute>
        }
      />
    </Routes>
  );
}

function App() {
  return (
    <Router>
      <AuthProvider>
        <AppRoutes />
      </AuthProvider>
    </Router>
  );
}

export default App; 