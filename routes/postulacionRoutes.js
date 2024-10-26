const express = require('express');
const router = express.Router();
const postulacionController = require('../controllers/PostulacionController');

// Ruta para crear una nueva postulación
router.post('/', postulacionController.crearPostulacion);

// Ruta para obtener postulaciones por usuario
router.get('/usuario/:userId', postulacionController.obtenerPostulacionesPorUsuario);

// Ruta para obtener postulaciones por proyecto
router.get('/proyecto/:projectId', postulacionController.obtenerPostulacionesPorProyecto);

// Ruta para actualizar el estado de múltiples postulaciones
router.put('/actualizar-estado', postulacionController.actualizarEstadoPostulaciones);


module.exports = router;
