//controllers/authcontroller
const User = require('../models/User');
const crypto = require('crypto');
const jwt = require('jsonwebtoken');
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
  return jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: '1h' });
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
    let user = await User.findOne({ email });
    if (user) return res.status(400).json({ message: 'El usuario ya existe' });

    const hashedPassword = generateHash(password);
    console.log('Contraseña cifrada durante el registro:', hashedPassword);

    user = new User({ 
      name, 
      dni, 
      email, 
      address, 
      password: hashedPassword, 
      skills, 
      phone,
      role: role || 'volunteer' // Usar el rol proporcionado o 'volunteer' por defecto
    });
    await user.save();    const token = generateToken(user);
    res.json({ 
      token,
      id: user._id,
      name: user.name,
      role: user.role
    });
  } catch (error) {
    console.error('Error en el registro:', error);
    res.status(500).json({ message: 'Error en el servidor' });
  }
};

// Requerimiento Funcional 02 - Login de Usuario
exports.login = async (req, res) => {
  const { email, password, token } = req.body;

  console.log('Intento de inicio de sesión con email:', email);

  try {
    const user = await User.findOne({ email });
    if (!user) {
      console.log('Usuario no encontrado');
      return res.status(400).json({ message: 'Usuario no encontrado' });
    }

    console.log('Contraseña almacenada (cifrada) en la base de datos:', user.password);
    console.log('Contraseña ingresada:', password);

    const hashedPassword = generateHash(password);
    console.log('Contraseña ingresada cifrada:', hashedPassword);

    if (hashedPassword !== user.password) {
      console.log('Contraseña incorrecta');
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
    console.log('Inicio de sesión exitoso, token generado:', token);

    res.json({
      token,
      name: user.name,
      role: user.role,
      id: user._id,
    });
  } catch (error) {
    console.log('Error en el servidor:', error);
    res.status(500).json({ message: 'Error en el servidor' });
  }
};

// Recuperación de contraseña
exports.forgotPassword = async (req, res) => {
  const { email } = req.body;

  console.log(`Solicitud de recuperación de contraseña recibida para: ${email}`);

  try {
    const user = await User.findOne({ email });
    if (!user) {
      console.log('Usuario no encontrado');
      return res.status(400).json({ message: 'Usuario no encontrado' });
    }

    const resetToken = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: '15m' });

    user.resetPasswordToken = resetToken;
    user.resetPasswordExpires = Date.now() + 15 * 60 * 1000;
    await user.save();

    console.log(`Token de reseteo generado: ${resetToken}`);

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
        console.log('Error al enviar el correo:', error);
        return res.status(500).json({ message: 'Error al enviar el correo' });
      }
      console.log('Correo de recuperación enviado');
      res.status(200).json({ message: 'Correo de recuperación enviado' });
    });
  } catch (error) {
    console.log('Error en el servidor:', error);
    res.status(500).json({ message: 'Error en el servidor' });
  }
};


// Reseteo de contraseña
exports.resetPassword = async (req, res) => {
  const { resetToken, newPassword } = req.body;

  console.log('Token recibido:', resetToken);
  console.log('Nueva contraseña recibida:', newPassword);

  try {
    const decoded = jwt.verify(resetToken, process.env.JWT_SECRET);
    console.log('Token decodificado:', decoded);

    const user = await User.findOne({
      _id: decoded.id,
      resetPasswordToken: resetToken,
      resetPasswordExpires: { $gt: Date.now() }
    });
    if (!user) {
      console.log('Token inválido o expirado');
      return res.status(400).json({ message: 'Token inválido o expirado' });
    }

    user.password = generateHash(newPassword);
    console.log('Contraseña cifrada:', user.password);

    user.resetPasswordToken = undefined;
    user.resetPasswordExpires = undefined;
    await user.save();

    console.log('Contraseña actualizada correctamente');
    res.status(200).json({ message: 'Contraseña actualizada correctamente' });
  } catch (error) {
    console.log('Error en el servidor:', error);
    res.status(500).json({ message: 'Error en el servidor' });
  }
};

// Habilitar 2FA y generar un secreto
exports.enableTwoFactorAuth = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ message: 'Usuario no encontrado' });
    }

    const secret = speakeasy.generateSecret({ name: 'SWII-Backend' });
    user.twoFactorSecret = secret.base32;
    await user.save();

    const qrCodeUrl = await qrcode.toDataURL(secret.otpauth_url);
    res.status(200).json({ qrCodeUrl, secret: secret.base32 });
  } catch (error) {
    console.error('Error al habilitar 2FA:', error);
    res.status(500).json({ message: 'Error en el servidor' });
  }
};

// Verificar el código de 2FA
exports.verifyTwoFactorAuth = async (req, res) => {
  const { token } = req.body;

  try {
    const user = await User.findById(req.user.id);
    if (!user || !user.twoFactorSecret) {
      return res.status(400).json({ message: '2FA no está configurado para este usuario' });
    }

    const verified = speakeasy.totp.verify({
      secret: user.twoFactorSecret,
      encoding: 'base32',
      token,
    });

    if (verified) {
      user.twoFactorEnabled = true;
      await user.save();
      res.status(200).json({ message: '2FA habilitado correctamente' });
    } else {
      res.status(400).json({ message: 'Código de 2FA inválido' });
    }
  } catch (error) {
    console.error('Error al verificar 2FA:', error);
    res.status(500).json({ message: 'Error en el servidor' });
  }
};
