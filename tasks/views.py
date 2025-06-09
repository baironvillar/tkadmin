from rest_framework import viewsets, permissions, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework_simplejwt.tokens import RefreshToken
from django.contrib.auth import get_user_model
from django.utils import timezone
from datetime import timedelta
from .models import Task
from .serializer import TaskSerializer, UserSerializer
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework.exceptions import ValidationError as DRFValidationError
from django.db import models

User = get_user_model()

class IsAdminOrSelf(permissions.BasePermission):
    def has_object_permission(self, request, view, obj):
        return request.user.is_staff or obj == request.user

class UserViewSet(viewsets.ModelViewSet):
    queryset = User.objects.all()
    serializer_class = UserSerializer
    permission_classes = [IsAuthenticated, IsAdminOrSelf]

    def get_permissions(self):
        if self.action == 'create':
            return [permissions.IsAdminUser()]
        return super().get_permissions()

    def get_queryset(self):
        if self.request.user.is_staff:
            return User.objects.all()
        return User.objects.filter(id=self.request.user.id)

    def create(self, request, *args, **kwargs):
        return super().create(request, *args, **kwargs)

    @action(detail=False, methods=['post'], permission_classes=[AllowAny])
    def login(self, request):
        email = request.data.get('email')
        password = request.data.get('password')
        try:
            user = User.objects.get(email=email)
            if user.is_locked and user.lockout_until and user.lockout_until > timezone.now():
                return Response({'error': 'Cuenta bloqueada. Intente más tarde.'}, status=status.HTTP_403_FORBIDDEN)
            if not user.check_password(password):
                user.failed_login_attempts += 1
                if user.failed_login_attempts >= 5:
                    user.is_locked = True
                    user.lockout_until = timezone.now() + timedelta(minutes=30)
                user.save()
                return Response({'error': 'Credenciales inválidas'}, status=status.HTTP_401_UNAUTHORIZED)
            user.failed_login_attempts = 0
            user.save()
            refresh = RefreshToken.for_user(user)
            return Response({
                'refresh': str(refresh),
                'access': str(refresh.access_token),
                'user': UserSerializer(user).data
            })
        except User.DoesNotExist:
            return Response({'error': 'Usuario no encontrado'}, status=status.HTTP_404_NOT_FOUND)

class IsAdminOrTaskOwner(permissions.BasePermission):
    def has_object_permission(self, request, view, obj):
        if request.user.is_staff:
            return True
        return obj.user == request.user

class TaskViewSet(viewsets.ModelViewSet):
    serializer_class = TaskSerializer
    permission_classes = [IsAuthenticated, IsAdminOrTaskOwner]

    def get_queryset(self):
        user = self.request.user
        queryset = Task.objects.all()

        # Si el usuario no es admin, solo ve sus propias tareas
        if not user.is_staff:
            queryset = queryset.filter(user=user)
        else: # Si el usuario es admin
            # Si se proporciona un parámetro 'user' en la URL, filtramos por ese usuario.
            # Esto permite que el admin vea tareas de usuarios específicos si lo desea.
            user_id_param = self.request.query_params.get('user', None)
            if user_id_param:
                try:
                    target_user = User.objects.get(id=user_id_param)
                    queryset = queryset.filter(user=target_user)
                except User.DoesNotExist:
                    # Si el user_id no existe, no se devuelve ninguna tarea
                    queryset = Task.objects.none()
            # Si no se proporciona 'user_id_param', el admin ve todas las tareas (comportamiento por defecto)

        # Filtrar por búsqueda si se proporciona
        search = self.request.query_params.get('search', None)
        if search:
            queryset = queryset.filter(
                models.Q(title__icontains=search) |
                models.Q(description__icontains=search) |
                models.Q(user__email__icontains=search)
            )

        return queryset.select_related('user')

    def perform_create(self, serializer):
        # Si es admin y se especifica un usuario, usar ese usuario
        if self.request.user.is_staff and 'user' in self.request.data:
            user_id = self.request.data.get('user')
            try:
                user = User.objects.get(id=user_id)
                serializer.save(user=user)
            except User.DoesNotExist:
                raise DRFValidationError({"user": "El usuario especificado no existe."})
        else:
            # Si no es admin o no se especifica usuario, asignar al usuario actual
            serializer.save(user=self.request.user)

    def update(self, request, *args, **kwargs):
        partial = kwargs.pop('partial', False)
        instance = self.get_object()

        # Si no es admin, solo permitir modificar ciertos campos
        if not request.user.is_staff:
            allowed_fields = {'tiempo_empleado', 'descripcion_realizada', 'completed'}
            for field in request.data.keys():
                if field not in allowed_fields:
                    raise DRFValidationError(
                        {"detail": f"No tienes permiso para modificar el campo '{field}'."},
                        code=status.HTTP_403_FORBIDDEN
                    )

            # Impedir que un usuario normal cambie is_confirmed_by_admin
            if 'is_confirmed_by_admin' in request.data and request.data['is_confirmed_by_admin'] != instance.is_confirmed_by_admin:
                 raise DRFValidationError(
                    {"is_confirmed_by_admin": "Solo los administradores pueden confirmar tareas."},
                    code=status.HTTP_403_FORBIDDEN
                )

        serializer = self.get_serializer(instance, data=request.data, partial=partial)
        serializer.is_valid(raise_exception=True)
        self.perform_update(serializer)

        return Response(serializer.data)

    def perform_update(self, serializer):
        # Si es admin y se especifica un usuario, actualizar el usuario asignado
        if self.request.user.is_staff and 'user' in self.request.data:
            user_id = self.request.data.get('user')
            try:
                user = User.objects.get(id=user_id)
                serializer.save(user=user)
            except User.DoesNotExist:
                raise DRFValidationError({"user": "El usuario especificado no existe."})
        else:
            serializer.save()

    def perform_destroy(self, instance):
        instance.delete()