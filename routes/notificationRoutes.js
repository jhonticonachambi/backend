// // routes/notificationRoutes.js
// const express = require('express');
// const router = express.Router();
// const notificationController = require('../controllers/notificationController');
// const { authMiddleware } = require('../middlewares/authMiddleware'); // Asegúrate de tener un middleware de autenticación

// // Rutas de notificaciones
// router.get('/', authMiddleware, notificationController.getNotifications); // Obtener notificaciones
// router.post('/', authMiddleware, notificationController.createNotification); // Crear notificación
// router.put('/:notificationId/read', authMiddleware, notificationController.markAsRead); // Marcar como leída
// router.delete('/:notificationId', authMiddleware, notificationController.deleteNotification); // Eliminar notificación

// module.exports = router;


// routes/notificationRoutes.js
// routes/notificationRoutes.js
const express = require('express');
const router = express.Router();
const { getNotifications,markNotificationAsRead } = require('../controllers/notificationController');

// Ruta para obtener las notificaciones del usuario, pasando el userId
router.post('/notifications', getNotifications);  // Usamos POST ya que enviamos el ID en el cuerpo

// Ruta para marcar una notificación como leída
router.post('/notifications/mark-as-read', markNotificationAsRead);

module.exports = router;
