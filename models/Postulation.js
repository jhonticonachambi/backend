//models/postulation
const mongoose = require('mongoose');

const postulationSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',  // Asegúrate de que el modelo 'User' esté correctamente configurado
  },
  projectId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Project',  // Asegúrate de que el modelo 'Project' esté correctamente configurado
  },
  status: {
    type: String,
    enum: ['pending', 'accepted', 'rejected'],
    default: 'pending',
  },
  applicationDate: {
    type: Date,
    default: Date.now,
  },
});

// Especifica el nombre de la colección explícitamente
module.exports = mongoose.model('Postulation', postulationSchema, 'postulacions');
