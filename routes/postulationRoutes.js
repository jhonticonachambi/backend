// const express = require('express');
// const router = express.Router();
// const postulationController = require('../controllers/PostulationController');

// // Ruta para crear una nueva postulación
// router.post('/', postulacionController.crearPostulacion);

// // Ruta para obtener postulaciones por usuario
// router.get('/usuario/:userId', postulacionController.obtenerPostulacionesPorUsuario);

// // Ruta para obtener postulaciones por proyecto
// router.get('/proyecto/:projectId', postulacionController.obtenerPostulacionesPorProyecto);

// // Ruta para actualizar el estado de múltiples postulaciones
// router.put('/actualizar-estado', postulacionController.actualizarEstadoPostulaciones);


// module.exports = router;
const express = require('express');
const router = express.Router();
const postulationController = require('../controllers/postulationController'); // Asegúrate de que el nombre del archivo esté en minúsculas

// Ruta para crear una nueva postulación
router.post('/', postulationController.createPostulation);

// Ruta para obtener postulaciones por usuario
router.get('/user/:userId', postulationController.getPostulationsByUser);

// Ruta para obtener postulaciones por proyecto
router.get('/project/:projectId', postulationController.getPostulationsByProject);

// Ruta para actualizar el estado de múltiples postulaciones
router.put('/update-status', postulationController.updatePostulationStatus);

module.exports = router;
