# 🚀 Despliegue - EMCOPRE Análisis Sensorial

## 📋 Lo que tienes

- **Backend**: Express.js con TypeScript
- **Frontend**: Next.js (ya compilado estáticamente)
- **Base de datos**: PostgreSQL con 9 archivos de migración
- **Puerto único**: Todo funciona en puerto 3001

## 🛠️ Pasos para desplegar

### 1. Instalar dependencias del sistema
```bash
# Node.js 18+ y PostgreSQL
sudo apt update
sudo apt install -y nodejs npm postgresql postgresql-contrib
```

### 2. Configurar base de datos
```bash
# Crear base de datos
sudo -u postgres createdb emcopre_analisis_sensorial

# Ejecutar migraciones en orden
cd backend
psql -d emcopre_analisis_sensorial -f database/sensory_tables.sql
psql -d emcopre_analisis_sensorial -f database/auth_tables.sql
psql -d emcopre_analisis_sensorial -f database/migrations_add_region_project.sql
psql -d emcopre_analisis_sensorial -f database/product_categories.sql
psql -d emcopre_analisis_sensorial -f database/iso_5495_critical_values.sql
psql -d emcopre_analisis_sensorial -f database/fix_sensory_tables.sql
psql -d emcopre_analisis_sensorial -f database/reports_table_view.sql
```

### 3. Configurar variables de entorno
```bash
cd backend
cp env.example .env
nano .env  # Editar con tus valores reales
```

### 4. Instalar dependencias del proyecto
```bash
cd backend
npm install

cd ../frontend
npm install
```

### 5. Construir para producción
```bash
cd backend
npm run build:all  # Construye frontend + backend
```

### 6. Iniciar aplicación
```bash
cd backend
npm start  # Puerto 3001
```

### 7. Verificar funcionamiento
```bash
# Health check
curl http://localhost:3001/health

# Verificar frontend
curl -s http://localhost:3001/ | head -5
```

## 🎯 URLs de acceso

- **Aplicación**: `http://tu-servidor:3001`
- **Health check**: `http://tu-servidor:3001/health`
- **APIs**: `http://tu-servidor:3001/api/*`

## 🔑 Credenciales por defecto

- **Usuario**: admin@gmail.com
- **Contraseña**: admin123

## 🔧 Para producción con PM2

```bash
npm install -g pm2
cd backend
pm2 start dist/server.js --name emcopre-app
pm2 save
pm2 startup
```

## 📊 Verificar que todo funciona

1. ✅ Health check responde
2. ✅ Frontend carga (HTML visible)
3. ✅ Login funciona
4. ✅ Puedes subir archivos CSV
5. ✅ Se generan reportes
6. ✅ Planilla de reportes funciona

---

**¡Eso es todo!** La aplicación usa un solo puerto y un solo proceso. 🎉





