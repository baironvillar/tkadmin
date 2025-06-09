import React, { useEffect, useState } from 'react';
import axios from 'axios';
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from '@/components/ui/table';

const DashboardOverviewPage = () => {
  const [tasks, setTasks] = useState([]);
  const [users, setUsers] = useState([]);
  const [generalError, setGeneralError] = useState('');

  const fetchTasks = async () => {
    try {
      const token = localStorage.getItem('token');
      const user = JSON.parse(localStorage.getItem('user') || '{}');
      const isAdmin = user.is_staff || user.is_superuser;

      let url = '/api/tasks/';
      // Si NO es admin, o si es admin pero en el dashboard se quiere ver solo sus tareas (no es el caso para el dashboard)
      // En el dashboard, si es admin, se deben ver TODAS las tareas.
      if (!isAdmin) {
        url = `/api/tasks/?user=${user.id}`;
      }
      // Si es admin, la 'url' se mantiene como '/api/tasks/' para obtener todas las tareas.

      const res = await axios.get(url, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setTasks(res.data);
    } catch (err) {
      console.error('Error al cargar tareas:', err);
      setGeneralError('Error al cargar tareas');
    }
  };

  const fetchUsers = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await axios.get('/api/users/', {
        headers: { Authorization: `Bearer ${token}` },
      });
      setUsers(res.data);
    } catch (err) {
      console.error('Error al cargar usuarios:', err);
      setGeneralError('Error al cargar usuarios');
    }
  };

  useEffect(() => {
    fetchTasks();
    fetchUsers();
  }, []);

  return (
    <div className="p-6 bg-card text-card-foreground rounded-xl shadow-lg min-h-[calc(100vh-160px)]">
      <h2 className="text-2xl font-semibold text-primary mb-6">Resumen del Dashboard</h2>
      
      {generalError && (
        <div className="bg-destructive/10 border border-destructive text-destructive px-4 py-3 rounded mb-4" role="alert">
          <span className="block sm:inline">{generalError}</span>
        </div>
      )}

      <h3 className="text-xl font-semibold text-foreground mb-4">Tareas Recientes</h3>
      <div className="border rounded-lg overflow-hidden overflow-x-auto">
        <Table className="w-full table-fixed">
          <TableHeader>
            <TableRow className="bg-muted/50">
              <TableHead className="h-12 px-4 text-left align-middle font-medium text-foreground w-[20%]">Título</TableHead>
              <TableHead className="h-12 px-4 text-left align-middle font-medium text-foreground w-[35%]">¿Qué hará?</TableHead>
              <TableHead className="h-12 px-4 text-left align-middle font-medium text-foreground w-[20%]">Asignado a</TableHead>
              <TableHead className="h-12 px-4 text-left align-middle font-medium text-foreground w-[15%]">Estado</TableHead>
              <TableHead className="h-12 px-4 text-left align-middle font-medium text-foreground w-[10%]">Minutos</TableHead>
              {/* <TableHead className="h-12 px-4 text-left align-middle font-medium text-foreground">¿Qué hizo?</TableHead> */}
            </TableRow>
          </TableHeader>
          <TableBody>
            {tasks.map((task) => (
              <TableRow key={task.id} className="hover:bg-muted/50">
                <TableCell className="px-4 py-3 text-foreground">{task.title}</TableCell>
                <TableCell className="px-4 py-3 text-foreground break-all whitespace-normal">{task.description}</TableCell>
                <TableCell className="px-4 py-3 text-foreground">{task.user ? users.find(u => u.id === task.user)?.email : 'No asignado'}</TableCell>
                <TableCell className={`px-4 py-3 ${task.completed ? 'text-green-500' : 'text-red-500'}`}>{task.completed ? 'Completada' : 'Pendiente'}</TableCell>
                <TableCell className="px-4 py-3 text-foreground">{task.tiempo_empleado}</TableCell>
                {/* <TableCell className="px-4 py-3 text-foreground">{task.descripcion_realizada}</TableCell> */}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
};

export default DashboardOverviewPage;