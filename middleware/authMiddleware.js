//middleware/authMiddleware.js
const jwt = require('jsonwebtoken');
const User = require('../models/User');

module.exports = async (req, res, next) => {
  // Obtener el token del header Authorization
  const token = req.header('Authorization');

  // Si no hay token, devolver error de no autorizado
  if (!token) return res.status(401).json({ message: 'No autorizado' });

  try {
    // Verificar el token quitando el prefijo "Bearer " si es que lo tiene
    const decoded = jwt.verify(token.replace('Bearer ', ''), process.env.JWT_SECRET);
    
    // Obtener el usuario completo de la base de datos
    const user = await User.findById(decoded.id);
    if (!user) {
      return res.status(401).json({ message: 'Usuario no encontrado' });
    }
    
    // Agregar el usuario completo a la solicitud
    req.user = user;

    console.log('Usuario autenticado:', user.email, 'Rol:', user.role);

    // Continuar con la siguiente función
    next();
  } catch (error) {
    // Si el token no es válido, devolver error
    console.error('Error en autenticación:', error);
    res.status(401).json({ message: 'Token inválido' });
  }
};

