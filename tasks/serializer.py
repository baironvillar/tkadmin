from rest_framework import serializers
from django.contrib.auth import get_user_model
from django.core.exceptions import ValidationError
from django.contrib.auth.password_validation import validate_password
from .models import Task

User = get_user_model()

class UserSerializer(serializers.ModelSerializer):
    password = serializers.CharField(
        write_only=True, 
        required=False, 
        style={'input_type': 'password'},
        validators=[validate_password]
    )
    password_confirm = serializers.CharField(
        write_only=True, 
        required=False, 
        style={'input_type': 'password'}
    )

    class Meta:
        model = User
        fields = (
            'id', 'email', 'first_name', 'last_name',
            'password', 'password_confirm',
            'is_staff', 'is_superuser'
        )
        extra_kwargs = {
            'email': {'required': True}
        }

    def validate_email(self, value):
        # Allow current user's email to pass without validation error
        if self.instance and self.instance.email == value:
            return value
        if User.objects.filter(email=value).exists():
            raise serializers.ValidationError("Este correo electrónico ya está registrado")
        return value

    def validate(self, data):
        # Only validate passwords if they are provided
        if 'password' in data or 'password_confirm' in data:
            if data.get('password') != data.get('password_confirm'):
                raise serializers.ValidationError({
                    "password_confirm": "Las contraseñas no coinciden"
                })
            
            # Validate minimum password length
            if len(data['password']) < 8:
                raise serializers.ValidationError({
                    "password": "La contraseña debe tener al menos 8 caracteres"
                })
            
            # Validate if password contains at least one number
            if not any(char.isdigit() for char in data['password']):
                raise serializers.ValidationError({
                    "password": "La contraseña debe contener al menos un número"
                })
            
            # Validate if password contains at least one uppercase letter
            if not any(char.isupper() for char in data['password']):
                raise serializers.ValidationError({
                    "password": "La contraseña debe contener al menos una letra mayúscula"
                })
        
        return data

    def create(self, validated_data):
        validated_data.pop('password_confirm')
        user = User.objects.create_user(**validated_data)
        return user

    def update(self, instance, validated_data):
        # Remove password fields if they are empty
        password = validated_data.pop('password', None)
        password_confirm = validated_data.pop('password_confirm', None)

        if password:
            instance.set_password(password)

        # Update other fields
        instance.email = validated_data.get('email', instance.email)
        instance.first_name = validated_data.get('first_name', instance.first_name)
        instance.last_name = validated_data.get('last_name', instance.last_name)
        instance.is_staff = validated_data.get('is_staff', instance.is_staff)
        
        instance.save()
        return instance

class TaskSerializer(serializers.ModelSerializer):
    user = serializers.PrimaryKeyRelatedField(
        queryset=User.objects.all(),
        required=False,
        allow_null=True
    )
    user_email = serializers.EmailField(source='user.email', read_only=True)
    user_name = serializers.SerializerMethodField(read_only=True)

    class Meta:
        model = Task
        fields = (
            'id', 'title', 'description', 'completed', 
            'is_confirmed_by_admin', 'created_at', 'updated_at', 
            'user', 'user_email', 'user_name',
            'tiempo_empleado', 'descripcion_realizada'
        )
        read_only_fields = ('created_at', 'updated_at')

    def get_user_name(self, obj):
        if obj.user:
            return f"{obj.user.first_name} {obj.user.last_name}"
        return None

    def validate(self, data):
        request = self.context.get('request')
        if not request:
            return data

        # Si es una creación y no se especifica usuario, asignar al usuario actual
        if self.instance is None and 'user' not in data:
            data['user'] = request.user

        # Si es una actualización y el usuario no es admin, solo permitir ciertos campos
        if self.instance and not request.user.is_staff:
            allowed_fields = {'completed', 'tiempo_empleado', 'descripcion_realizada'}
            for field in data.keys():
                if field not in allowed_fields:
                    raise serializers.ValidationError({
                        field: f"No tienes permiso para modificar el campo '{field}'."
                    })

        return data