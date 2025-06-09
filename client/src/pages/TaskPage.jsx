import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import api from '../lib/axios';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import ThemeToggle from '../components/ThemeToggle';

const TaskPage = () => {
  const [tasks, setTasks] = useState([]);
  const [users, setUsers] = useState([]);
  const [error, setError] = useState('');
  const navigate = useNavigate();
  const [isAdmin, setIsAdmin] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
  const [selectedTask, setSelectedTask] = useState(null);

  useEffect(() => {
    const token = localStorage.getItem('token');
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    if (!token) {
      navigate('/login');
      return;
    }
    setIsAdmin(user.is_staff || user.is_superuser);
    fetchTasks(user.id);
    fetchUsers();
  }, [navigate]);

  const fetchTasks = async (userId) => {
    try {
      const response = await api.get(`/api/tasks/?user=${userId}`);
      setTasks(response.data);
    } catch (err) {
      if (err.response?.status === 401) {
        navigate('/login');
      } else {
        setError('Error al cargar las tareas');
      }
    }
  };

  const fetchUsers = async () => {
    try {
      const res = await api.get('/api/users/');
      setUsers(res.data);
    } catch (err) {
      console.error('Error al cargar usuarios:', err);
      setError('Error al cargar usuarios');
    }
  };

  const handleToggleComplete = async (taskId) => {
    try {
      const task = tasks.find(t => t.id === taskId);
      const response = await api.patch(`/api/tasks/${taskId}/`, 
        { completed: !task.completed }
      );
      setTasks(tasks.map(t => t.id === taskId ? response.data : t));
    } catch (err) {
      if (err.response?.status === 401) {
        navigate('/login');
      } else {
        setError('Error al actualizar la tarea');
      }
    }
  };

  const handleConfirmTask = async (taskId) => {
    try {
      const task = tasks.find(t => t.id === taskId);
      const response = await api.patch(`/api/tasks/${taskId}/`, 
        { is_confirmed_by_admin: !task.is_confirmed_by_admin }
      );
      setTasks(tasks.map(t => t.id === taskId ? response.data : t));
    } catch (err) {
      setError('Error al actualizar la confirmación de la tarea');
    }
  };

  const handleDeleteTask = async (taskId) => {
    try {
      await api.delete(`/api/tasks/${taskId}/`);
      setTasks(tasks.filter(t => t.id !== taskId));
    } catch (err) {
      setError('Error al eliminar la tarea');
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('user');
    navigate('/login');
  };

  const openDetailsModal = (task) => {
    setSelectedTask(task);
    setIsDetailsModalOpen(true);
  };

  const filteredAndSearchedTasks = tasks.filter(task => {
    const matchesSearchTerm = task.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                              task.description.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesFilterStatus = filterStatus === 'all' ||
                                (filterStatus === 'completed' && task.completed) ||
                                (filterStatus === 'pending' && !task.completed);
    
    return matchesSearchTerm && matchesFilterStatus;
  });

  return (
    <div className="p-6 bg-background text-foreground rounded-xl shadow-lg min-h-screen">
      <div className="w-full mx-auto">
        <div className="flex items-center justify-between mb-4 relative">
          <h2 className="text-2xl font-semibold text-foreground">Mis Tareas</h2>
          <div className="flex items-center space-x-4">
            <Button
              onClick={handleLogout}
              variant="link"
              className="text-primary hover:text-primary/90"
            >
              Cerrar Sesión
            </Button>
            {isAdmin && (
              <Link to="/admin">
                <Button className="bg-primary hover:bg-primary/90 text-primary-foreground px-3 py-1 text-sm rounded-md transition">Ir al Dashboard</Button>
              </Link>
            )}
            <ThemeToggle />
          </div>
        </div>
        {error && (
          <div className="bg-destructive/10 border border-destructive text-destructive px-4 py-3 rounded relative mt-4" role="alert">
            <span className="block sm:inline">{error}</span>
          </div>
        )}
        
        <div className="mb-4 flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-4">
          <Input
            type="text"
            placeholder="Buscar tareas..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="flex-grow border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
          />
          <div className="flex space-x-2">
            <Button
              onClick={() => setFilterStatus('all')}
              className={`px-4 py-2 rounded-md transition ${filterStatus === 'all' ? 'bg-primary text-primary-foreground' : 'bg-secondary text-secondary-foreground hover:bg-secondary/80'}`}
            >
              Todas
            </Button>
            <Button
              onClick={() => setFilterStatus('completed')}
              className={`px-4 py-2 rounded-md transition ${filterStatus === 'completed' ? 'bg-primary text-primary-foreground' : 'bg-secondary text-secondary-foreground hover:bg-secondary/80'}`}
            >
              Completadas
            </Button>
            <Button
              onClick={() => setFilterStatus('pending')}
              className={`px-4 py-2 rounded-md transition ${filterStatus === 'pending' ? 'bg-primary text-primary-foreground' : 'bg-secondary text-secondary-foreground hover:bg-secondary/80'}`}
            >
              Pendientes
            </Button>
          </div>
        </div>

        <div className="mt-8 rounded-lg overflow-hidden border border-border">
          <ul className="divide-y divide-border">
            {filteredAndSearchedTasks.length === 0 ? (
              <li className="px-4 py-4 sm:px-6 bg-background text-muted-foreground text-center">
                No hay tareas para mostrar.
              </li>
            ) : (
              filteredAndSearchedTasks.map((task) => (
                <li key={task.id} className="bg-card border-b border-border transition-colors hover:bg-muted/50 data-[state=selected]:bg-muted last:border-b-0">
                  <div className="px-4 py-4 sm:px-6">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center">
                        <Label htmlFor={`task-completed-${task.id}`} className={`text-sm font-medium ${task.completed ? 'line-through text-muted-foreground' : 'text-foreground'}`}>
                          {task.title}
                        </Label>
                      </div>
                      <div className="ml-2 flex-shrink-0 flex items-center space-x-4">
                        <Button
                          onClick={() => openDetailsModal(task)}
                          variant="outline"
                          size="sm"
                          className="text-primary hover:bg-primary/10"
                        >
                          Ver Detalles
                        </Button>
                        <Button
                          onClick={() => handleToggleComplete(task.id)}
                          variant="secondary"
                          size="sm"
                          className="bg-primary hover:bg-primary/90 text-primary-foreground"
                        >
                          {task.completed ? "Marcar como Pendiente" : "Completar"}
                        </Button>
                      </div>
                    </div>
                    <div className="mt-2 sm:flex sm:justify-between">
                      <div className="sm:flex">
                        <p className="text-sm text-muted-foreground mt-2 break-all whitespace-normal overflow-hidden">{task.description}</p>
                      </div>
                    </div>
                  </div>
                </li>
              ))
            )}
          </ul>
        </div>
      </div>

      {/* Modal de Detalles de la Tarea */}
      <Dialog open={isDetailsModalOpen} onOpenChange={setIsDetailsModalOpen}>
        <DialogContent className="sm:max-w-md bg-background text-foreground p-6 rounded-lg shadow-xl border border-border overflow-auto">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold text-foreground">Detalles de la Tarea</DialogTitle>
            <DialogDescription className="text-sm text-muted-foreground">
              Información completa de la tarea.
            </DialogDescription>
          </DialogHeader>
          {selectedTask && (
            <div className="py-4 space-y-4">
              <div className="space-y-2">
                <Label className="text-foreground">Título:</Label>
                <p className="text-muted-foreground">{selectedTask.title}</p>
              </div>
              <div className="space-y-2">
                <Label className="text-foreground">¿Qué hará?:</Label>
                <p className="text-muted-foreground break-all whitespace-normal">{selectedTask.description}</p>
              </div>
              <div className="space-y-2">
                <Label className="text-foreground">Tiempo Empleado (minutos):</Label>
                <p className="text-muted-foreground">{selectedTask.tiempo_empleado || 'No especificado'}</p>
              </div>
              <div className="space-y-2">
                <Label className="text-foreground">Estado:</Label>
                <p className="text-muted-foreground">{selectedTask.completed ? 'Completada' : 'Pendiente'}</p>
              </div>
              <div className="space-y-2">
                <Label className="text-foreground">Asignada a:</Label>
                <p className="text-muted-foreground">{selectedTask.user ? users.find(u => u.id === selectedTask.user)?.email : 'No asignado'}</p>
              </div>
            </div>
          )}
          <DialogFooter className="flex justify-end mt-6">
            <Button onClick={() => setIsDetailsModalOpen(false)} className="bg-secondary hover:bg-secondary/80 text-secondary-foreground px-4 py-2 rounded-lg transition">
              Cerrar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default TaskPage; 