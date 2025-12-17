# 🚀 Despliegue en Producción - EMCOPRE

## ⚠️ Nota Importante sobre `dist/`

**NO subas `dist/` al repositorio Git** - está en `.gitignore` y se genera automáticamente.

**Opciones para producción:**
1. **Recomendado**: Generar `dist/` en el servidor ejecutando `npm run build:all`
2. **Alternativa**: Generar localmente y subir manualmente (pero NO al Git)

## 📋 Configuración para Producción

### 1. Variables de Entorno

Asegúrate de tener configurado `.env` en el directorio `backend/`:

```bash
# Copiar el archivo de ejemplo
cp backend/env.example backend/.env

# Editar con tus valores reales
nano backend/.env  # Linux/Mac
# o
notepad backend\.env  # Windows
```

**⚠️ IMPORTANTE - Configuración de Puerto:**

En Windows, NO uses puertos privilegiados (80, 443) directamente. Usa un puerto alto:

```env
# ✅ CORRECTO (puerto alto, no requiere permisos de admin)
PORT=4044

# ❌ INCORRECTO (requiere ejecutar como administrador)
PORT=443
PORT=80
```

**⚠️ IMPORTANTE - URL del Frontend:**

El `FRONTEND_URL` en el backend es solo para CORS. El frontend usa rutas relativas (`/api`) cuando se sirve desde el mismo servidor, así que NO necesitas configurar `NEXT_PUBLIC_API_URL` a menos que el frontend esté en un servidor diferente.

**Para producción con HTTPS:**
- Usa un proxy reverso (nginx, IIS) que escuche en 443
- Node.js escucha en un puerto alto (4044, 8080, etc.)
- El proxy redirige el tráfico a Node.js

Variables importantes:
- `PORT=3001` o `PORT=8080` (puertos altos, no requieren permisos de admin)
  - ⚠️ **NO uses 80 o 443 directamente** - requieren permisos de administrador
  - Para HTTPS en producción, usa un proxy reverso (nginx, IIS, etc.)
- `NODE_ENV=production`
- `FRONTEND_URL=https://emcopre.fritzvzla.com` (o la URL de tu servidor)
- Configuración de base de datos PostgreSQL

### 2. Instalar Dependencias (OBLIGATORIO - PRIMERO)

**⚠️ CRÍTICO**: Debes instalar las dependencias ANTES de hacer el build.

```bash
cd backend
npm install
```

Esto instalará:
- TypeScript (necesario para compilar)
- cross-env (para variables de entorno multiplataforma)
- Todas las demás dependencias

### 3. Construir para Producción

**⚠️ IMPORTANTE**: El directorio `dist/` NO debe subirse al repositorio (está en `.gitignore`). 
Debes generarlo en el servidor ejecutando el build.

**En el servidor de producción:**

```bash
cd backend

# 1. PRIMERO: Instalar dependencias (si no lo hiciste antes)
npm install

# 2. LUEGO: Construir todo
npm run build:all
```

**Si el build falla con "tsc no se reconoce":**
- Asegúrate de haber ejecutado `npm install` primero
- TypeScript está en `devDependencies` y se instala con `npm install`

Esto hará:
1. Instalar dependencias del frontend
2. Construir el frontend en modo standalone
3. Copiar archivos al directorio del backend
4. Compilar el backend TypeScript → **genera `dist/`**

**Alternativa: Si prefieres construir localmente y subir:**
```bash
# En tu máquina local
cd backend
npm run build:all

# Luego sube TODO el directorio backend/ (incluyendo dist/)
# Pero NO lo subas al repositorio Git
```

### 4. Iniciar en Producción

**Opción 1: Usando npm script (recomendado - funciona en Windows y Linux)**
```bash
cd backend
npm install  # Asegúrate de tener todas las dependencias instaladas
npm run start:prod
```

**Opción 2: Directamente con node (si NODE_ENV ya está en .env)**
```bash
cd backend
# NODE_ENV se leerá automáticamente del archivo .env
node dist/server.js
```

**Opción 3: En Windows (si cross-env no funciona)**
```bash
cd backend
# Establecer variable de entorno en Windows PowerShell
$env:NODE_ENV="production"
node dist/server.js

# O en CMD:
set NODE_ENV=production
node dist/server.js
```

O usando PM2 para producción:

```bash
npm install -g pm2
# Opción 1: Con variable de entorno en el comando
pm2 start dist/server.js --name emcopre-app --env production

# Opción 2: Con archivo de ecosistema (recomendado)
# Crear archivo ecosystem.config.js en backend/
pm2 start ecosystem.config.js
pm2 save
pm2 startup
```

**Nota**: Si estás en Windows, asegúrate de instalar `cross-env`:
```bash
npm install cross-env
```

### 4. Verificar Despliegue

```bash
# Health check
curl https://emcopre.fritzvzla.com/health

# Verificar que el frontend carga
curl -s https://emcopre.fritzvzla.com/ | head -5
```

## 🏗️ Arquitectura de Producción

- **Frontend**: Next.js en modo standalone (archivos estáticos optimizados)
- **Backend**: Express.js sirviendo tanto API como archivos estáticos
- **Puerto único**: Todo funciona en el puerto configurado (80/443)
- **Dominio**: https://emcopre.fritzvzla.com/

## 🔧 Solución de Problemas

### Error: EACCES permission denied port 443 (o 80)

**Problema**: Estás intentando usar un puerto privilegiado (< 1024) sin permisos de administrador.

**Solución 1: Usar un puerto alto (recomendado para desarrollo/testing)**
```bash
# En backend/.env
PORT=3001  # o 8080, 3000, etc.
```

**Solución 2: Ejecutar como administrador (solo si realmente necesitas 443)**
```bash
# En Windows PowerShell (como administrador)
node dist/server.js
```

**Solución 3: Usar proxy reverso para producción (recomendado)**
- Configura nginx o IIS como proxy reverso
- El proxy escucha en 443 (HTTPS)
- Node.js escucha en un puerto alto (ej: 3001)
- El proxy redirige el tráfico a Node.js

### Error: "tsc no se reconoce como comando"

**Problema**: TypeScript no está instalado o las dependencias no están instaladas.

**Solución:**
```bash
cd backend
npm install  # Esto instala TypeScript y todas las dependencias
npm run build  # Ahora debería funcionar
```

### Error: EPERM operation not permitted al copiar archivos

**Problema**: Windows bloquea archivos que están en uso o hay problemas de permisos.

**Solución:**
```bash
# El script ahora maneja estos errores automáticamente
# Si persiste, cierra cualquier proceso que esté usando los archivos
# o ejecuta como administrador:
npm run build:all
```

### Error: EADDRINUSE port already in use

**Problema**: El puerto ya está en uso por otro proceso.

**Solución:**
```bash
# Windows: Encontrar y cerrar el proceso
netstat -ano | findstr :4044
taskkill /PID <PID_NUMBER> /F

# O cambiar el puerto en .env
PORT=3002
```

### Frontend sigue usando URL antigua (localhost:3001)

**Problema**: El frontend compilado tiene hardcodeada la URL antigua.

**Solución**: Recompilar el frontend después de los cambios:
```bash
cd backend
npm run build:all
# Esto recompilará el frontend con las rutas relativas correctas
```

**Nota**: El frontend ahora usa rutas relativas (`/api`) cuando se sirve desde el mismo servidor, así que funciona automáticamente sin necesidad de configurar `NEXT_PUBLIC_API_URL`.

### Frontend no carga
```bash
# Reconstruir todo
cd backend
rm -rf ../frontend/.next node_modules .next
npm run build:all
```

### API no responde
```bash
# Verificar logs
pm2 logs emcopre-app

# Reiniciar
pm2 restart emcopre-app
```

### Base de datos
```bash
# Verificar conexión
cd backend
npm run db:setup
```

## 📊 Monitoreo

```bash
# Ver estado de PM2
pm2 status

# Ver logs
pm2 logs emcopre-app

# Monitoreo en tiempo real
pm2 monit
```

---

**¡Listo para producción!** 🎉

El sistema ahora sirve tanto el frontend como el backend desde un solo puerto, optimizado para producción con Next.js standalone.