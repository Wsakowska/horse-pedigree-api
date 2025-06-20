const express = require('express');
const path = require('path');
const countryRoutes = require('./routes/countryRoutes');
const breederRoutes = require('./routes/breederRoutes');
const horseRoutes = require('./routes/horseRoutes');
const colorRoutes = require('./routes/colorRoutes');
const breedRoutes = require('./routes/breedRoutes');

const app = express();

// Middleware do parsowania JSON
app.use(express.json());

// Middleware do logowania requestów
app.use((req, res, next) => {
  const timestamp = new Date().toISOString();
  console.log(`${timestamp} - ${req.method} ${req.path}`);
  
  if (req.body && Object.keys(req.body).length > 0) {
    console.log('Request Body:', JSON.stringify(req.body, null, 2));
  }
  
  if (req.query && Object.keys(req.query).length > 0) {
    console.log('Query Params:', JSON.stringify(req.query, null, 2));
  }
  
  next();
});

// Serve static files from public folder
app.use(express.static(path.join(__dirname, '../public')));

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    timestamp: new Date().toISOString(),
    database: 'connected',
    version: '1.0.0',
    endpoints: {
      countries: '/api/countries',
      breeders: '/api/breeders', 
      horses: '/api/horses',
      colors: '/api/colors',
      breeds: '/api/breeds'
    }
  });
});

// API Routes
app.use('/api/countries', countryRoutes);
app.use('/api/breeders', breederRoutes);
app.use('/api/horses', horseRoutes);
app.use('/api/colors', colorRoutes);
app.use('/api/breeds', breedRoutes);

// 404 handler for API routes
app.use('/api/*', (req, res) => {
  res.status(404).json({ 
    error: 'Endpoint nie znaleziony',
    path: req.originalUrl,
    availableEndpoints: [
      'GET /api/health',
      'GET /api/countries',
      'GET /api/breeders',
      'GET /api/horses',
      'GET /api/colors',
      'GET /api/breeds'
    ]
  });
});

// Serve index.html for non-API routes
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../public/index.html'));
});

// Global error handling middleware
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err);
  
  // Log full error stack in development
  if (process.env.NODE_ENV !== 'production') {
    console.error(err.stack);
  }
  
  // Don't leak error details in production
  const message = process.env.NODE_ENV === 'production' 
    ? 'Wystąpił błąd serwera' 
    : err.message;
  
  res.status(err.status || 500).json({ 
    error: message,
    timestamp: new Date().toISOString(),
    path: req.path
  });
});

// Handle uncaught exceptions
process.on('uncaughtException', (err) => {
  console.error('Uncaught Exception:', err);
  process.exit(1);
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
  process.exit(1);
});

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`Serwer uruchomiony na porcie ${PORT}`);
  console.log(`URL: http://localhost:${PORT}`);
  console.log(`Health check: http://localhost:${PORT}/api/health`);
  console.log(`API dokumentacja dostępna w plikach CURL examples`);
  console.log(`Frontend dostępny pod: http://localhost:${PORT}`);
});