// const mongoose = require('mongoose');

// const projectSchema = new mongoose.Schema({
//   name: {
//     type: String,
//     required: true,
//   },
//   description: {
//     type: String,
//     required: true,
//   },
//   requirements: {
//     type: String,
//     required: true,
//   },
//   type: {
//     type: String,
//     required: true,
//   },
//   startDate: {
//     type: Date,
//     required: true,
//   },
//   endDate: {
//     type: Date,
//     required: true,
//   },
//   volunteersRequired: {
//     type: Number,
//     required: true,
//   },
//   projectType: {
//     type: String,
//     required: true,
//   },
//   bannerImage: {
//     type: String, // Este campo guardará la URL de la imagen
//   },
//   applicants: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
//   feedback: [
//     {
//       userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
//       comment: String,
//     },
//   ],
// });

// module.exports = mongoose.model('Project', projectSchema);
const mongoose = require('mongoose');

const projectSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
  },
  description: {
    type: String,
    required: true,
  },
  requirements: {
    type: String,
    required: true,
  },
  type: {
    type: String,
    required: true,
  },
  startDate: {
    type: Date,
    required: true,
  },
  endDate: {
    type: Date,
    required: true,
  },
  volunteersRequired: {
    type: Number,
    required: true,
  },
  projectType: {
    type: String,
    required: true,
  },
  bannerImage: {
    type: String, // URL de la imagen del proyecto
  },
  status: {
    type: String,
    enum: ['activo', 'en progreso', 'finalizado', 'cancelado'],
    default: 'activo', // Estado predeterminado del proyecto
  },
  organizer: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User', // Relación con el usuario organizador del proyecto
    required: true,
  },
  applicants: [
    {
      userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }, // Usuario que postula
      status: { type: String, default: 'pending' }, // Estado de la postulación
    },
  ],
  feedback: [
    {
      userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
      comment: String,
    },
  ],
});

module.exports = mongoose.model('Project', projectSchema);
