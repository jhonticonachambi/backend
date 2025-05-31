const { MongoMemoryServer } = require('mongodb-memory-server');
const mongoose = require('mongoose');
const crypto = require('crypto');
const path = require('path');

// Cargar variables de entorno para pruebas si no están cargadas
if (!process.env.GOOGLE_CLIENT_ID) {
  require('dotenv').config({ path: path.join(__dirname, '../../.env.test') });
}

const User = require('../../models/User');

let mongoServer;

const setupTestDB = async () => {
  try {
    // Conectar a MongoDB en memoria
    mongoServer = await MongoMemoryServer.create();
    const mongoUri = mongoServer.getUri();
    await mongoose.connect(mongoUri);
    console.log('Test database connected successfully');
  } catch (error) {
    console.error('Error setting up test database:', error);
    throw error;
  }
};

const teardownTestDB = async () => {
  try {
    // Desconectar y limpiar
    await mongoose.disconnect();
    if (mongoServer) {
      await mongoServer.stop();
    }
    console.log('Test database disconnected successfully');
  } catch (error) {
    console.error('Error tearing down test database:', error);
    throw error;
  }
};

const clearTestDB = async () => {
  try {
    // Limpiar todas las colecciones
    const collections = mongoose.connection.collections;
    for (const key in collections) {
      await collections[key].deleteMany({});
    }
  } catch (error) {
    console.error('Error clearing test database:', error);
    throw error;
  }
};

// Función para generar hash SHA-256 (igual que en authController)
const generateHash = (input) => {
  return crypto.createHash('sha256').update(input).digest('hex');
};

const createTestUser = async (userData = {}) => {
  try {
    const defaultUser = {
      name: 'Test User',
      email: 'test@example.com',
      password: 'password123',
      role: 'volunteer',
      dni: '12345678',
      address: 'Test Address',
      skills: ['Testing'],
      phone: '+51987654321',
      ...userData
    };

    // Encriptar password usando la misma función que authController
    const hashedPassword = generateHash(defaultUser.password);
    
    const user = await User.create({
      ...defaultUser,
      password: hashedPassword
    });

    return { user, plainPassword: defaultUser.password };
  } catch (error) {
    console.error('Error creating test user:', error);
    throw error;
  }
};

module.exports = {
  setupTestDB,
  teardownTestDB,
  clearTestDB,
  createTestUser
};
