const { MongoMemoryServer } = require('mongodb-memory-server');
const mongoose = require('mongoose');
const crypto = require('crypto');
const User = require('../../models/User');
const Project = require('../../models/Project');
const Task = require('../../models/Task');
const Postulation = require('../../models/Postulation');
const Notification = require('../../models/Notification');

let mongoServer;

// Función para generar hash como en el controlador
const generateHash = (password) => {
  return crypto.createHash('sha256').update(password).digest('hex');
};

const setupE2EDB = async () => {
  try {
    mongoServer = await MongoMemoryServer.create();
    const mongoUri = mongoServer.getUri();
    
    await mongoose.connect(mongoUri);
    console.log('E2E Test database connected successfully');
  } catch (error) {
    console.error('Error setting up E2E test database:', error);
    throw error;
  }
};

const teardownE2EDB = async () => {
  try {
    await mongoose.connection.dropDatabase();
    await mongoose.connection.close();
    await mongoServer.stop();
    console.log('E2E Test database disconnected successfully');
  } catch (error) {
    console.error('Error tearing down E2E test database:', error);
    throw error;
  }
};

const clearE2EDB = async () => {
  try {
    const collections = mongoose.connection.collections;
    for (const key in collections) {
      const collection = collections[key];
      await collection.deleteMany({});
    }
  } catch (error) {
    console.error('Error clearing E2E test database:', error);
    throw error;
  }
};

// Crear usuario de prueba con datos completos
const createE2EUser = async (userData = {}) => {
  const defaultUser = {
    name: 'Test User',
    dni: '12345678',
    email: 'test@example.com',
    address: 'Test Address 123',
    password: generateHash('password123'),
    phone: '+1234567890',
    skills: ['teamwork', 'communication'],
    role: 'volunteer',
    isActive: true,
    ...userData
  };

  if (userData.password && userData.password !== 'password123') {
    defaultUser.password = generateHash(userData.password);
  }

  const user = new User(defaultUser);
  await user.save();
  
  return {
    user,
    plainPassword: userData.password || 'password123'
  };
};

// Crear proyecto de prueba
const createE2EProject = async (projectData = {}, creatorId) => {
  const defaultProject = {
    name: 'Test Project',
    description: 'A test project for E2E testing',
    requirements: 'Basic requirements for volunteers',
    type: 'Community Service',
    startDate: new Date(),
    endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 días
    volunteersRequired: 5,
    projectType: 'Presencial',
    organizer: creatorId,
    status: 'activo',
    ...projectData
  };

  const project = new Project(defaultProject);
  await project.save();
  
  return project;
};

// Crear tarea de prueba
const createE2ETask = async (taskData = {}, projectId, assignedTo = null) => {
  const defaultTask = {
    title: 'Test Task',
    description: 'A test task for E2E testing',
    status: 'pending',
    priority: 'medium',
    project: projectId,
    assignedTo: assignedTo,
    dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 días
    ...taskData
  };

  const task = new Task(defaultTask);
  await task.save();
  
  return task;
};

// Crear postulación de prueba
const createE2EPostulation = async (userId, projectId, postulationData = {}) => {
  const defaultPostulation = {
    volunteer: userId,
    project: projectId,
    message: 'Me interesa participar en este proyecto',
    status: 'pending',
    applicationDate: new Date(),
    ...postulationData
  };

  const postulation = new Postulation(defaultPostulation);
  await postulation.save();
  
  return postulation;
};

// Crear notificación de prueba
const createE2ENotification = async (userId, notificationData = {}) => {
  const defaultNotification = {
    user: userId,
    title: 'Test Notification',
    message: 'This is a test notification',
    type: 'info',
    isRead: false,
    createdAt: new Date(),
    ...notificationData
  };

  const notification = new Notification(defaultNotification);
  await notification.save();
  
  return notification;
};

// Configurar escenario completo para pruebas E2E
const setupCompleteE2EScenario = async () => {  // Crear administrador
  const { user: admin } = await createE2EUser({
    name: 'Admin User',
    email: 'admin@test.com',
    dni: '11111111',
    address: 'Admin Address 123',
    phone: '+1111111111',
    skills: ['leadership', 'management'],
    role: 'admin'
  });

  // Crear coordinador (usando rol admin ya que coordinator no existe)
  const { user: coordinator } = await createE2EUser({
    name: 'Coordinator User',
    email: 'coordinator@test.com',
    dni: '22222222',
    address: 'Coordinator Address 456',
    phone: '+2222222222',
    skills: ['project-management', 'coordination'],
    role: 'admin' // Cambiar a admin porque coordinator no está en enum
  });

  // Crear voluntarios
  const { user: volunteer1 } = await createE2EUser({
    name: 'Volunteer One',
    email: 'volunteer1@test.com',
    dni: '33333333',
    address: 'Volunteer1 Address 789',
    phone: '+3333333333',
    skills: ['environmental-work', 'teamwork'],
    role: 'volunteer'
  });

  const { user: volunteer2 } = await createE2EUser({
    name: 'Volunteer Two',
    email: 'volunteer2@test.com',
    dni: '44444444',
    address: 'Volunteer2 Address 101',
    phone: '+4444444444',
    skills: ['cleanup', 'organization'],
    role: 'volunteer'
  });

  // Crear proyecto
  const project = await createE2EProject({
    name: 'Environmental Cleanup',
    description: 'Community environmental cleanup project'
  }, coordinator._id);

  // Crear tareas
  const task1 = await createE2ETask({
    title: 'Coordinate cleanup teams',
    description: 'Organize volunteer teams for cleanup'
  }, project._id);

  const task2 = await createE2ETask({
    title: 'Equipment preparation',
    description: 'Prepare cleaning equipment'
  }, project._id, volunteer1._id);

  return {
    admin,
    coordinator,
    volunteer1,
    volunteer2,
    project,
    tasks: [task1, task2]
  };
};

module.exports = {
  setupE2EDB,
  teardownE2EDB,
  clearE2EDB,
  createE2EUser,
  createE2EProject,
  createE2ETask,
  createE2EPostulation,
  createE2ENotification,
  setupCompleteE2EScenario
};
