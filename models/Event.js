// models/Event.js
const mongoose = require('mongoose');

const eventSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true,
  },
  description: {
    type: String,
    required: true,
  },
  eventDate: {
    type: Date,
    required: true,
  },
  location: {
    type: String,
    required: true,
  },
  capacity: {
    type: Number,
    required: true,
    min: 1,
  },
  eventType: {
    type: String,
    required: true,
    enum: ['workshop', 'conference', 'community', 'training', 'fundraising', 'volunteer'],
  },
  organizer: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  attendees: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  }],
  status: {
    type: String,
    enum: ['active', 'cancelled', 'completed'],
    default: 'active',
  },
  bannerImage: {
    type: String,
  },
  requirements: {
    type: String,
  },
  tags: [{
    type: String,
  }],
}, {
  timestamps: true,
});

// Índices para búsquedas eficientes
eventSchema.index({ eventDate: 1 });
eventSchema.index({ organizer: 1 });
eventSchema.index({ status: 1 });
eventSchema.index({ eventType: 1 });

// Método virtual para obtener el número de asistentes
eventSchema.virtual('attendeeCount').get(function() {
  return this.attendees.length;
});

// Método virtual para verificar si el evento está lleno
eventSchema.virtual('isFull').get(function() {
  return this.attendees.length >= this.capacity;
});

// Método virtual para verificar si el evento ya pasó
eventSchema.virtual('isPast').get(function() {
  return this.eventDate < new Date();
});

module.exports = mongoose.model('Event', eventSchema);
