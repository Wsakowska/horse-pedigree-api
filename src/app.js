const express = require('express');
const path = require('path');
const countryRoutes = require('./routes/countryRoutes');
const breederRoutes = require('./routes/breederRoutes');
const horseRoutes = require('./routes/horseRoutes');
const colorRoutes = require('./routes/colorRoutes');
const breedRoutes = require('./routes/breedRoutes');

const app = express();

// Middleware do parsowania JSON z większym limitem dla dużych rodowodów
app.use(express.json({ limit: '10mb' }));

// Middleware do obsługi CORS (jeśli potrzebne)
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
  
  if (req.method === 'OPTIONS') {
    res.sendStatus(200);
  } else {
    next();
  }
});

// Middleware do logowania requestów
app.use((req, res, next) => {
  const timestamp = new Date().toISOString();
  const method = req.method;
  const url = req.originalUrl;
  const ip = req.ip || req.connection.remoteAddress;
  
  console.log(`${timestamp} - ${method} ${url} - IP: ${ip}`);
  
  // Loguj body tylko dla POST/PUT i jeśli nie jest zbyt duże
  if ((method === 'POST' || method === 'PUT') && req.body && Object.keys(req.body).length > 0) {
    const bodyStr = JSON.stringify(req.body, null, 2);
    if (bodyStr.length < 1000) { // Ogranicz rozmiar logu
      console.log('Request Body:', bodyStr);
    } else {
      console.log('Request Body: [Large body omitted]');
    }
  }
  
  if (req.query && Object.keys(req.query).length > 0) {
    console.log('Query Params:', JSON.stringify(req.query, null, 2));
  }
  
  next();
});

// Serve static files from public folder
app.use(express.static(path.join(__dirname, '../public'), {
  maxAge: '1d', // Cache static files for 1 day
  etag: true
}));

// Health check endpoint z dodatkowymi informacjami
app.get('/api/health', async (req, res) => {
  try {
    // Test połączenia z bazą danych
    const knex = require('./config/db');
    await knex.raw('SELECT 1');
    
    // Sprawdź liczbę rekordów w głównych tabelach
    const stats = {
      countries: await knex('countries').count('* as count').first(),
      breeds: await knex('breeds').count('* as count').first(),
      colors: await knex('colors').count('* as count').first(),
      breeders: await knex('breeders').count('* as count').first(),
      horses: await knex('horses').count('* as count').first()
    };
    
    res.json({ 
      status: 'OK', 
      timestamp: new Date().toISOString(),
      database: 'connected',
      version: '1.1.0',
      node_version: process.version,
      environment: process.env.NODE_ENV || 'development',
      uptime: process.uptime(),
      memory_usage: process.memoryUsage(),
      database_stats: {
        countries: parseInt(stats.countries.count),
        breeds: parseInt(stats.breeds.count),
        colors: parseInt(stats.colors.count),
        breeders: parseInt(stats.breeders.count),
        horses: parseInt(stats.horses.count)
      },
      endpoints: {
        countries: '/api/countries',
        breeders: '/api/breeders', 
        horses: '/api/horses',
        colors: '/api/colors',
        breeds: '/api/breeds',
        breeding_check: '/api/horses/breeding/check'
      }
    });
  } catch (error) {
    console.error('Health check failed:', error);
    res.status(503).json({
      status: 'ERROR',
      timestamp: new Date().toISOString(),
      database: 'disconnected',
      error: 'Database connection failed'
    });
  }
});

// API Routes z prefiksem wersji
app.use('/api/v1/countries', countryRoutes);
app.use('/api/v1/breeders', breederRoutes);
app.use('/api/v1/horses', horseRoutes);
app.use('/api/v1/colors', colorRoutes);
app.use('/api/v1/breeds', breedRoutes);

// Zachowaj stare endpointy dla kompatybilności wstecznej
app.use('/api/countries', countryRoutes);
app.use('/api/breeders', breederRoutes);
app.use('/api/horses', horseRoutes);
app.use('/api/colors', colorRoutes);
app.use('/api/breeds', breedRoutes);

// Rate limiting dla API (podstawowa ochrona)
const requestCounts = new Map();
const RATE_LIMIT = 100; // requests per minute
const RATE_WINDOW = 60000; // 1 minute

app.use('/api/*', (req, res, next) => {
  const ip = req.ip || req.connection.remoteAddress;
  const now = Date.now();
  
  if (!requestCounts.has(ip)) {
    requestCounts.set(ip, { count: 1, resetTime: now + RATE_WINDOW });
  } else {
    const userRequests = requestCounts.get(ip);
    
    if (now > userRequests.resetTime) {
      userRequests.count = 1;
      userRequests.resetTime = now + RATE_WINDOW;
    } else {
      userRequests.count++;
      
      if (userRequests.count > RATE_LIMIT) {
        return res.status(429).json({
          error: 'Zbyt wiele zapytań. Spróbuj ponownie za minutę.',
          retry_after: Math.ceil((userRequests.resetTime - now) / 1000)
        });
      }
    }
  }
  
  next();
});

// 404 handler for API routes
app.use('/api/*', (req, res) => {
  res.status(404).json({ 
    error: 'Endpoint nie znaleziony',
    path: req.originalUrl,
    method: req.method,
    timestamp: new Date().toISOString(),
    availableEndpoints: [
      'GET /api/health',
      'GET /api/countries',
      'GET /api/breeders',
      'GET /api/horses',
      'GET /api/colors',
      'GET /api/breeds',
      'GET /api/horses/breeding/check',
      'GET /api/horses/:id/pedigree/:depth',
      'GET /api/horses/:id/pedigree/html/:depth',
      'GET /api/horses/:id/offspring'
    ]
  });
});

// Serve index.html for non-API routes (SPA support)
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../public/index.html'));
});

// Global error handling middleware
app.use((err, req, res, next) => {
  const timestamp = new Date().toISOString();
  const errorId = Math.random().toString(36).substr(2, 9);
  
  console.error(`[${timestamp}] Error ID: ${errorId}`, err);
  
  // Log full error stack in development
  if (process.env.NODE_ENV !== 'production') {
    console.error('Full error stack:', err.stack);
  }
  
  // Different error responses based on error type
  let statusCode = err.status || err.statusCode || 500;
  let message = 'Wystąpił błąd serwera';
  
  // Handle specific error types
  if (err.name === 'ValidationError') {
    statusCode = 400;
    message = 'Błąd walidacji danych';
  } else if (err.name === 'CastError') {
    statusCode = 400;
    message = 'Nieprawidłowy format danych';
  } else if (err.code === 'ECONNREFUSED') {
    statusCode = 503;
    message = 'Brak połączenia z bazą danych';
  } else if (err.code === '23505') {
    statusCode = 409;
    message = 'Konflikt - rekord już istnieje';
  } else if (err.code === '23503') {
    statusCode = 400;
    message = 'Naruszenie relacji w bazie danych';
  }
  
  // Don't leak error details in production
  if (process.env.NODE_ENV === 'production' && statusCode === 500) {
    message = 'Wystąpił błąd serwera';
  } else if (process.env.NODE_ENV !== 'production') {
    message = err.message || message;
  }
  
  res.status(statusCode).json({ 
    error: message,
    error_id: errorId,
    timestamp,
    path: req.path,
    method: req.method,
    ...(process.env.NODE_ENV !== 'production' && { 
      stack: err.stack,
      details: err.details 
    })
  });
});

// Handle uncaught exceptions
process.on('uncaughtException', (err) => {
  console.error('Uncaught Exception:', err);
  console.error('Stack:', err.stack);
  
  // Graceful shutdown
  process.exit(1);
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise);
  console.error('Reason:', reason);
  
  // Graceful shutdown
  process.exit(1);
});

// Graceful shutdown handling
process.on('SIGTERM', async () => {
  console.log('SIGTERM received, shutting down gracefully...');
  
  // Close database connections
  try {
    const knex = require('./config/db');
    await knex.destroy();
    console.log('Database connections closed.');
  } catch (error) {
    console.error('Error closing database connections:', error);
  }
  
  process.exit(0);
});

process.on('SIGINT', async () => {
  console.log('SIGINT received, shutting down gracefully...');
  
  // Close database connections
  try {
    const knex = require('./config/db');
    await knex.destroy();
    console.log('Database connections closed.');
  } catch (error) {
    console.error('Error closing database connections:', error);
  }
  
  process.exit(0);
});

const PORT = process.env.PORT || 3000;
const HOST = process.env.HOST || 'localhost';

const server = app.listen(PORT, HOST, () => {
  console.log(' === HORSE PEDIGREE API STARTED ===');
  console.log(` Server: http://${HOST}:${PORT}`);
  console.log(` Health check: http://${HOST}:${PORT}/api/health`);
  console.log(` API v1: http://${HOST}:${PORT}/api/v1/`);
  console.log(` Frontend: http://${HOST}:${PORT}`);
  console.log(` Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(` Started at: ${new Date().toISOString()}`);
  console.log('=====================================');
});

module.exports = server;