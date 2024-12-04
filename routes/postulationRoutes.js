//routes/postulationRoutes

const express = require('express');
const router = express.Router();
const postulationController = require('../controllers/postulationController');

// Ruta para crear una nueva postulación
router.post('/', postulationController.createPostulation);

// Ruta para obtener todas las postulaciones
router.get('/', postulationController.getAllPostulations);

// Ruta para obtener postulaciones por proyecto
router.get('/project/:projectId', postulationController.getPostulationsByProject);

// Ruta para obtener postulaciones por usuario
router.get('/user/:userId', postulationController.getPostulationsByUser);

// Ruta para actualizar el estado de una postulación
router.put('/status', postulationController.updatePostulationStatus);

module.exports = router;
