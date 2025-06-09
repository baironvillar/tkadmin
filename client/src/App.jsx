import { BrowserRouter as Router, Routes, Route, Navigate, Outlet } from 'react-router-dom';
import LoginPage from './pages/LoginPage';
import TaskPage from './pages/TaskPage';
import DashboardLayout from './components/DashboardLayout';
import DashboardOverviewPage from './pages/DashboardOverviewPage';
import UserManagementPage from './pages/UserManagementPage';
import TaskManagementPage from './pages/TaskManagementPage';
import React from 'react';

function App() {
  const user = JSON.parse(localStorage.getItem('user') || '{}');
  const isAuthenticated = !!localStorage.getItem('token');
  const isAdmin = user.is_staff || user.is_superuser;

  return (
    <Router>
      <Routes>
        <Route path="/login" element={<LoginPage />} />

        {/* Rutas de administración protegidas con DashboardLayout */}
        <Route
          path="/admin"
          element={
            isAuthenticated && isAdmin ? (
              <DashboardLayout>
                <Outlet />
              </DashboardLayout>
            ) : (
              <Navigate to="/login" />
            )
          }
        >
          {/* Página de resumen del dashboard */}
          <Route index element={<DashboardOverviewPage />} />
          {/* Páginas de gestión */}
          <Route path="users" element={<UserManagementPage />} />
          <Route path="tasks" element={<TaskManagementPage />} />
        </Route>

        {/* Ruta para usuarios regulares (Mis Tareas) - fuera del layout de admin */}
        <Route
          path="/tasks"
          element={
            isAuthenticated ? (
              <TaskPage />
            ) : (
              <Navigate to="/login" />
            )
          }
        />
        
        {/* Redirecciones de inicio */}
        <Route
          path="/"
          element={
            isAuthenticated
              ? isAdmin
                ? <Navigate to="/admin" />
                : <Navigate to="/tasks" />
              : <Navigate to="/login" />
          }
        />
      </Routes>
    </Router>
  );
}

export default App; 