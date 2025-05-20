// models/VolunteerProfile
const mongoose = require('mongoose');

const volunteerProfileSchema = new mongoose.Schema({
  // Relación con el usuario base
  user: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User', 
    required: true,
    unique: true
  },
  // Datos para el sistema de machine learning
  status: { 
    type: String, 
    enum: ['regular', 'premium'], 
    default: 'regular' 
  },
  totalProjects: { 
    type: Number, 
    default: 0 
  },
  completedProjects: { 
    type: Number, 
    default: 0 
  },
  totalHours: { 
    type: Number, 
    default: 0 
  },
  // Métricas de desempeño
  reliability: { 
    type: Number, 
    min: 0, 
    max: 10, 
    default: 5 
  },
  punctuality: { 
    type: Number, 
    min: 0, 
    max: 10, 
    default: 5 
  },
  taskQuality: { 
    type: Number, 
    min: 0, 
    max: 10, 
    default: 5 
  },
  successRate: { 
    type: Number, 
    default: 0 
  },
  // Habilidades y niveles (usando Map para almacenar habilidad:nivel)
  skillProficiency: { 
    type: Map, 
    of: Number, 
    default: {} 
  },
  // Preferencias
  preferredCauses: [String],
  locationPreferences: [String],
  availabilityHours: { 
    type: Number,
    default: 0
  },
  // Historial de proyectos
  projectHistory: [{
    project: { 
      type: mongoose.Schema.Types.ObjectId, 
      ref: 'Project' 
    },
    role: String,
    performance: { 
      type: Number, 
      min: 1, 
      max: 10 
    },
    feedback: String,
    completed: Boolean,
    startDate: Date,
    endDate: Date
  }],
  // Insignias y reconocimientos
  badges: [{ 
    name: { type: String },
    earnedAt: { type: Date, default: Date.now }
  }],  // Información adicional
  socialMedia: {
    twitter: { type: String },
    linkedin: { type: String },
    github: { type: String }
  },
  // Imagen de perfil (opcional)
  profileImage: {
    url: { type: String },
    altText: { type: String },
    uploadedAt: { type: Date }
  },
  // Control de fechas
  lastActive: { 
    type: Date, 
    default: Date.now 
  },
  createdAt: { 
    type: Date, 
    default: Date.now 
  },
  updatedAt: { 
    type: Date, 
    default: Date.now 
  }
});

// Middleware para actualizar fecha de modificación
volunteerProfileSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

module.exports = mongoose.model('VolunteerProfile', volunteerProfileSchema);
