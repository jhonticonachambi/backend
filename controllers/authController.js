//controllers/authcontroller
const User = require('../models/User');
const crypto = require('crypto');
const jwt = require('jsonwebtoken');
const mongoose = require('mongoose');
const { validationResult } = require('express-validator');
const nodemailer = require('nodemailer');
const speakeasy = require('speakeasy');
const qrcode = require('qrcode');

// Función para generar un hash usando SHA-256
const generateHash = (input) => {
  return crypto.createHash('sha256').update(input).digest('hex');
};

// Función para generar un JWT
const generateToken = (user) => {
  if (!process.env.JWT_SECRET) {
    throw new Error('JWT_SECRET no está definida en las variables de entorno');
  }
  return jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: '1h' });
};

// Función helper para validar y sanitizar email
const validateAndSanitizeEmail = (email) => {
  if (!email || typeof email !== 'string') {
    return { isValid: false, error: 'Email inválido' };
  }
  
  // Regex más segura con cuantificadores limitados para prevenir ReDoS
  const emailRegex = /^[a-zA-Z0-9._-]{1,64}@[a-zA-Z0-9.-]{1,255}\.[a-zA-Z]{2,6}$/;
  if (!emailRegex.test(email)) {
    return { isValid: false, error: 'Formato de email inválido' };
  }
  
  return { isValid: true, sanitizedEmail: email.toLowerCase().trim() };
};

// Función helper para manejo centralizado de errores
const handleError = (error, res, message = 'Error en el servidor') => {
  console.error(message, error);
  res.status(500).json({ message, error: error.message });
};

/**
 * REQUERIMIENTO FUNCIONAL: RF-02 - Registro de Voluntario
 * CASO DE USO PRINCIPAL: UC-2.1 - Registrar Voluntario
 * 
 * CASOS DE USO ANTECEDENTES: 
 * - Ninguno (punto inicial del flujo)
 * 
 * CASOS DE USO POSTERIORES:
 * - UC-2.2: Ver perfil (requiere registro previo)
 * - UC-2.3: Actualizar perfil (usa datos del registro)
 * - UC-4.2: Ver lista de proyectos (requiere autenticación)
 * - UC-5.1: Postular a proyectos (requiere rol 'volunteer')
 */
exports.register = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });
  const { name, dni, email, address, password, skills, phone, role } = req.body;

  try {
    // Validar y sanitizar email usando función helper
    const emailValidation = validateAndSanitizeEmail(email);
    if (!emailValidation.isValid) {
      return res.status(400).json({ message: emailValidation.error });
    }

    // Usar el email sanitizado
    let user = await User.findOne({ email: emailValidation.sanitizedEmail });
    if (user) return res.status(400).json({ message: 'El usuario ya existe' });

    const hashedPassword = generateHash(password);
    user = new User({ 
      name, 
      dni, 
      email: emailValidation.sanitizedEmail, 
      address, 
      password: hashedPassword, 
      skills, 
      phone,
      role: role || 'volunteer' // Usar el rol proporcionado o 'volunteer' por defecto
    });
    await user.save();

    res.json({ 
      token: generateToken(user),      id: user._id,
      name: user.name,
      role: user.role
    });  } catch (error) {
    handleError(error, res, 'Error en el registro:');
  }
};

// Requerimiento Funcional 02 - Login de Usuario
exports.login = async (req, res) => {  const { email, password, token } = req.body;

  try {
    // Validar y sanitizar email usando función helper
    const emailValidation = validateAndSanitizeEmail(email);
    if (!emailValidation.isValid) {
      return res.status(400).json({ message: emailValidation.error });
    }

    const user = await User.findOne({ email: emailValidation.sanitizedEmail });
    if (!user) {
      return res.status(400).json({ message: 'Usuario no encontrado' });
    }

    const hashedPassword = generateHash(password);

    if (hashedPassword !== user.password) {
      return res.status(400).json({ message: 'Contraseña incorrecta' });
    }    if (user.twoFactorEnabled) {
      const verified = speakeasy.totp.verify({
        secret: user.twoFactorSecret,
        encoding: 'base32',
        token: req.body.token,
      });

      if (!verified) {
        return res.status(400).json({ message: 'Código de 2FA inválido' });
      }
    }

    const token = generateToken(user);

    res.json({
      token,
      name: user.name,
      role: user.role,      id: user._id,
    });  } catch (error) {
    handleError(error, res, 'Error en el login:');
  }
};

// Recuperación de contraseña
exports.forgotPassword = async (req, res) => {  const { email } = req.body;

  try {
    // Validar y sanitizar email usando función helper
    const emailValidation = validateAndSanitizeEmail(email);
    if (!emailValidation.isValid) {
      return res.status(400).json({ message: emailValidation.error });
    }

    const user = await User.findOne({ email: emailValidation.sanitizedEmail });
    if (!user) {
      return res.status(400).json({ message: 'Usuario no encontrado' });
    }

    const resetToken = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: '15m' });

    user.resetPasswordToken = resetToken;
    user.resetPasswordExpires = Date.now() + 15 * 60 * 1000;
    await user.save();

    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.EMAIL,
        pass: process.env.EMAIL_PASSWORD,
      },
    });

    const mailOptions = {
      to: user.email,
      from: process.env.EMAIL,
      subject: 'Recuperación de contraseña',
      text: `Para restablecer tu contraseña, haz clic en el siguiente enlace: \n\n 
      https://fronted-five.vercel.app/reset-password/${resetToken}`,
    };

    transporter.sendMail(mailOptions, (error) => {
      if (error) {
        return res.status(500).json({ message: 'Error al enviar el correo' });
      }      res.status(200).json({ message: 'Correo de recuperación enviado' });
    });  } catch (error) {
    handleError(error, res, 'Error en forgotPassword:');
  }
};

// Reseteo de contraseña
exports.resetPassword = async (req, res) => {
  const { resetToken, newPassword } = req.body;

  try {
    // Validación de tipos para prevenir inyección NoSQL
    if (!resetToken || !newPassword) {
      return res.status(400).json({ message: 'Token y nueva contraseña son requeridos' });
    }
    const decoded = jwt.verify(resetToken.toString(), process.env.JWT_SECRET);
    const user = await User.findOne({
      _id: decoded.id.toString(),
      resetPasswordToken: resetToken.toString(),
      resetPasswordExpires: { $gt: Date.now() }
    });
    if (!user) {
      return res.status(400).json({ message: 'Token inválido o expirado' });
    }

    user.password = generateHash(newPassword);
    user.resetPasswordToken = undefined;
    user.resetPasswordExpires = undefined;
    await user.save();
    res.status(200).json({ message: 'Contraseña actualizada correctamente' });  } catch (error) {
    handleError(error, res, 'Error en resetPassword:');
  }
};
