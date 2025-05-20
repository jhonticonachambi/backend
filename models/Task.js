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
    // Añadimos estimación de horas para la tarea
    estimatedHours: {
      type: Number,
      required: true,
      min: 0.5,
      default: 1,
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
    // Añadimos registro de tiempo
    timeEntries: [
      {
        user: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'User',
          required: true,
        },
        hours: {
          type: Number,
          required: true,
          min: 0.25, // mínimo 15 minutos
          max: 24, // máximo un día
        },
        description: { type: String, required: true },
        date: { type: Date, default: Date.now },
        approved: { type: Boolean, default: false },
        approvedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
        approvalDate: Date,
      },
    ],
    totalHoursLogged: {
      type: Number,
      default: 0,
    },
    // Añadimos evaluación de calidad para ajustar horas
    completionQuality: {
      type: String,
      enum: [
        'pending',
        'below_expectations',
        'meets_expectations',
        'exceeds_expectations',
      ],
      default: 'pending',
    },
    hourAdjustment: {
      type: Number,
      default: 0, // Puede ser positivo o negativo
    },
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
