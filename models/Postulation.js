//models/postulation
const mongoose = require('mongoose');

const postulationSchema = new mongoose.Schema({  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  projectId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Project',
    required: true,
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

module.exports = mongoose.model('Postulation', postulationSchema, 'postulacions');
