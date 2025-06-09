import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Home, Users, ClipboardList } from 'lucide-react';
import ThemeToggle from './ThemeToggle';

const DashboardLayout = ({ children }) => {
  const navigate = useNavigate();
  const user = JSON.parse(localStorage.getItem('user') || '{}');
  const isAdmin = user.is_staff || user.is_superuser;

  const handleLogout = () => {
    localStorage.clear();
    navigate('/login');
  };

  return (
    <div className="flex min-h-screen bg-background text-foreground">
      {/* Sidebar */}
      <aside className="w-64 bg-card text-card-foreground shadow-lg p-6 flex flex-col justify-between border-r border-border">
        <div>
          <h2 className="text-2xl font-bold text-primary mb-8">Panel Administrativo</h2>
          <nav className="space-y-4">
            <Link to="/admin" className="flex items-center gap-3 px-4 py-2 rounded-lg text-foreground hover:bg-accent hover:text-accent-foreground transition">
              <Home className="w-5 h-5" />
              <span>Dashboard</span>
            </Link>
            <Link to="/admin/users" className="flex items-center gap-3 px-4 py-2 rounded-lg text-foreground hover:bg-accent hover:text-accent-foreground transition">
              <Users className="w-5 h-5" />
              <span>Usuarios</span>
            </Link>
            <Link to="/admin/tasks" className="flex items-center gap-3 px-4 py-2 rounded-lg text-foreground hover:bg-accent hover:text-accent-foreground transition">
              <ClipboardList className="w-5 h-5" />
              <span>Tareas</span>
            </Link>
          </nav>
        </div>
        <div className="mt-8">
          <button 
            onClick={handleLogout} 
            className="w-full flex items-center gap-3 px-4 py-2 rounded-lg bg-destructive text-destructive-foreground hover:bg-destructive/90 transition"
          >
            <span className="flex-grow text-left">Cerrar sesión</span>
            <span className="ml-auto"></span>
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col">
        {/* Header */}
        <header className="bg-card text-card-foreground shadow-sm p-4 flex justify-between items-center border-b border-border">
          <h1 className="text-xl font-semibold text-foreground">
            Hola, {user.first_name || user.email} {user.last_name}
          </h1>
          <div className="relative flex items-center gap-4">
            <Link to="/tasks" className="bg-primary hover:bg-primary/90 text-primary-foreground px-4 py-2 rounded-lg transition">Mis Tareas</Link>
            <ThemeToggle />
          </div>
        </header>

        {/* Content Area */}
        <main className="flex-1 p-6 overflow-auto">
          {children}
        </main>
      </div>
    </div>
  );
};

export default DashboardLayout; 