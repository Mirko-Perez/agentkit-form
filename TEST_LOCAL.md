# Cómo Probar en Local

## Opción 1: Desarrollo (Frontend y Backend separados)

```bash
# Terminal 1 - Backend
cd backend
npm run dev

# Terminal 2 - Frontend  
cd frontend
npm run dev
```

- Backend: http://localhost:3001
- Frontend: http://localhost:3000

## Opción 2: Producción Local (Un solo puerto)

**Nota**: Actualmente hay un problema con las rutas dinámicas en Next.js cuando se usa `output: 'export'`. 

Para probar en local con un solo puerto, puedes:

1. **Usar el modo desarrollo** (Opción 1) - más fácil para desarrollo
2. **Configurar un proxy** en el frontend para apuntar al backend

### Configurar proxy en desarrollo:

En `frontend/next.config.ts`, agregar:

```typescript
const nextConfig: NextConfig = {
  async rewrites() {
    return [
      {
        source: '/api/:path*',
        destination: 'http://localhost:3001/api/:path*',
      },
    ];
  },
};
```

Luego ejecutar solo el frontend:
```bash
cd frontend
npm run dev
```

El frontend estará en http://localhost:3000 y las llamadas a `/api/*` se redirigirán automáticamente al backend en el puerto 3001.

## Opción 3: Build Manual (cuando se resuelva el problema de rutas dinámicas)

```bash
cd backend
npm run build:all
npm start
```

La aplicación estará disponible en http://localhost:3001




