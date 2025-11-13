# AgentKit Survey Analytics

Una aplicación completa para crear encuestas y generar reportes con análisis impulsado por IA usando OpenAI AgentKit.

## 🚀 Características

- **Frontend Moderno**: Next.js 14 con TypeScript y Tailwind CSS
- **Backend Robusto**: Node.js con Express y PostgreSQL
- **Sistema de Caché**: Reportes almacenados en BD para acceso instantáneo (30 días)
- **Análisis con IA**: OpenAI AgentKit para insights automáticos
- **Evaluación Sensorial**: Sistema completo para análisis de preferencias (1er, 2do, 3er lugar)
- **Análisis Estadístico**: Pruebas de Friedman y comparaciones pareadas
- **Importación de Datos**: Soporte para Excel, CSV y Google Sheets
- **Reportes Profesionales**: Visualizaciones especializadas para evaluación sensorial
- **API RESTful**: Arquitectura limpia y escalable
- **Drag & Drop**: Interfaz intuitiva para subir archivos

## 📋 Prerrequisitos

- Node.js 18+
- PostgreSQL 12+
- OpenAI API Key

## 🛠️ Instalación

### 1. Clonar el repositorio
```bash
git clone <repository-url>
cd agentkit-form
```

### 2. Configurar PostgreSQL
```bash
# Crear base de datos
createdb agentkit_form

# O usando psql
psql -c "CREATE DATABASE agentkit_form;"
```

### 3. Configurar Backend
```bash
cd backend

# Instalar dependencias
npm install

# Configurar variables de entorno
cp env.example .env
# Editar .env con tus configuraciones

# Inicializar base de datos
npm run db:setup

# Iniciar servidor de desarrollo
npm run dev
```

### 4. Configurar Frontend
```bash
cd ../frontend

# Instalar dependencias
npm install

# Configurar variables de entorno (opcional)
echo "NEXT_PUBLIC_API_URL=http://localhost:3001/api" > .env.local

# Iniciar servidor de desarrollo
npm run dev
```

## ⚙️ Configuración

### Variables de Entorno Backend (.env)
```env
PORT=3001
NODE_ENV=development
FRONTEND_URL=http://localhost:3000
DB_HOST=localhost
DB_PORT=5432
DB_NAME=agentkit_form
DB_USER=postgres
DB_PASSWORD=your_password_here
OPENAI_API_KEY=your_openai_api_key_here
```

### Variables de Entorno Frontend (.env.local)
```env
NEXT_PUBLIC_API_URL=http://localhost:3001/api
```

## 🏃‍♂️ Uso

### Iniciar la aplicación completa
```bash
# Terminal 1 - Backend
cd backend && npm run dev

# Terminal 2 - Frontend
cd frontend && npm run dev
```

Visita `http://localhost:3000` para acceder a la aplicación.

### Probar Importación de Datos

1. Ve a la página de importación (`http://localhost:3000/import`)
2. Arrastra y suelta el archivo `example_data.csv` que se encuentra en la raíz del proyecto
3. O haz clic en el área para seleccionar el archivo
4. Espera a que se procese y genera automáticamente un reporte con análisis IA

El archivo de ejemplo contiene:
- 5 respuestas de muestra
- Diferentes tipos de preguntas (texto, calificaciones, sí/no)
- Datos que serán analizados por OpenAI AgentKit

### Solución de Problemas

**Error "Failed to fetch" o "Failed to generate report":**
- Asegúrate de que el backend esté corriendo (`npm run dev` en `/backend`)
- Verifica que PostgreSQL esté activo
- Confirma que las variables de entorno estén configuradas correctamente
- Si hay errores con OpenAI, el sistema funcionará con análisis básico

### API Endpoints

#### Surveys
- `POST /api/surveys` - Crear nueva encuesta
- `GET /api/surveys/:id` - Obtener encuesta por ID
- `POST /api/surveys/:id/responses` - Enviar respuesta

#### Reports
- `GET /api/reports/survey/:id` - Generar reporte de encuesta
- `GET /api/reports/dashboard` - Obtener vista general del dashboard

#### Import
- `POST /api/import/file` - Importar datos desde archivo Excel/CSV
- `POST /api/import/google-sheets` - Importar desde Google Sheets (próximamente)
- `GET /api/import/history` - Obtener historial de importaciones

## 📊 Funcionalidades

### Dashboard
- Vista general de todas las encuestas
- Estadísticas de respuestas
- Enlaces rápidos a reportes

### Reportes con IA
- Análisis automático de respuestas usando OpenAI
- Insights y recomendaciones generados por IA
- Visualizaciones interactivas de datos
- Resúmenes ejecutivos

### Importación de Datos

La aplicación soporta múltiples fuentes de datos:

- **Archivos Excel** (.xlsx, .xls): Importa hojas de cálculo con preguntas en la primera fila
- **Archivos CSV**: Datos separados por comas con headers
- **Google Sheets**: Próximamente - importación directa desde URLs de Google Sheets
- **Google Forms**: Próximamente - integración con respuestas de formularios

### Evaluación Sensorial

Sistema especializado para análisis de preferencias en productos:

- **Ranking de Productos**: Panelistas asignan 1er, 2do y 3er lugar
- **Comentarios Cualitativos**: Razones para cada preferencia
- **Análisis Estadístico**: Prueba de Friedman para diferencias significativas
- **Reportes Profesionales**: Visualizaciones especializadas con rankings y porcentajes

#### Formato de Datos para Evaluación Sensorial

```
Panelist_Name,Panelist_Email,Product_1_Preference,Product_1_Reason,Product_2_Preference,Product_2_Reason,Product_3_Preference,Product_3_Reason
Ana García,ana@email.com,1,Excelente sabor,2,Buen aroma,3,Color regular
Carlos López,carlos@email.com,3,Menos atractivo,1,Mejor textura,2,Sabor decente
```

### Tipos de Preguntas Soportadas
- Texto abierto (análisis de sentimiento)
- Opción múltiple (distribución de respuestas)
- Escala de calificación (promedios y tendencias)
- Preguntas Sí/No (análisis binario)
- **Ranking Sensorial** (1er, 2do, 3er lugar con razones)

## 💾 Sistema de Caché de Reportes

### ¿Cómo Funciona?
- **Almacenamiento**: Los reportes generados se guardan automáticamente en la base de datos
- **Duración**: Los reportes son válidos por 30 días desde su generación
- **Acceso**: Las consultas posteriores devuelven el reporte almacenado instantáneamente
- **Actualización**: Se puede forzar la regeneración cuando se necesiten datos frescos

### Beneficios
- **⚡ Rendimiento**: Acceso instantáneo a reportes ya generados
- **💰 Eficiencia**: Reduce llamadas innecesarias a la API de OpenAI
- **🔄 Consistencia**: Mismo reporte para múltiples usuarios
- **📈 Escalabilidad**: Manejo eficiente de carga del sistema

### Gestión de Reportes y Trazabilidad
```bash
# Limpiar reportes expirados manualmente (30 días de validez)
cd backend
npm run db:clean-reports

# Ver todos los reportes generados (para trazabilidad)
npm run db:list-reports

# Forzar regeneración desde el frontend
# Usar el botón "Actualizar Reporte" en la página del reporte
```

### API para Trazabilidad
```bash
# Ver lista de reportes generados
GET /api/reports/generated
GET /api/reports/generated?type=sensory  # Solo evaluaciones sensoriales
GET /api/reports/generated?type=survey   # Solo encuestas tradicionales
```

## 🏗️ Arquitectura

```
agentkit-form/
├── frontend/          # Next.js application
│   ├── src/
│   │   ├── app/       # Next.js app router
│   │   ├── components/# React components
│   │   ├── types/     # TypeScript types
│   │   └── utils/     # Utility functions
│   └── package.json
├── backend/           # Express.js API
│   ├── src/
│   │   ├── controllers/# Route handlers
│   │   ├── models/    # Data models
│   │   ├── routes/    # API routes
│   │   ├── utils/     # AgentKit integration
│   │   └── config/    # Database config
│   ├── database/      # SQL scripts
│   └── package.json
└── README.md
```

## 🤖 AgentKit Integration

La aplicación utiliza OpenAI AgentKit para:

1. **Procesar respuestas**: Análisis de sentimiento y metadata
2. **Generar insights**: Identificación de patrones y tendencias
3. **Crear resúmenes**: Reportes ejecutivos automáticos
4. **Análisis de texto**: Procesamiento de respuestas abiertas

## 📈 Desarrollo Futuro

- [ ] Autenticación y autorización de usuarios
- [ ] Exportación de reportes (PDF/Excel)
- [ ] Plantillas de encuestas predefinidas
- [ ] Integración con servicios de email
- [ ] Análisis en tiempo real
- [ ] API para integraciones externas

## 🤝 Contribución

1. Fork el proyecto
2. Crea una rama para tu feature (`git checkout -b feature/AmazingFeature`)
3. Commit tus cambios (`git commit -m 'Add some AmazingFeature'`)
4. Push a la rama (`git push origin feature/AmazingFeature`)
5. Abre un Pull Request

## 📄 Licencia

Este proyecto está bajo la Licencia MIT - ver el archivo [LICENSE](LICENSE) para más detalles.

## 🆘 Soporte

Si encuentras algún problema:

1. Revisa los logs del backend y frontend
2. Verifica la configuración de PostgreSQL
3. Asegúrate de tener una API key válida de OpenAI
4. Revisa las variables de entorno

Para más ayuda, abre un issue en el repositorio.
