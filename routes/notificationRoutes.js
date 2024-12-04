// routes/notificationRoutes.js
const express = require('express');
const router = express.Router();
const { getNotifications,markNotificationAsRead } = require('../controllers/notificationController');

// Ruta para obtener las notificaciones del usuario, pasando el userId
router.post('/notifications', getNotifications);  // Usamos POST ya que enviamos el ID en el cuerpo

// Ruta para marcar una notificación como leída
router.post('/notifications/mark-as-read', markNotificationAsRead);

module.exports = router;
