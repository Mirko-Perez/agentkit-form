# 🚀 Despliegue en Producción - EMCOPRE

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

```bash
cd backend
npm run build:all
```

Esto hará:
1. Instalar dependencias del frontend
2. Construir el frontend en modo standalone
3. Copiar archivos al directorio del backend
4. Compilar el backend TypeScript

### 3. Iniciar en Producción

```bash
cd backend
npm run start:prod
```

O usando PM2 para producción:

```bash
npm install -g pm2
pm2 start dist/server.js --name emcopre-app
pm2 save
pm2 startup
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