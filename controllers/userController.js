const User = require('../models/User');
const mongoose = require('mongoose');

// Obtener perfil del usuario
exports.getProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('-password');
    if (!user) {
      return res.status(404).json({ message: 'Usuario no encontrado' });
    }
    res.json(user);
  } catch (error) {
    console.error('Error al obtener el perfil del usuario:', error);
    res.status(500).json({ message: 'Error en el servidor' });
  }
};

// Obtener usuario por ID
exports.getUserById = async (req, res) => {
  const { id } = req.params;

  try {
    const user = await User.findById(id).select('-password');
    if (!user) {
      return res.status(404).json({ message: 'Usuario no encontrado' });
    }
    res.status(200).json(user);
  } catch (error) {
    console.error('Error al obtener el usuario:', error);
    res.status(500).json({ message: 'Error en el servidor' });
  }
};

// Contar usuarios con rol 'volunteer'
exports.countVolunteers = async (req, res) => {
  try {
    const count = await User.countDocuments({ role: 'volunteer' });
    res.status(200).json({ count });
  } catch (error) {
    console.error('Error al contar usuarios voluntarios:', error);
    res.status(500).json({ message: 'Error al contar usuarios voluntarios' });
  }
};

// Verificar si el perfil del usuario está completo
exports.checkProfileCompletion = async (req, res) => {
  try {
    const { id } = req.params;
    
    // Validar el ID
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: 'ID de usuario no válido' });
    }
    
    const user = await User.findById(id).select('-password');
    if (!user) {
      return res.status(404).json({ message: 'Usuario no encontrado' });
    }
    
    // Verificar campos requeridos
    const requiredFields = ['name', 'dni', 'email', 'address', 'phone', 'skills'];
    const emptyFields = requiredFields.filter(field => {
      // Verificar si el campo está vacío o es un valor por defecto
      if (field === 'skills') {
        return !user[field] || user[field].length === 0;
      }
      return !user[field] || user[field] === 'N/A';
    });
    
    const isComplete = emptyFields.length === 0;
    
    res.status(200).json({
      isComplete,
      emptyFields,
      profileData: user
    });
  } catch (error) {
    console.error('Error al verificar completitud del perfil:', error);
    res.status(500).json({ message: 'Error en el servidor' });
  }
};

// Actualizar datos personales básicos del usuario
exports.updatePersonalInfo = async (req, res) => {
  try {
    const { name, dni, address, skills, phone } = req.body;
    const userId = req.user.id;

    // Validar que los datos requeridos estén presentes
    if (!name || !dni || !address || !skills || !skills.length || !phone) {
      return res.status(400).json({ 
        message: 'Todos los campos son obligatorios', 
        details: 'Se requiere nombre, DNI, dirección, habilidades y teléfono' 
      });
    }

    // Buscar el usuario y actualizar solo los campos específicos
    const updatedUser = await User.findByIdAndUpdate(
      userId,
      { name, dni, address, skills, phone, updatedAt: Date.now() },
      { new: true, runValidators: true }
    ).select('-password');

    if (!updatedUser) {
      return res.status(404).json({ message: 'Usuario no encontrado' });
    }

    res.status(200).json({
      message: 'Información personal actualizada correctamente',
      user: updatedUser
    });
  } catch (error) {
    console.error('Error al actualizar la información personal:', error);
    res.status(500).json({ message: 'Error en el servidor al actualizar la información personal' });
  }
};