import React, { useEffect, useState } from 'react';
import api from '../lib/axios';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from '@/components/ui/table';
import {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import {
  Command,
  CommandInput,
  CommandList,
  CommandEmpty,
  CommandGroup,
  CommandItem,
} from "@/components/ui/command";
import { CheckIcon, ChevronsUpDown } from "lucide-react";
import { cn } from "@/lib/utils";

const TaskManagementPage = () => {
  const [tasks, setTasks] = useState([]);
  const [users, setUsers] = useState([]);
  const [form, setForm] = useState({
    title: '',
    description: '',
    tiempo_empleado: '',
    user: '',
    completed: false,
    is_confirmed_by_admin: false,
  });
  const [generalError, setGeneralError] = useState('');
  const [errors, setErrors] = useState({});
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [taskToDelete, setTaskToDelete] = useState(null);
  const [isCreateTaskDialogOpen, setIsCreateTaskDialogOpen] = useState(false);
  const [isEditTaskDialogOpen, setIsEditTaskDialogOpen] = useState(false);
  const [selectedTask, setSelectedTask] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [isAdmin, setIsAdmin] = useState(false);
  const [openUserSelect, setOpenUserSelect] = useState(false);

  const fetchTasks = async () => {
    try {
      const user = JSON.parse(localStorage.getItem('user') || '{}');
      const isAdmin = user.is_staff || user.is_superuser;
      
      let url = '/api/tasks/';
      
      if (!isAdmin) {
        url = `/api/tasks/?user=${user.id}`;
      }
      
      if (searchTerm) {
        url = `${url}${url.includes('?') ? '&' : '?'}search=${searchTerm}`;
      }

      const res = await api.get(url);
      setTasks(res.data);
    } catch (err) {
      console.error('Error al cargar tareas:', err);
      setGeneralError('Error al cargar tareas');
    }
  };

  const fetchUsers = async () => {
    try {
      const res = await api.get('/api/users/');
      setUsers(res.data);
    } catch (err) {
      console.error('Error al cargar usuarios:', err);
      setGeneralError('Error al cargar usuarios');
    }
  };

  useEffect(() => {
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    setIsAdmin(user.is_staff || user.is_superuser);
    fetchTasks();
    fetchUsers();
  }, [searchTerm]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm({ ...form, [name]: value });
    setErrors({});
    setGeneralError('');
  };

  const resetForm = () => {
    setForm({
      title: '',
      description: '',
      tiempo_empleado: '',
      user: '',
      completed: false,
      is_confirmed_by_admin: false,
    });
    setErrors({});
    setGeneralError('');
    setSelectedTask(null);
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    try {
      const user = JSON.parse(localStorage.getItem('user') || '{}');
      const taskData = {
        ...form,
        user: form.user ? parseInt(form.user, 10) : user.id,
      };

      await api.post('/api/tasks/', taskData);
      resetForm();
      setIsCreateTaskDialogOpen(false);
      fetchTasks();
    } catch (err) {
      console.error('Error al crear tarea:', err.response?.data);
      if (err.response?.data) {
        setErrors(err.response.data);
      } else {
        setGeneralError('Error al crear tarea');
      }
    }
  };

  const handleEditClick = (task) => {
    setSelectedTask(task);
    setForm({
      title: task.title,
      description: task.description,
      tiempo_empleado: task.tiempo_empleado,
      user: task.user ? task.user.toString() : '',
      completed: task.completed,
      is_confirmed_by_admin: task.is_confirmed_by_admin,
    });
    setIsEditTaskDialogOpen(true);
    setErrors({});
    setGeneralError('');
  };

  const handleEditTask = async (e) => {
    e.preventDefault();
    try {
      if (!selectedTask) return;

      const taskData = {
        ...form,
        user: form.user ? parseInt(form.user, 10) : null,
        completed: form.completed,
      };

      await api.patch(`/api/tasks/${selectedTask.id}/`, taskData);
      resetForm();
      setIsEditTaskDialogOpen(false);
      fetchTasks();
    } catch (err) {
      console.error('Error al actualizar tarea:', err.response?.data);
      if (err.response?.data) {
        setErrors(err.response.data);
      } else {
        setGeneralError('Error al actualizar tarea');
      }
    }
  };

  const handleToggleComplete = async (taskId, completed) => {
    try {
      await api.patch(`/api/tasks/${taskId}/`, { completed: !completed });
      fetchTasks();
    } catch (err) {
      console.error('Error al actualizar tarea:', err.response?.data || err);
      setGeneralError('Error al actualizar tarea');
    }
  };

  const handleConfirmTask = async (taskId) => {
    try {
      const task = tasks.find(t => t.id === taskId);
      await api.patch(`/api/tasks/${taskId}/`, { is_confirmed_by_admin: !task.is_confirmed_by_admin });
      fetchTasks();
    } catch (err) {
      console.error('Error al actualizar la confirmación de la tarea:', err);
      setGeneralError('Error al actualizar la confirmación de la tarea');
    }
  };

  const handleDeleteClick = (taskId) => {
    setTaskToDelete(taskId);
    setIsDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    try {
      await api.delete(`/api/tasks/${taskToDelete}/`);
      fetchTasks();
      setIsDeleteDialogOpen(false);
      setTaskToDelete(null);
    } catch (err) {
      console.error('Error al eliminar tarea:', err);
      setGeneralError('Error al eliminar tarea');
      setIsDeleteDialogOpen(false);
      setTaskToDelete(null);
    }
  };

  return (
    <div className="p-6 bg-card text-card-foreground rounded-xl shadow-lg min-h-[calc(100vh-160px)]">
      <h2 className="text-2xl font-semibold text-foreground mb-6">Gestión de Tareas</h2>

      {generalError && (
        <div className="bg-destructive/10 border border-destructive text-destructive px-4 py-3 rounded mb-4" role="alert">
          <span className="block sm:inline">{generalError}</span>
        </div>
      )}

      {/* Barra de búsqueda y botón de crear tarea */}
      <div className="flex justify-between items-center mb-6 gap-4">
        <Input
          type="text"
          placeholder="Buscar tareas por título o descripción..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full border border-input bg-background px-3 py-2 text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
        />
        <Dialog open={isCreateTaskDialogOpen} onOpenChange={setIsCreateTaskDialogOpen}>
          <DialogTrigger asChild>
            <Button
              className="bg-primary hover:bg-primary/90 text-primary-foreground px-4 py-2 rounded-lg transition whitespace-nowrap"
              onClick={() => {
                resetForm();
                setIsCreateTaskDialogOpen(true);
              }}
            >
              Crear Nueva Tarea
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-2xl bg-background text-foreground p-6 rounded-lg shadow-xl border border-border">
            <DialogHeader>
              <DialogTitle className="text-2xl font-bold text-foreground">Crear Nueva Tarea</DialogTitle>
              <DialogDescription className="text-sm text-muted-foreground">
                Completa los detalles para crear una nueva tarea.
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleCreate} className="py-4 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="title" className="text-foreground">Título</Label>
                  <Input
                    id="title"
                    name="title"
                    value={form.title}
                    onChange={handleChange}
                    placeholder="Título de la tarea"
                    className={`${errors.title ? 'border-destructive' : ''} w-full border border-input bg-background px-3 py-2 text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2`}
                  />
                  {errors.title && <span className="text-destructive text-xs">{errors.title}</span>}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="user" className="text-foreground">Asignar a</Label>
                  <Popover open={openUserSelect} onOpenChange={setOpenUserSelect}>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        role="combobox"
                        aria-expanded={openUserSelect}
                        className={`${errors.user ? 'border-destructive' : ''} w-full justify-between border border-input bg-background text-foreground`}
                      >
                        {form.user
                          ? users.find((user) => user.id.toString() === form.user)?.email
                          : "Seleccionar usuario..."}
                        <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-[--radix-popover-trigger-width] p-0 bg-background text-foreground border border-border">
                      <Command>
                        <CommandInput placeholder="Buscar usuario..." className="h-9 text-foreground" />
                        <CommandList>
                          <CommandEmpty className="text-muted-foreground">No se encontraron usuarios.</CommandEmpty>
                          <CommandGroup>
                            {users.map((user) => (
                              <CommandItem
                                key={user.id}
                                value={user.email}
                                onSelect={() => {
                                  setForm({ ...form, user: user.id.toString() });
                                  setOpenUserSelect(false);
                                }}
                                className="text-foreground hover:bg-accent hover:text-accent-foreground"
                              >
                                <CheckIcon
                                  className={cn(
                                    "mr-2 h-4 w-4",
                                    form.user === user.id.toString() ? "opacity-100" : "opacity-0"
                                  )}
                                />
                                {user.email} ({user.first_name} {user.last_name})
                              </CommandItem>
                            ))}
                          </CommandGroup>
                        </CommandList>
                      </Command>
                    </PopoverContent>
                  </Popover>
                  {errors.user && <span className="text-destructive text-xs">{errors.user}</span>}
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="description" className="text-foreground">¿Qué hará?</Label>
                <Textarea
                  id="description"
                  name="description"
                  value={form.description}
                  onChange={handleChange}
                  placeholder="¿Qué hará la tarea?"
                  className={`${errors.description ? 'border-destructive' : ''} w-full border border-input bg-background px-3 py-2 text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 min-h-[100px]`}
                />
                {errors.description && <span className="text-destructive text-xs">{errors.description}</span>}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="tiempo_empleado" className="text-foreground">Tiempo Empleado (minutos)</Label>
                  <Input
                    type="number"
                    id="tiempo_empleado"
                    name="tiempo_empleado"
                    value={form.tiempo_empleado}
                    onChange={handleChange}
                    placeholder="Minutos empleados"
                    className={`${errors.tiempo_empleado ? 'border-destructive' : ''} w-full border border-input bg-background px-3 py-2 text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2`}
                  />
                  {errors.tiempo_empleado && <span className="text-destructive text-xs">{errors.tiempo_empleado}</span>}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="completed" className="text-foreground">Tarea Completada</Label>
                  <Select
                    name="completed"
                    value={form.completed ? 'true' : 'false'}
                    onValueChange={(value) => setForm({ ...form, completed: value === 'true' })}
                  >
                    <SelectTrigger className={`w-full border border-input bg-background text-foreground ${form.completed ? 'border-green-500' : 'border-red-500'}`}>
                      <SelectValue placeholder="Seleccionar estado" />
                    </SelectTrigger>
                    <SelectContent className="bg-background text-foreground border border-border">
                      <SelectItem value="true" className="text-green-500 hover:bg-accent hover:text-accent-foreground">Completada</SelectItem>
                      <SelectItem value="false" className="text-red-500 hover:bg-accent hover:text-accent-foreground">Pendiente</SelectItem>
                    </SelectContent>
                  </Select>
                  {errors.completed && <span className="text-destructive text-xs">{errors.completed}</span>}
                </div>
              </div>

              <DialogFooter className="flex justify-end gap-2 mt-6">
                <Button type="submit" className="bg-primary hover:bg-primary/90 text-primary-foreground px-4 py-2 rounded-lg transition">
                  Crear Tarea
                </Button>
                <Button type="button" onClick={() => setIsCreateTaskDialogOpen(false)} className="bg-secondary hover:bg-secondary/80 text-secondary-foreground px-4 py-2 rounded-lg transition">
                  Cancelar
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Tabla de tareas */}
      <div className="border rounded-lg overflow-hidden mt-8 overflow-x-auto">
        <Table className="w-full table-fixed">
          <TableHeader>
            <TableRow className="bg-muted/50">
              <TableHead className="h-12 px-4 text-left align-middle font-medium text-foreground w-[15%]">Título</TableHead>
              <TableHead className="h-12 px-4 text-left align-middle font-medium text-foreground w-[30%]">¿Qué hará?</TableHead>
              <TableHead className="h-12 px-4 text-left align-middle font-medium text-foreground w-[25%]">Asignado a</TableHead>
              <TableHead className="h-12 px-4 text-left align-middle font-medium text-foreground w-[10%]">Estado</TableHead>
              <TableHead className="h-12 px-4 text-left align-middle font-medium text-foreground w-[5%]">Minutos</TableHead>
              <TableHead className="h-12 px-4 text-left align-middle font-medium text-foreground text-right w-[15%]">Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {tasks.map((task) => (
              <TableRow key={task.id} className="hover:bg-muted/50">
                <TableCell className="px-4 py-3 text-foreground">{task.title}</TableCell>
                <TableCell className="px-4 py-3 text-foreground break-all whitespace-normal">{task.description}</TableCell>
                <TableCell className="px-4 py-3 text-foreground">{task.user ? users.find(u => u.id === task.user)?.email : 'No asignado'}</TableCell>
                <TableCell className="px-4 py-3 text-foreground">
                  <Select
                    value={task.completed ? 'true' : 'false'}
                    onValueChange={(value) => handleToggleComplete(task.id, task.completed)}
                  >
                    <SelectTrigger className={`w-full border-none shadow-none focus-visible:ring-0 focus-visible:ring-offset-0 h-auto p-0 ${task.completed ? 'text-green-500' : 'text-red-500'}`}>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-background text-foreground border border-border">
                      <SelectItem value="true" className="text-green-500 hover:bg-accent hover:text-accent-foreground">Completada</SelectItem>
                      <SelectItem value="false" className="text-red-500 hover:bg-accent hover:text-accent-foreground">Pendiente</SelectItem>
                    </SelectContent>
                  </Select>
                </TableCell>
                <TableCell className="px-4 py-3 text-foreground">{task.tiempo_empleado}</TableCell>
                <TableCell className="px-4 py-3 text-right">
                  <div className="flex justify-end gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleEditClick(task)}
                      className="text-foreground hover:bg-accent hover:text-accent-foreground"
                    >
                      Editar
                    </Button>
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => handleDeleteClick(task.id)}
                      className="text-destructive-foreground hover:bg-destructive/90"
                    >
                      Eliminar
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {/* Modal de Confirmación de Eliminación */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent className="sm:max-w-[425px] bg-background text-foreground p-6 rounded-lg shadow-xl border border-border">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold text-foreground">Confirmar Eliminación</DialogTitle>
            <DialogDescription className="text-sm text-muted-foreground">
              ¿Estás seguro de que quieres eliminar esta tarea? Esta acción no se puede deshacer.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="flex justify-end gap-2 mt-6">
            <Button variant="outline" onClick={() => setIsDeleteDialogOpen(false)} className="px-4 py-2 rounded-lg transition">
              Cancelar
            </Button>
            <Button variant="destructive" onClick={handleDeleteConfirm} className="px-4 py-2 rounded-lg transition">
              Eliminar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal de Edición */}
      <Dialog open={isEditTaskDialogOpen} onOpenChange={setIsEditTaskDialogOpen}>
        <DialogContent className="sm:max-w-2xl bg-background text-foreground p-6 rounded-lg shadow-xl border border-border">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold text-foreground">Editar Tarea</DialogTitle>
            <DialogDescription className="text-sm text-muted-foreground">
              Actualiza los detalles de la tarea.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleEditTask} className="py-4 space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="edit-title" className="text-foreground">Título</Label>
                <Input
                  id="edit-title"
                  name="title"
                  value={form.title}
                  onChange={handleChange}
                  placeholder="Título de la tarea"
                  className={`${errors.title ? 'border-destructive' : ''} w-full border border-input bg-background px-3 py-2 text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2`}
                />
                {errors.title && <span className="text-destructive text-xs">{errors.title}</span>}
              </div>

              <div className="space-y-2">
                <Label htmlFor="edit-user" className="text-foreground">Asignar a</Label>
                <Popover open={openUserSelect} onOpenChange={setOpenUserSelect}>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      role="combobox"
                      aria-expanded={openUserSelect}
                      className={`${errors.user ? 'border-destructive' : ''} w-full justify-between border border-input bg-background text-foreground`}
                    >
                      {form.user
                        ? users.find((user) => user.id.toString() === form.user)?.email
                        : "Seleccionar usuario..."}
                      <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-[--radix-popover-trigger-width] p-0 bg-background text-foreground border border-border">
                    <Command>
                      <CommandInput placeholder="Buscar usuario..." className="h-9 text-foreground" />
                      <CommandList>
                        <CommandEmpty className="text-muted-foreground">No se encontraron usuarios.</CommandEmpty>
                        <CommandGroup>
                          {users.map((user) => (
                            <CommandItem
                              key={user.id}
                              value={user.email}
                              onSelect={() => {
                                setForm({ ...form, user: user.id.toString() });
                                setOpenUserSelect(false);
                              }}
                              className="text-foreground hover:bg-accent hover:text-accent-foreground"
                            >
                              <CheckIcon
                                className={cn(
                                  "mr-2 h-4 w-4",
                                  form.user === user.id.toString() ? "opacity-100" : "opacity-0"
                                )}
                              />
                              {user.email} ({user.first_name} {user.last_name})
                            </CommandItem>
                          ))}
                        </CommandGroup>
                      </CommandList>
                    </Command>
                  </PopoverContent>
                </Popover>
                {errors.user && <span className="text-destructive text-xs">{errors.user}</span>}
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-description" className="text-foreground">¿Qué hará?</Label>
              <Textarea
                id="edit-description"
                name="description"
                value={form.description}
                onChange={handleChange}
                placeholder="¿Qué hará la tarea?"
                className={`${errors.description ? 'border-destructive' : ''} w-full border border-input bg-background px-3 py-2 text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 min-h-[100px]`}
              />
              {errors.description && <span className="text-destructive text-xs">{errors.description}</span>}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="edit-tiempo_empleado" className="text-foreground">Tiempo Empleado (minutos)</Label>
                <Input
                  type="number"
                  id="edit-tiempo_empleado"
                  name="tiempo_empleado"
                  value={form.tiempo_empleado}
                  onChange={handleChange}
                  placeholder="Minutos empleados"
                  className={`${errors.tiempo_empleado ? 'border-destructive' : ''} w-full border border-input bg-background px-3 py-2 text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2`}
                />
                {errors.tiempo_empleado && <span className="text-destructive text-xs">{errors.tiempo_empleado}</span>}
              </div>

              <div className="space-y-2">
                <Label htmlFor="edit-completed" className="text-foreground">Tarea Completada</Label>
                <Select
                  name="completed"
                  value={form.completed ? 'true' : 'false'}
                  onValueChange={(value) => handleChange({ target: { name: 'completed', value: value === 'true' } })}
                >
                  <SelectTrigger className={`w-full border border-input bg-background text-foreground ${form.completed ? 'border-green-500' : 'border-red-500'}`}>
                    <SelectValue placeholder="Seleccionar estado" />
                  </SelectTrigger>
                  <SelectContent className="bg-background text-foreground border border-border">
                    <SelectItem value="true" className="text-green-500 hover:bg-accent hover:text-accent-foreground">Completada</SelectItem>
                    <SelectItem value="false" className="text-red-500 hover:bg-accent hover:text-accent-foreground">Pendiente</SelectItem>
                  </SelectContent>
                </Select>
                {errors.completed && <span className="text-destructive text-xs">{errors.completed}</span>}
              </div>
            </div>

            <DialogFooter className="flex justify-end gap-2 mt-6">
              <Button type="submit" className="bg-primary hover:bg-primary/90 text-primary-foreground px-4 py-2 rounded-lg transition">
                Guardar Cambios
              </Button>
              <Button type="button" onClick={() => setIsEditTaskDialogOpen(false)} className="bg-secondary hover:bg-secondary/80 text-secondary-foreground px-4 py-2 rounded-lg transition">
                Cancelar
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default TaskManagementPage; 