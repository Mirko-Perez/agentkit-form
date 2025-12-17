# 🚀 Despliegue - emcopre.fritzvzla.com

## Configuración Rápida

### 1. Variables de Entorno

Crea `backend/.env`:

```env
NODE_ENV=production
FRONTEND_URL=https://emcopre.fritzvzla.com
DB_HOST=localhost
DB_PORT=5432
DB_NAME=emcopre_analisis_sensorial
DB_USER=postgres
DB_PASSWORD=tu_password
OPENAI_API_KEY=tu_api_key
OPENAI_PROXY_URL=https://orange-silence-9576.chiletecnologia2.workers.dev/v1
JWT_SECRET=tu_jwt_secret_seguro
JWT_EXPIRES_IN=24h
```

**Nota**: `PORT` no es necesario - IIS lo define en Site Bindings.

### 2. Construir

```bash
cd backend
npm install
npm run build:all
```

### 3. Configurar IIS

1. **IIS Manager** → Crear/editar sitio
2. **Physical Path**: `C:\site\agentkit-form\backend`
3. **Binding** (IMPORTANTE):
   - Type: https
   - Port: **443** (puerto HTTPS estándar - NO uses 9905)
   - Host: emcopre.fritzvzla.com
   - SSL Certificate: Tu certificado

**⚠️ CORRECCIÓN IMPORTANTE:**
- Si configuraste el puerto **9905** en IIS, cámbialo a **443**
- IIS debe escuchar en **443** (puerto HTTPS estándar)
- El puerto 9905 es solo para Node.js directo (sin iisnode)
- Con iisnode, IIS maneja el puerto 443 y redirige internamente a Node.js

### 4. Archivos Necesarios en `backend/`

- ✅ `web.config`
- ✅ `run.cjs`
- ✅ `dist/server.js` (generado con `npm run build`)
- ✅ `node_modules/` (instalado con `npm install`)
- ✅ Archivos estáticos del frontend (index.html, _next/, etc.)

### 5. Verificar

- https://emcopre.fritzvzla.com/health
- https://emcopre.fritzvzla.com/

## Troubleshooting

**Error 500**: Verifica logs en `backend/iisnode/stderr.log`

**API no responde**: Verifica que `web.config` tenga la regla `APIRoutes`

**Frontend no carga**: Ejecuta `npm run build:all` para generar archivos estáticos
