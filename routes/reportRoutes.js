// // routes/reportRoutes.js
// const express = require('express');
// const router = express.Router();
// const { getReports, getProjectDetails } = require('../controllers/reportController');

// router.get('/', getReports); // Para obtener todos los proyectos
// router.get('/projects/:id', getProjectDetails); // Para obtener detalles de un proyecto específico

// module.exports = router;

//reportRoutes.js
// const express = require('express');
// const router = express.Router();
// const reportController = require('../controllers/reportController');

// // Ruta para generar el reporte general
// router.get('/reporte-general/:projectId', reportController.generateGeneralReport);

// module.exports = router;

// const express = require('express');
// const router = express.Router();
// const reportController = require('../controllers/reportController');

// // Ruta para generar el reporte general
// router.get('/reporte-general/:projectId', reportController.generateGeneralReport);

// module.exports = router;

// routes/reportRoutes.js
// const express = require('express');
// const router = express.Router();
// const reportController = require('../controllers/reportController');

// // Ruta para generar el reporte general
// router.get('/reporte-general/:projectId', reportController.generateGeneralReport);

// module.exports = router;
// routes/reportRoutes.js
const express = require('express');
const router = express.Router();
const reportController = require('../controllers/reportController');

// Ruta para generar el reporte general
router.get('/reporte-general/:projectId', reportController.generateGeneralReport);

module.exports = router;
