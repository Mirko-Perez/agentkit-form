# Sistema de Autenticación - Setup y Uso

## ✅ Implementación Completada

### Backend

1. **Tablas de Base de Datos:**
   - `users` - Usuarios con roles y región
   - `user_sessions` - Gestión de sesiones (opcional)

2. **Endpoints de Autenticación:**
   - `POST /api/auth/register` - Registrar nuevo usuario
   - `POST /api/auth/login` - Iniciar sesión
   - `GET /api/auth/profile` - Obtener perfil del usuario
   - `PUT /api/auth/profile` - Actualizar perfil
   - `GET /api/auth/users` - Listar usuarios (solo admin)

3. **Middleware:**
   - `authenticate` - Verificar token JWT
   - `authorize` - Verificar roles (admin, editor, viewer)
   - `checkRegion` - Verificar acceso por región

### Frontend

1. **Componentes:**
   - `Login.tsx` - Página de inicio de sesión
   - `Register.tsx` - Página de registro
   - `Header.tsx` - Barra de navegación con info del usuario
   - `ProtectedRoute.tsx` - Protección de rutas
   - `AuthContext.tsx` - Contexto de autenticación

2. **Páginas:**
   - `/login` - Login
   - `/register` - Registro

## 🚀 Configuración Inicial

### 1. Ejecutar Migraciones

```bash
cd backend
psql -d agentkit_form -f database/auth_tables.sql
```

### 2. Configurar Variables de Entorno

Agregar al archivo `.env` del backend:

```env
JWT_SECRET=tu-clave-secreta-muy-segura-aqui
JWT_EXPIRES_IN=7d
```

**⚠️ IMPORTANTE:** Cambiar `JWT_SECRET` en producción por una clave segura.

### 3. Usuario Admin por Defecto

Se crea automáticamente un usuario admin:
- **Email/Usuario:** admin o admin@gmail.com
- **Password:** admin123
- **Rol:** admin
- **Región:** España

**⚠️ CAMBIAR LA CONTRASEÑA EN PRODUCCIÓN**

**Nota:** El sistema acepta tanto "admin" como "admin@gmail.com" para el login.

## 👥 Roles y Permisos

### Admin
- Acceso total a todas las funcionalidades
- Puede ver datos de todas las regiones
- Puede gestionar usuarios
- Puede autorizar reportes

### Editor
- Puede crear y editar encuestas y reportes
- Acceso limitado a su región asignada
- No puede gestionar usuarios

### Viewer (Visualizador)
- Solo lectura
- Acceso limitado a su región asignada
- No puede crear ni editar

## 🌍 Diferenciación por Región

Los usuarios están asignados a una región (Perú, Chile, Venezuela, España, etc.).

- **Admins:** Pueden acceder a datos de todas las regiones
- **Otros roles:** Solo pueden acceder a datos de su región asignada

El middleware `checkRegion` valida automáticamente el acceso por región.

## 📝 Uso

### Registro de Usuario

1. Visitar `/register`
2. Completar formulario:
   - Nombre completo
   - Email
   - Región
   - Rol (puede ser cambiado por admin después)
   - Contraseña (mínimo 6 caracteres)

### Login

1. Visitar `/login`
2. Ingresar email y contraseña
3. El token se guarda automáticamente en localStorage

### Proteger Rutas

```tsx
import { ProtectedRoute } from "../components/ProtectedRoute";

export default function MyPage() {
  return (
    <ProtectedRoute requireAdmin={true}>
      {/* Contenido solo para admins */}
    </ProtectedRoute>
  );
}
```

Opciones:
- `requireAdmin={true}` - Solo admins
- `requireEditor={true}` - Editores y admins
- Sin props - Cualquier usuario autenticado

### Usar Autenticación en Componentes

```tsx
import { useAuth } from "../contexts/AuthContext";

export function MyComponent() {
  const { user, isAuthenticated, isAdmin, logout } = useAuth();
  
  if (!isAuthenticated) {
    return <div>Por favor inicia sesión</div>;
  }
  
  return (
    <div>
      <p>Hola {user?.name}</p>
      <p>Tu región: {user?.region}</p>
      {isAdmin && <p>Eres administrador</p>}
    </div>
  );
}
```

## 🔒 Seguridad

1. **Passwords:** Hasheados con bcrypt (10 rounds)
2. **JWT Tokens:** Firmados con secret key
3. **Rate Limiting:** Ya configurado en el servidor
4. **CORS:** Configurado para el frontend
5. **Helmet:** Headers de seguridad

## 🧪 Testing

### Crear Usuarios de Prueba

```bash
# Usuario admin (ya existe)
Email/Usuario: admin o admin@gmail.com
Password: admin123

# Crear usuario editor desde el frontend
# O directamente en la base de datos:
INSERT INTO users (id, email, name, password_hash, role, region, is_active)
VALUES (
  'user_test',
  'editor@test.com',
  'Editor Test',
  '$2a$10$...', -- Hash de 'password123'
  'editor',
  'Perú',
  true
);
```

## 📋 Próximos Pasos

1. **Cambiar contraseña del admin** en producción
2. **Configurar JWT_SECRET** seguro
3. **Agregar más validaciones** si es necesario
4. **Implementar recuperación de contraseña** (opcional)
5. **Agregar 2FA** (opcional, para mayor seguridad)

## 🐛 Troubleshooting

**Error: "No token provided"**
- Verificar que el token esté en localStorage
- Verificar que el header Authorization esté siendo enviado

**Error: "Invalid or expired token"**
- El token expiró (por defecto 7 días)
- Hacer logout y login nuevamente

**Error: "Insufficient permissions"**
- El usuario no tiene el rol requerido
- Verificar el rol en la base de datos

**Error: "Access denied: You can only access data from your assigned region"**
- El usuario está intentando acceder a datos de otra región
- Solo admins pueden acceder a todas las regiones

