import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import rateLimit from 'express-rate-limit';
import dotenv from 'dotenv';
import path from 'path';
import { existsSync } from 'fs';

// Import routes
import surveyRoutes from './routes/survey.routes';
import reportRoutes from './routes/report.routes';
import importRoutes from './routes/import.routes';
import sensoryRoutes from './routes/sensory.routes';
import authRoutes from './routes/auth.routes';
import categoryRoutes from './routes/category.routes';

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

// Security middleware
app.use(helmet({
  contentSecurityPolicy: false, // Disable CSP for static files
}));
app.use(cors({
  origin: process.env.FRONTEND_URL || '*', // Allow all origins when serving from same server
  credentials: true
}));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP, please try again later.'
});
app.use('/api/', limiter);

// Logging
app.use(morgan('combined'));

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'OK', timestamp: new Date().toISOString() });
});

// API routes
app.use('/api/auth', authRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/surveys', surveyRoutes);
app.use('/api/reports', reportRoutes);
app.use('/api/import', importRoutes);
app.use('/api/sensory', sensoryRoutes);

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'OK', timestamp: new Date().toISOString() });
});

// 2. Servir archivos estáticos del frontend
const staticPath = path.join(__dirname, '../frontend/out');

console.log('Directorio estático del frontend:', staticPath);
if (existsSync(staticPath)) {
  app.use(express.static(staticPath));
  console.log('✅ Frontend estático encontrado y servido');
} else {
  console.log('⚠️  Frontend estático no encontrado en:', staticPath);
}

// 3. Manejar rutas no encontradas de la API
app.use(/^\/api\/.*$/, (req, res) => {
  res.status(404).json({ error: 'API route not found' });
});

// 4. Catch-all handler: enviar el archivo index.html para rutas del frontend
app.get('*', (req, res) => {
  const indexPath = path.join(staticPath, 'index.html');

  if (existsSync(indexPath)) {
    res.sendFile(indexPath);
  } else {
    console.error('Archivo index.html no encontrado en:', indexPath);
    res.status(404).send('Frontend no encontrado. Ejecuta: npm run build:all');
  }
});

// Error handling middleware
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error(err.stack);
  res.status(500).json({
    error: 'Internal server error',
    message: process.env.NODE_ENV === 'development' ? err.message : 'Something went wrong'
  });
});

app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`📊 Health check: http://localhost:${PORT}/health`);
});

export default app;
