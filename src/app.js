const express = require('express');
const path = require('path');
const countryRoutes = require('./routes/countryRoutes');
const breederRoutes = require('./routes/breederRoutes');
const horseRoutes = require('./routes/horseRoutes');
const colorRoutes = require('./routes/colorRoutes');
const breedRoutes = require('./routes/breedRoutes');

const app = express();
app.use(express.json());

// Serve static files from public folder
app.use(express.static(path.join(__dirname, '../public')));

// Routes
app.use('/api/countries', countryRoutes);
app.use('/api/breeders', breederRoutes);
app.use('/api/horses', horseRoutes);
app.use('/api/colors', colorRoutes);
app.use('/api/breeds', breedRoutes);

// Error handling
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Something went wrong!' });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
