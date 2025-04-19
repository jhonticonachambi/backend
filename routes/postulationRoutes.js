//routes/postulationRoutes

const express = require('express');
const router = express.Router();
const postulationController = require('../controllers/postulationController');

/**
 * REQUERIMIENTO FUNCIONAL: RF-05 - Postulación de Voluntario a Proyecto
 * CASO DE USO PRINCIPAL: UC-5.1 - Postularse a proyecto
 */
router.post('/', postulationController.createPostulation);

// Ruta para obtener todas las postulaciones
router.get('/', postulationController.getAllPostulations);

// Ruta para obtener postulaciones por proyecto
router.get('/project/:projectId', postulationController.getPostulationsByProject);

// Ruta para obtener postulaciones por usuario
router.get('/user/:userId', postulationController.getPostulationsByUser);

/**
 * REQUERIMIENTO FUNCIONAL: RF-06 - Asignar voluntario a proyecto
 * CASO DE USO PRINCIPAL: UC-6.1 - Asignación de voluntario a proyecto
 */ 
router.put('/status', postulationController.updatePostulationStatus);

module.exports = router;
