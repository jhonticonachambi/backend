const mongoose = require('mongoose');

const postulacionSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true, // Asegúrate de que siempre haya un usuario asociado
  },
  projectId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Project',
    required: true, // Asegúrate de que siempre haya un proyecto asociado
  },
  applicationDate: {
    type: Date,
    default: Date.now, // Se guarda la fecha en que se realiza la postulación
  },
  status: {
    type: String,
    enum: ['pending', 'accepted', 'rejected'], // Define los estados posibles de la postulación
    default: 'pending', // Estado por defecto
  },
  comments: {
    type: String, // Puedes añadir un campo para comentarios adicionales
  },
});

// Exporta el modelo
module.exports = mongoose.model('Postulacion', postulacionSchema);
