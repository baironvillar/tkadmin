import React, { useState, useEffect } from 'react';
import api from '../lib/axios';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
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
import { Checkbox } from '@/components/ui/checkbox';

const UserManagementPage = () => {
  const [users, setUsers] = useState([]);
  const [selectedUserId, setSelectedUserId] = useState(null);
  const [form, setForm] = useState({
    email: '',
    first_name: '',
    last_name: '',
    password: '',
    password_confirm: '',
    is_staff: false,
  });
  const [errors, setErrors] = useState({});
  const [generalError, setGeneralError] = useState('');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [userToDelete, setUserToDelete] = useState(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isCreateUserDialogOpen, setIsCreateUserDialogOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

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
    fetchUsers();
  }, []);

  const resetForm = () => {
    setForm({
      email: '',
      first_name: '',
      last_name: '',
      password: '',
      password_confirm: '',
      is_staff: false,
    });
    setErrors({});
    setGeneralError('');
  };

  const validateForm = () => {
    const newErrors = {};
    
    // Validar email
    if (!form.email) {
      newErrors.email = 'El correo electrónico es requerido';
    } else if (!/\S+@\S+\.\S+/.test(form.email)) {
      newErrors.email = 'El correo electrónico no es válido';
    }

    // Validar nombre
    if (!form.first_name) {
      newErrors.first_name = 'El nombre es requerido';
    }

    // Validar apellido
    if (!form.last_name) {
      newErrors.last_name = 'El apellido es requerido';
    }

    // Validar contraseña (solo requerida en creación o si se cambia en edición)
    if (!selectedUserId || (selectedUserId && form.password)) { // Si es nueva creación o se intenta cambiar la contraseña
        if (!form.password) {
            newErrors.password = 'La contraseña es requerida';
        } else if (form.password.length < 8) {
            newErrors.password = 'La contraseña debe tener al menos 8 caracteres';
        } else if (!/\d/.test(form.password)) {
            newErrors.password = 'La contraseña debe contener al menos un número';
        } else if (!/[A-Z]/.test(form.password)) {
            newErrors.password = 'La contraseña debe contener al menos una letra mayúscula';
        }
    }

    // Validar confirmación de contraseña (solo requerida en creación o si se cambia en edición)
    if (!selectedUserId || (selectedUserId && form.password_confirm)) { // Si es nueva creación o se intenta cambiar la contraseña
        if (!form.password_confirm) {
            newErrors.password_confirm = 'La confirmación de contraseña es requerida';
        } else if (form.password !== form.password_confirm) {
            newErrors.password_confirm = 'Las contraseñas no coinciden';
        }
    }

    setErrors(newErrors);
    console.log('Errores de validación:', newErrors);
    const isValid = Object.keys(newErrors).length === 0;
    console.log('Formulario válido:', isValid);
    return isValid;
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm({
      ...form,
      [name]: type === 'checkbox' ? checked : value,
    });
    // Limpiar el error específico del campo cuando se modifica
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
    setGeneralError('');
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    console.log('Intentando crear usuario con datos:', form);
    if (!validateForm()) {
      console.log('Validación fallida en handleCreate.');
      return;
    }

    try {
      await api.post('/api/users/', form);
      resetForm();
      fetchUsers();
      setIsCreateUserDialogOpen(false);
      console.log('Usuario creado con éxito.');
    } catch (err) {
      console.error('Error al crear usuario:', err.response?.data);
      if (err.response?.data) {
        setErrors(err.response.data);
      } else {
        setGeneralError('Error al crear usuario');
      }
    }
  };

  const handleDeleteClick = (userId) => {
    setUserToDelete(userId);
    setIsDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    try {
      await api.delete(`/api/users/${userToDelete}/`);
      fetchUsers();
      setIsDialogOpen(false);
      setUserToDelete(null);
    } catch (err) {
      console.error('Error al eliminar usuario:', err);
      setGeneralError('Error al eliminar usuario');
      setIsDialogOpen(false);
      setUserToDelete(null);
    }
  };

  const handleEditClick = (user) => {
    setSelectedUserId(user.id);
    setForm({
      email: user.email,
      first_name: user.first_name,
      last_name: user.last_name,
      password: '',
      password_confirm: '',
      is_staff: !!user.is_staff,
    });
    setIsEditDialogOpen(true);
  };

  const handleEdit = async (e) => {
    e.preventDefault();
    if (!validateForm()) {
      return;
    }

    try {
      const dataToUpdate = { ...form };
      if (dataToUpdate.password === '') delete dataToUpdate.password;
      if (dataToUpdate.password_confirm === '') delete dataToUpdate.password_confirm;

      await api.put(`/api/users/${selectedUserId}/`, dataToUpdate);
      fetchUsers();
      setIsEditDialogOpen(false);
      setSelectedUserId(null);
      resetForm();
    } catch (err) {
      console.error('Error al editar usuario:', err.response?.data);
      if (err.response?.data) {
        setErrors(err.response.data);
      } else {
        setGeneralError('Error al editar usuario');
      }
    }
  };

  const filteredUsers = users.filter(user => 
    user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.first_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.last_name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="p-6 bg-card text-card-foreground rounded-xl shadow-lg min-h-[calc(100vh-160px)]">
      <h2 className="text-2xl font-semibold text-foreground mb-6">Gestión de Usuarios</h2>

      {generalError && (
        <div className="bg-destructive/10 border border-destructive text-destructive px-4 py-3 rounded mb-4" role="alert">
          <span className="block sm:inline">{generalError}</span>
        </div>
      )}
      
      {/* Barra de búsqueda y botón de crear usuario */}
      <div className="flex justify-between items-center mb-6 gap-4">
        <Input
          type="text"
          placeholder="Buscar usuarios por email, nombre o apellido..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full border border-input bg-background px-3 py-2 text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
        />
        <Dialog open={isCreateUserDialogOpen} onOpenChange={setIsCreateUserDialogOpen}>
          <DialogTrigger asChild>
            <Button
              className="bg-primary hover:bg-primary/90 text-primary-foreground px-4 py-2 rounded-lg transition whitespace-nowrap"
              onClick={() => {
                resetForm();
                setIsCreateUserDialogOpen(true);
              }}
            >
              Crear Nuevo Usuario
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[425px] bg-background text-foreground p-6 rounded-lg shadow-xl border border-border">
            <DialogHeader>
              <DialogTitle className="text-2xl font-bold text-foreground">Crear Nuevo Usuario</DialogTitle>
              <DialogDescription className="text-sm text-muted-foreground">
                Completa los detalles para crear un nuevo usuario.
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleCreate} className="py-4 space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email" className="text-foreground">Email</Label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  value={form.email}
                  onChange={handleChange}
                  placeholder="correo@ejemplo.com"
                  className={`${errors.email ? 'border-destructive' : ''} w-full border border-input bg-background px-3 py-2 text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2`}
                />
                {errors.email && <span className="text-destructive text-xs">{errors.email}</span>}
              </div>

              <div className="space-y-2">
                <Label htmlFor="first_name" className="text-foreground">Nombre</Label>
                <Input
                  id="first_name"
                  name="first_name"
                  value={form.first_name}
                  onChange={handleChange}
                  placeholder="Nombre"
                  className={`${errors.first_name ? 'border-destructive' : ''} w-full border border-input bg-background px-3 py-2 text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2`}
                />
                {errors.first_name && <span className="text-destructive text-xs">{errors.first_name}</span>}
              </div>

              <div className="space-y-2">
                <Label htmlFor="last_name" className="text-foreground">Apellido</Label>
                <Input
                  id="last_name"
                  name="last_name"
                  value={form.last_name}
                  onChange={handleChange}
                  placeholder="Apellido"
                  className={`${errors.last_name ? 'border-destructive' : ''} w-full border border-input bg-background px-3 py-2 text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2`}
                />
                {errors.last_name && <span className="text-destructive text-xs">{errors.last_name}</span>}
              </div>

              <div className="space-y-2">
                <Label htmlFor="password" className="text-foreground">Contraseña</Label>
                <Input
                  id="password"
                  name="password"
                  type="password"
                  value={form.password}
                  onChange={handleChange}
                  placeholder="Contraseña"
                  className={`${errors.password ? 'border-destructive' : ''} w-full border border-input bg-background px-3 py-2 text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2`}
                />
                {errors.password && <span className="text-destructive text-xs">{errors.password}</span>}
              </div>

              <div className="space-y-2">
                <Label htmlFor="password_confirm" className="text-foreground">Confirmar Contraseña</Label>
                <Input
                  id="password_confirm"
                  name="password_confirm"
                  type="password"
                  value={form.password_confirm}
                  onChange={handleChange}
                  placeholder="Confirmar Contraseña"
                  className={`${errors.password_confirm ? 'border-destructive' : ''} w-full border border-input bg-background px-3 py-2 text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2`}
                />
                {errors.password_confirm && <span className="text-destructive text-xs">{errors.password_confirm}</span>}
              </div>

              <div className="flex items-center space-x-2">
                <Checkbox
                  id="is_staff"
                  name="is_staff"
                  checked={form.is_staff}
                  onCheckedChange={(checked) => handleChange({ target: { name: 'is_staff', value: checked } })}
                  className="border-input bg-background text-primary focus:ring-ring"
                />
                <Label htmlFor="is_staff" className="text-foreground">Es Administrador</Label>
              </div>

              <DialogFooter className="flex justify-end gap-2 mt-6">
                <Button type="submit" className="bg-primary hover:bg-primary/90 text-primary-foreground px-4 py-2 rounded-lg transition">
                  Crear Usuario
                </Button>
                <Button type="button" onClick={() => setIsCreateUserDialogOpen(false)} className="bg-secondary hover:bg-secondary/80 text-secondary-foreground px-4 py-2 rounded-lg transition">
                  Cancelar
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Tabla de usuarios */}
      <div className="border rounded-lg overflow-hidden mt-8">
        <Table className="w-full">
          <TableHeader>
            <TableRow className="bg-muted/50">
              <TableHead className="h-12 px-4 text-left align-middle font-medium text-foreground">Email</TableHead>
              <TableHead className="h-12 px-4 text-left align-middle font-medium text-foreground">Nombre</TableHead>
              <TableHead className="h-12 px-4 text-left align-middle font-medium text-foreground">Apellido</TableHead>
              <TableHead className="h-12 px-4 text-left align-middle font-medium text-foreground">Es Administrador</TableHead>
              <TableHead className="h-12 px-4 text-left align-middle font-medium text-foreground text-right">Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredUsers.map((user) => (
              <TableRow key={user.id} className="hover:bg-muted/50">
                <TableCell className="px-4 py-3 text-foreground">{user.email}</TableCell>
                <TableCell className="px-4 py-3 text-foreground">{user.first_name}</TableCell>
                <TableCell className="px-4 py-3 text-foreground">{user.last_name}</TableCell>
                <TableCell className="px-4 py-3 text-foreground">
                  {user.is_staff ? 'Sí' : 'No'}
                </TableCell>
                <TableCell className="px-4 py-3 text-right">
                  <div className="flex justify-end gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleEditClick(user)}
                      className="text-foreground hover:bg-accent hover:text-accent-foreground"
                    >
                      Editar
                    </Button>
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => handleDeleteClick(user)}
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
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-[425px] bg-background text-foreground p-6 rounded-lg shadow-xl border border-border">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold text-foreground">Confirmar Eliminación</DialogTitle>
            <DialogDescription className="text-sm text-muted-foreground">
              ¿Estás seguro de que deseas eliminar este usuario?
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="flex justify-end gap-2 mt-6">
            <Button onClick={handleDeleteConfirm} className="bg-destructive hover:bg-destructive/90 text-destructive-foreground px-4 py-2 rounded-lg transition">
              Eliminar
            </Button>
            <Button type="button" onClick={() => setIsDialogOpen(false)} className="bg-secondary hover:bg-secondary/80 text-secondary-foreground px-4 py-2 rounded-lg transition">
              Cancelar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal de Edición de Usuario */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="sm:max-w-md bg-background text-foreground p-6 rounded-lg shadow-xl border border-border">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold text-foreground">Editar Usuario</DialogTitle>
            <DialogDescription className="text-sm text-muted-foreground">
              Actualiza la información del usuario.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleEdit} className="py-4 space-y-4">
            <div className="space-y-2">
              <Label htmlFor="edit-email" className="text-foreground">Correo electrónico</Label>
              <Input
                id="edit-email"
                name="email"
                type="email"
                value={form.email}
                onChange={handleChange}
                placeholder="Correo electrónico"
                className={`${errors.email ? 'border-destructive' : ''} w-full border border-input bg-background px-3 py-2 text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2`}
              />
              {errors.email && <span className="text-destructive text-xs">{errors.email}</span>}
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-first_name" className="text-foreground">Nombre</Label>
              <Input
                id="edit-first_name"
                name="first_name"
                value={form.first_name}
                onChange={handleChange}
                placeholder="Nombre"
                className={`${errors.first_name ? 'border-destructive' : ''} w-full border border-input bg-background px-3 py-2 text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2`}
              />
              {errors.first_name && <span className="text-destructive text-xs">{errors.first_name}</span>}
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-last_name" className="text-foreground">Apellido</Label>
              <Input
                id="edit-last_name"
                name="last_name"
                value={form.last_name}
                onChange={handleChange}
                placeholder="Apellido"
                className={`${errors.last_name ? 'border-destructive' : ''} w-full border border-input bg-background px-3 py-2 text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2`}
              />
              {errors.last_name && <span className="text-destructive text-xs">{errors.last_name}</span>}
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-password" className="text-foreground">Contraseña (dejar en blanco para no cambiar)</Label>
              <Input
                id="edit-password"
                name="password"
                type="password"
                value={form.password}
                onChange={handleChange}
                placeholder="Nueva Contraseña"
                className={`${errors.password ? 'border-destructive' : ''} w-full border border-input bg-background px-3 py-2 text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2`}
              />
              {errors.password && <span className="text-destructive text-xs">{errors.password}</span>}
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-password_confirm" className="text-foreground">Confirmar Contraseña</Label>
              <Input
                id="edit-password_confirm"
                name="password_confirm"
                type="password"
                value={form.password_confirm}
                onChange={handleChange}
                placeholder="Confirmar Nueva Contraseña"
                className={`${errors.password_confirm ? 'border-destructive' : ''} w-full border border-input bg-background px-3 py-2 text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2`}
              />
              {errors.password_confirm && <span className="text-destructive text-xs">{errors.password_confirm}</span>}
            </div>
            <div className="flex items-center space-x-2">
              <Checkbox
                id="edit-is_staff"
                name="is_staff"
                checked={form.is_staff}
                onCheckedChange={(checked) => handleChange({ target: { name: 'is_staff', value: checked } })}
                className="border-input bg-background text-primary focus:ring-ring"
              />
              <Label htmlFor="edit-is_staff" className="text-foreground">Es Administrador</Label>
            </div>
            <DialogFooter className="flex justify-end gap-2 mt-6">
              <Button type="submit" className="bg-primary hover:bg-primary/90 text-primary-foreground px-4 py-2 rounded-lg transition">
                Guardar Cambios
              </Button>
              <Button type="button" onClick={() => setIsEditDialogOpen(false)} className="bg-secondary hover:bg-secondary/80 text-secondary-foreground px-4 py-2 rounded-lg transition">
                Cancelar
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default UserManagementPage;