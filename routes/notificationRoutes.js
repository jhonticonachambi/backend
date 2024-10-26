// routes/notificationRoutes.js
const express = require('express');
const router = express.Router();
const notificationController = require('../controllers/notificationController');
const { authMiddleware } = require('../middlewares/authMiddleware'); // Asegúrate de tener un middleware de autenticación

// Rutas de notificaciones
router.get('/', authMiddleware, notificationController.getNotifications); // Obtener notificaciones
router.post('/', authMiddleware, notificationController.createNotification); // Crear notificación
router.put('/:notificationId/read', authMiddleware, notificationController.markAsRead); // Marcar como leída
router.delete('/:notificationId', authMiddleware, notificationController.deleteNotification); // Eliminar notificación

module.exports = router;
