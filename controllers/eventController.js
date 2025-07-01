// controllers/eventController.js
const mongoose = require('mongoose');
const { validationResult } = require('express-validator');
const Event = require('../models/Event');
const User = require('../models/User');
const Notification = require('../models/Notification');

// Crear un nuevo evento
exports.createEvent = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  try {
    const {
      title,
      description,
      eventDate,
      location,
      capacity,
      eventType,
      organizer,
      bannerImage,
      requirements,
      tags
    } = req.body;

    // Validar que el organizador existe
    if (!organizer) {
      return res.status(400).json({ message: 'El ID del organizador es requerido' });
    }

    // Validar que la fecha del evento sea futura
    if (new Date(eventDate) <= new Date()) {
      return res.status(400).json({ message: 'La fecha del evento debe ser futura' });
    }

    const event = new Event({
      title,
      description,
      eventDate,
      location,
      capacity,
      eventType,
      organizer,
      bannerImage,
      requirements,
      tags
    });

    const savedEvent = await event.save();

    // Enviar notificaciones a voluntarios interesados (opcional)
    // Aquí puedes implementar lógica para notificar según preferencias de usuarios

    res.status(201).json({
      message: 'Evento creado exitosamente',
      event: savedEvent
    });
  } catch (error) {
    console.error('Error al crear el evento:', error);
    res.status(500).json({ message: 'Error en el servidor' });
  }
};

// Obtener todos los eventos
exports.getAllEvents = async (req, res) => {
  try {
    const events = await Event.find()
      .populate('organizer', 'name email')
      .populate('attendees', 'name email')
      .sort({ eventDate: 1 });

    res.status(200).json(events);
  } catch (error) {
    console.error('Error al obtener los eventos:', error);
    res.status(500).json({ message: 'Error en el servidor' });
  }
};

// Obtener eventos activos (no cancelados y futuros)
exports.getActiveEvents = async (req, res) => {
  try {
    const currentDate = new Date();
    const events = await Event.find({
      status: 'active',
      eventDate: { $gte: currentDate }
    })
      .populate('organizer', 'name email')
      .populate('attendees', 'name email')
      .sort({ eventDate: 1 });

    res.status(200).json(events);
  } catch (error) {
    console.error('Error al obtener eventos activos:', error);
    res.status(500).json({ message: 'Error en el servidor' });
  }
};

// Obtener un evento por ID
exports.getEventById = async (req, res) => {
  const { id } = req.params;

  if (!mongoose.Types.ObjectId.isValid(id)) {
    return res.status(400).json({ message: 'ID de evento inválido' });
  }

  try {
    const event = await Event.findById(id)
      .populate('organizer', 'name email')
      .populate('attendees', 'name email');

    if (!event) {
      return res.status(404).json({ message: 'Evento no encontrado' });
    }

    res.status(200).json(event);
  } catch (error) {
    console.error('Error al obtener el evento:', error);
    res.status(500).json({ message: 'Error en el servidor' });
  }
};

// Actualizar un evento
exports.updateEvent = async (req, res) => {
  const { id } = req.params;
  const updates = req.body;

  if (!mongoose.Types.ObjectId.isValid(id)) {
    return res.status(400).json({ message: 'ID de evento inválido' });
  }

  try {
    // Validar fecha futura si se está actualizando
    if (updates.eventDate && new Date(updates.eventDate) <= new Date()) {
      return res.status(400).json({ message: 'La fecha del evento debe ser futura' });
    }

    const event = await Event.findByIdAndUpdate(
      id,
      updates,
      { new: true, runValidators: true }
    ).populate('organizer', 'name email')
     .populate('attendees', 'name email');

    if (!event) {
      return res.status(404).json({ message: 'Evento no encontrado' });
    }

    // Notificar cambios importantes a asistentes
    if (updates.eventDate || updates.location || updates.status) {
      const attendees = event.attendees;
      
      for (const attendee of attendees) {
        await Notification.create({
          userId: attendee._id,
          message: `El evento "${event.title}" ha sido actualizado. Revisa los nuevos detalles.`,
          type: 'event_update'
        });
      }
    }

    res.status(200).json({
      message: 'Evento actualizado exitosamente',
      event
    });
  } catch (error) {
    console.error('Error al actualizar el evento:', error);
    res.status(500).json({ message: 'Error en el servidor' });
  }
};

// Eliminar un evento
exports.deleteEvent = async (req, res) => {
  const { id } = req.params;

  if (!mongoose.Types.ObjectId.isValid(id)) {
    return res.status(400).json({ message: 'ID de evento inválido' });
  }

  try {
    const event = await Event.findById(id).populate('attendees', 'name email');

    if (!event) {
      return res.status(404).json({ message: 'Evento no encontrado' });
    }

    // Notificar cancelación a asistentes
    const attendees = event.attendees;
    
    for (const attendee of attendees) {
      await Notification.create({
        userId: attendee._id,
        message: `El evento "${event.title}" ha sido cancelado. Lamentamos los inconvenientes.`,
        type: 'event_cancelled'
      });
    }

    await Event.findByIdAndDelete(id);

    res.status(200).json({ message: 'Evento eliminado exitosamente' });
  } catch (error) {
    console.error('Error al eliminar el evento:', error);
    res.status(500).json({ message: 'Error en el servidor' });
  }
};

// Registrarse a un evento
exports.registerToEvent = async (req, res) => {
  const { eventId } = req.params;
  const userId = req.user.id; // Asumiendo middleware de autenticación

  if (!mongoose.Types.ObjectId.isValid(eventId)) {
    return res.status(400).json({ message: 'ID de evento inválido' });
  }

  try {
    const event = await Event.findById(eventId);

    if (!event) {
      return res.status(404).json({ message: 'Evento no encontrado' });
    }

    // Verificar si el evento está activo
    if (event.status !== 'active') {
      return res.status(400).json({ message: 'No es posible registrarse a este evento' });
    }

    // Verificar si el evento ya pasó
    if (event.eventDate <= new Date()) {
      return res.status(400).json({ message: 'No es posible registrarse a un evento pasado' });
    }

    // Verificar si ya está registrado
    if (event.attendees.includes(userId)) {
      return res.status(400).json({ message: 'Ya estás registrado en este evento' });
    }

    // Verificar capacidad
    if (event.attendees.length >= event.capacity) {
      return res.status(400).json({ message: 'El evento ha alcanzado su capacidad máxima' });
    }

    event.attendees.push(userId);
    await event.save();

    // Notificar al organizador
    await Notification.create({
      userId: event.organizer,
      message: `Un nuevo participante se ha registrado al evento "${event.title}".`,
      type: 'event_registration'
    });

    res.status(200).json({ message: 'Registro exitoso al evento' });
  } catch (error) {
    console.error('Error al registrarse al evento:', error);
    res.status(500).json({ message: 'Error en el servidor' });
  }
};

// Cancelar registro a un evento
exports.unregisterFromEvent = async (req, res) => {
  const { eventId } = req.params;
  const userId = req.user.id;

  if (!mongoose.Types.ObjectId.isValid(eventId)) {
    return res.status(400).json({ message: 'ID de evento inválido' });
  }

  try {
    const event = await Event.findById(eventId);

    if (!event) {
      return res.status(404).json({ message: 'Evento no encontrado' });
    }

    // Verificar si está registrado
    if (!event.attendees.includes(userId)) {
      return res.status(400).json({ message: 'No estás registrado en este evento' });
    }

    event.attendees = event.attendees.filter(
      attendee => attendee.toString() !== userId
    );
    await event.save();

    res.status(200).json({ message: 'Registro cancelado exitosamente' });
  } catch (error) {
    console.error('Error al cancelar registro:', error);
    res.status(500).json({ message: 'Error en el servidor' });
  }
};

// Obtener eventos por organizador
exports.getEventsByOrganizer = async (req, res) => {
  const { organizerId } = req.params;

  if (!mongoose.Types.ObjectId.isValid(organizerId)) {
    return res.status(400).json({ message: 'ID de organizador inválido' });
  }

  try {
    const events = await Event.find({ organizer: organizerId })
      .populate('organizer', 'name email')
      .populate('attendees', 'name email')
      .sort({ eventDate: 1 });

    res.status(200).json(events);
  } catch (error) {
    console.error('Error al obtener eventos del organizador:', error);
    res.status(500).json({ message: 'Error en el servidor' });
  }
};
