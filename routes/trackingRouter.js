// routes/trackingRouter.js
const express = require('express');
const router = express.Router();
const trackingController = require('../controllers/trackingController');

/**
 * REQUERIMIENTO FUNCIONAL: RF-08 - Seguimiento de Voluntarios Asignados
 * CASO DE USO PRINCIPAL: UC-8.1 - Realizar Seguimiento de Voluntarios
 */ 
router.get('/seguimiento/:volunteerId', trackingController.getVolunteerTracking);

module.exports = router;
