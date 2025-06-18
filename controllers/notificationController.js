// controllers/notificationController.js
const Notification = require('../models/Notification');
const mongoose = require('mongoose');

exports.getNotifications = async (req, res) => {
  const { userId } = req.body;  // Recibimos el userId desde el cuerpo de la solicitud

  if (!userId) {
    return res.status(400).json({ message: 'User ID is required' });
  }

  try {
    // Validación de ObjectId para prevenir inyección
    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(400).json({ message: 'ID de usuario inválido' });
    }
    
    // Convertir a ObjectId para asegurar el tipo correcto
    const validUserId = new mongoose.Types.ObjectId(userId);
    
    // Buscar las notificaciones basadas en el userId proporcionado
    const notifications = await Notification.find({ userId: validUserId });

    if (notifications.length === 0) {
      return res.status(404).json({ message: 'No notifications found for this user' });
    }

    res.status(200).json({ notifications });
  } catch (error) {
    console.error('Error fetching notifications:', error);
    res.status(500).json({ message: 'Error fetching notifications' });
  }
};


// Controlador para marcar una notificación como leída
exports.markNotificationAsRead = async (req, res) => {
  const { notificationId, userId } = req.body;  // Obtener userId desde el cuerpo

  try {
    // Validar que la notificación existe
    const notification = await Notification.findById(notificationId);
    
    if (!notification) {
      return res.status(404).json({ message: 'Notification not found' });
    }

    // Verificar que la notificación pertenece al usuario indicado
    if (notification.userId.toString() !== userId) {
      return res.status(403).json({ message: 'You do not have permission to mark this notification' });
    }

    // Marcar la notificación como leída
    notification.read = true;
    await notification.save();

    res.status(200).json({ message: 'Notification marked as read', notification });
  } catch (error) {
    console.error('Error marking notification as read:', error);
    res.status(500).json({ message: 'Error marking notification as read' });
  }
};
