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
nano backend/.env
```

Variables importantes:
- `PORT=80` o `PORT=443` para producción
- `NODE_ENV=production`
- `FRONTEND_URL=https://emcopre.fritzvzla.com`
- Configuración de base de datos PostgreSQL

### 2. Construir para Producción

**⚠️ IMPORTANTE**: El directorio `dist/` NO debe subirse al repositorio (está en `.gitignore`). 
Debes generarlo en el servidor ejecutando el build.

**En el servidor de producción:**

```bash
cd backend
npm install  # Instalar dependencias si es necesario
npm run build:all
```

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

### 3. Instalar dependencias (si es necesario)

```bash
cd backend
npm install
# Esto instalará cross-env que permite usar NODE_ENV en Windows y Linux
```

### 4. Iniciar en Producción

**Opción 1: Usando npm script (recomendado - funciona en Windows y Linux)**
```bash
cd backend
npm run start:prod
```

**Opción 2: Directamente con node (si NODE_ENV ya está en .env)**
```bash
cd backend
node dist/server.js
```

**Opción 3: En Windows (si no tienes cross-env)**
```bash
cd backend
# Establecer variable de entorno en Windows
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