// models/User
const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  name: { type: String, required: true },
  dni: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  address: { type: String, required: true },
  // password: { type: String, required: true },
  
  password: { 
    type: String, 
    required: function() {
      // Password solo es requerido si no es un usuario de Google
      return !this.isGoogleUser;
    }
  },
  isGoogleUser: { type: Boolean, default: false },
  skills: { 
    type: [String], 
    required: [true, 'Skills are required'], 
    validate: {
      validator: function (value) {
        return value && value.length > 0;
      },
      message: 'Skills cannot be an empty array'
    }
  },
  phone: { type: String, required: true },
  role: { type: String, enum: ['volunteer', 'admin'], default: 'volunteer' },
  resetPasswordToken: String,
  resetPasswordExpires: Date,
  twoFactorEnabled: { type: Boolean, default: false }, // Indica si 2FA está habilitado
  twoFactorSecret: { type: String }, // Almacena el secreto de 2FA
  createdAt: { type: Date, default: Date.now }, // Fecha de creación
  updatedAt: { type: Date, default: Date.now } // Fecha de última actualización
});

// Middleware para actualizar la fecha de modificación
userSchema.pre('save', function (next) {
  this.updatedAt = Date.now();
  next();
});

module.exports = mongoose.model('User', userSchema);
