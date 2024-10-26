// controllers/notificationController.js
const Notification = require('../models/Notification');

// Obtener todas las notificaciones de un usuario
exports.getNotifications = async (req, res) => {
  try {
    const notifications = await Notification.find({ user: req.user.id }).sort({ createdAt: -1 });
    res.status(200).json(notifications);
  } catch (err) {
    res.status(500).json({ message: 'Error al obtener las notificaciones', error: err });
  }
};

// Crear una nueva notificación
exports.createNotification = async (req, res) => {
  const { title, message, user } = req.body;

  try {
    const newNotification = new Notification({
      title,
      message,
      user,
    });

    await newNotification.save();
    res.status(201).json(newNotification);
  } catch (err) {
    res.status(400).json({ message: 'Error al crear la notificación', error: err });
  }
};

// Marcar una notificación como leída
exports.markAsRead = async (req, res) => {
  try {
    const updatedNotification = await Notification.findByIdAndUpdate(req.params.notificationId, { read: true }, { new: true });
    if (!updatedNotification) {
      return res.status(404).json({ message: 'Notificación no encontrada' });
    }
    res.status(200).json(updatedNotification);
  } catch (err) {
    res.status(400).json({ message: 'Error al marcar la notificación como leída', error: err });
  }
};

// Eliminar una notificación
exports.deleteNotification = async (req, res) => {
  try {
    const deletedNotification = await Notification.findByIdAndDelete(req.params.notificationId);
    if (!deletedNotification) {
      return res.status(404).json({ message: 'Notificación no encontrada' });
    }
    res.status(200).json({ message: 'Notificación eliminada con éxito' });
  } catch (err) {
    res.status(500).json({ message: 'Error al eliminar la notificación', error: err });
  }
};
