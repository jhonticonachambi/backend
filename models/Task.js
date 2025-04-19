// models/Task
const mongoose = require('mongoose');

const taskSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
    },
    description: {
      type: String,
      required: true,
    },
    assignedTo: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
      },
    ],
    project: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Project',
      required: true,
    },
    status: {
      type: String,
      enum: ['pending', 'in progress', 'completed', 'archived'],
      default: 'pending',
    },
    priority: {
      type: String,
      enum: ['low', 'medium', 'high'],
      default: 'medium',
    },
    dueDate: {
      type: Date,
      validate: {
        validator: function (value) {
          return value >= new Date(); // La fecha debe ser futura
        },
        message: 'La fecha límite no puede estar en el pasado.',
      },
    },
    comments: [
      {
        user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
        comment: String,
        date: { type: Date, default: Date.now },
      },
    ],
    history: [
      {
        status: String,
        changedAt: { type: Date, default: Date.now },
      },
    ],
  },
  { timestamps: true }
);

// Middleware para registrar el historial al cambiar el estado
taskSchema.pre('findOneAndUpdate', async function (next) {
  const update = this.getUpdate();
  if (update.status) {
    this.updateOne({
      $push: {
        history: { status: update.status },
      },
    });
  }
  next();
});

module.exports = mongoose.model('Task', taskSchema);
