//middleware/authMiddleware.js
const jwt = require('jsonwebtoken');

module.exports = (req, res, next) => {
  // Obtener el token del header Authorization
  const token = req.header('Authorization');

  // Si no hay token, devolver error de no autorizado
  if (!token) return res.status(401).json({ message: 'No autorizado' });

  try {
    // Verificar el token quitando el prefijo "Bearer " si es que lo tiene
    const decoded = jwt.verify(token.replace('Bearer ', ''), process.env.JWT_SECRET);
    
    // Agregar el usuario decodificado completo a la solicitud
    req.user = decoded; // Aquí se asigna el objeto completo decodificado

    console.log(decoded);  // <-- Verifica qué contiene el token decodificado

    // Continuar con la siguiente función
    next();
  } catch (error) {
    // Si el token no es válido, devolver error
    res.status(401).json({ message: 'Token inválido' });
  }
};

