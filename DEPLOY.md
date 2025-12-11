# Despliegue – EMCOPRE Análisis Sensorial

## Requisitos
- Node.js 18+ (ideal 20+)
- PostgreSQL 14+
- Puertos por defecto: backend 3001, frontend 3000 (ajusta si hace falta)

## 1) Clonar
```bash
git clone <repo>
cd agentkit-form
```

## 2) Backend `.env`
Crea `backend/.env`:
```
PORT=3001
DATABASE_URL=postgres://<user>:<pass>@<host>:<port>/emcopre_analisis_sensorial
JWT_SECRET=un_secreto_seguro
OPENAI_API_KEY=opcional
```

## 3) Base de datos
```bash
createdb emcopre_analisis_sensorial
```
Migraciones (en orden sugerido):
```bash
psql -d emcopre_analisis_sensorial -f database/sensory_tables.sql
psql -d emcopre_analisis_sensorial -f database/auth_tables.sql
psql -d emcopre_analisis_sensorial -f database/migrations_add_region_project.sql
psql -d emcopre_analisis_sensorial -f database/product_categories.sql
psql -d emcopre_analisis_sensorial -f database/iso_5495_critical_values.sql
psql -d emcopre_analisis_sensorial -f database/fix_sensory_tables.sql
psql -d emcopre_analisis_sensorial -f database/reports_table_view.sql
```

## 4) Dependencias
```bash
cd backend && npm install
cd ../frontend && npm install
```

## 5) Modo desarrollo (verificación)
Backend:
```bash
cd backend
npm run dev
```
Frontend (otra terminal):
```bash
cd frontend
npm run dev
```
- Backend health: http://localhost:3001/health  
- Frontend: http://localhost:3000

Credenciales admin por defecto:
- usuario: admin o admin@gmail.com
- pass: admin123

## 6) Build producción
Backend:
```bash
cd backend
npm run build
```
Frontend:
```bash
cd ../frontend
npm run build
npm run start
```

## 7) Ejemplo PM2 + reverse proxy
Backend:
```bash
cd backend
pm2 start dist/server.js --name emcopre-api
```
Frontend:
```bash
cd frontend
pm2 start "npm run start" --name emcopre-web
```
Nginx/Apache (idea):
- `/api` → http://127.0.0.1:3001
- `/` → http://127.0.0.1:3000

## 8) Checklist post-deploy
- Login admin y cambiar password si aplica.
- Subir una evaluación sensorial (elige categoría y región).
- Ver en `/reports-planilla`; probar “Eliminar seleccionados”.
- Regenerar reporte con `?force=true` si necesitas refrescar datos.

## 9) Backups y secretos
- Respaldar `DATABASE_URL`, `JWT_SECRET`, `OPENAI_API_KEY` (si se usa).
- Programar backups regulares de `emcopre_analisis_sensorial`.


