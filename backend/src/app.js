// Módulo principal de la API REST - WMS Bodega
// Configura Express y los middlewares globales

const express = require('express');
const app = express();

// Middleware para parsear JSON en las peticiones
app.use(express.json());

// Endpoint de verificación de estado del servidor
app.get('/api/health', (req, res) => {
  res.json({ estado: 'activo', timestamp: new Date().toISOString() });
});

module.exports = app;
