// routes/reportRoutes.js
const express = require('express');
const router = express.Router();
// const reportController = require('../controllers/reportController');
const { getAllProjectsWithDetails,generateReport } = require('../controllers/reportController');

// Ruta para generar el reporte 
router. get('/generate-report/:id', generateReport);
// Ruta para mostrar el detalle de los proyectos
router.get('/projects-with-details', getAllProjectsWithDetails);

module.exports = router;
