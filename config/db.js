
const mongoose = require('mongoose');

const connectDB = async () => {
  // No conectar a MongoDB durante las pruebas de integración
  // Las pruebas de integración usan su propia configuración con MongoDB Memory Server
  if (process.env.NODE_ENV === 'test') {
    console.log('Modo test: saltando conexión a MongoDB real');
    return;
  }

  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('MongoDB conectado');
  } catch (error) {
    console.error('Error al conectar a MongoDB:', error.message);
    process.exit(1);
  }
};

module.exports = connectDB;

