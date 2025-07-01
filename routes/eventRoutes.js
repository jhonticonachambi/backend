// routes/eventRoutes.js
const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const eventController = require('../controllers/eventController');
const authMiddleware = require('../middleware/authMiddleware');

// Validaciones para crear/actualizar eventos
const eventValidations = [
  body('title')
    .notEmpty()
    .withMessage('El título es requerido')
    .isLength({ min: 3, max: 100 })
    .withMessage('El título debe tener entre 3 y 100 caracteres'),
  
  body('description')
    .notEmpty()
    .withMessage('La descripción es requerida')
    .isLength({ min: 10, max: 1000 })
    .withMessage('La descripción debe tener entre 10 y 1000 caracteres'),
  
  body('eventDate')
    .notEmpty()
    .withMessage('La fecha del evento es requerida')
    .isISO8601()
    .withMessage('La fecha debe tener un formato válido'),
  
  body('location')
    .notEmpty()
    .withMessage('La ubicación es requerida')
    .isLength({ min: 5, max: 200 })
    .withMessage('La ubicación debe tener entre 5 y 200 caracteres'),
  
  body('capacity')
    .notEmpty()
    .withMessage('La capacidad es requerida')
    .isInt({ min: 1, max: 10000 })
    .withMessage('La capacidad debe ser un número entre 1 y 10000'),
  
  body('eventType')
    .notEmpty()
    .withMessage('El tipo de evento es requerido')
    .isIn(['workshop', 'conference', 'community', 'training', 'fundraising', 'volunteer'])
    .withMessage('Tipo de evento no válido'),
  
  body('organizer')
    .notEmpty()
    .withMessage('El organizador es requerido')
    .isMongoId()
    .withMessage('ID de organizador no válido')
];

// Rutas públicas (sin autenticación)
router.get('/active', eventController.getActiveEvents);
router.get('/all', eventController.getAllEvents);
router.get('/:id', eventController.getEventById);
router.get('/organizer/:organizerId', eventController.getEventsByOrganizer);

// Rutas protegidas (requieren autenticación)
router.use(authMiddleware); // Aplicar middleware de autenticación a todas las rutas siguientes

// CRUD de eventos (solo administradores)
router.post('/', eventValidations, eventController.createEvent);
router.put('/:id', eventValidations, eventController.updateEvent);
router.delete('/:id', eventController.deleteEvent);

// Registro y cancelación de registro a eventos (usuarios autenticados)
router.post('/:eventId/register', eventController.registerToEvent);
router.delete('/:eventId/unregister', eventController.unregisterFromEvent);

module.exports = router;
