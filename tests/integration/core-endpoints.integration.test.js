const request = require('supertest');
const app = require('../../server');
const { setupTestDB, teardownTestDB, clearTestDB, createTestUser } = require('./setup');

describe('Integration Tests - Core Endpoints', () => {
  
  beforeAll(async () => {
    await setupTestDB();
  });

  afterAll(async () => {
    await teardownTestDB();
  });

  beforeEach(async () => {
    await clearTestDB();
  });

  test('should login successfully', async () => {
    await createTestUser({
      email: 'test@login.com',
      name: 'Test User',
      role: 'volunteer'
    });

    const response = await request(app)
      .post('/api/auth/login')
      .send({
        email: 'test@login.com',
        password: 'password123'
      });

    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('token');
    expect(response.body).toHaveProperty('id');
    expect(response.body).toHaveProperty('name');
    expect(response.body).toHaveProperty('role');
    expect(response.body.name).toBe('Test User');
    expect(response.body.role).toBe('volunteer');
  });
  test('should register new user successfully', async () => {    const userData = {
      name: 'Nuevo Usuario',
      email: 'nuevo@test.com',
      password: 'password123',
      role: 'volunteer',
      dni: '12345678',
      address: 'Calle Test 123',
      skills: ['JavaScript', 'Node.js'],
      phone: '555-1234'
    };const response = await request(app)
      .post('/api/auth/register')
      .send(userData);

    if (response.status !== 200) {
      console.log('Error en registro:', response.body);
    }
    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('token');
    expect(response.body).toHaveProperty('id');
    expect(response.body).toHaveProperty('name');
    expect(response.body).toHaveProperty('role');
    expect(response.body.name).toBe('Nuevo Usuario');
    expect(response.body.role).toBe('volunteer');
    expect(response.body).not.toHaveProperty('password');
  });

  test('should create project successfully', async () => {
    const adminUser = await createTestUser({
      email: 'admin@test.com',
      name: 'Admin User',
      role: 'admin'
    });

    const loginResponse = await request(app)
      .post('/api/auth/login')
      .send({
        email: 'admin@test.com',
        password: 'password123'
      });

    const adminToken = loginResponse.body.token;
    const adminId = loginResponse.body.id;    const projectData = {
      name: 'Proyecto de Prueba',
      description: 'Descripción del proyecto de prueba',
      location: 'Ubicación Test',
      startDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
      endDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(),
      volunteersRequired: 5,
      status: 'activo',
      organizer: adminId,
      projectType: 'educacion',
      type: 'presencial',
      requirements: 'Requisito 1, Requisito 2'
    };

    const response = await request(app)
      .post('/api/projects')
      .set('Authorization', `Bearer ${adminToken}`)
      .send(projectData);

    expect(response.status).toBe(201);
    expect(Array.isArray(response.body)).toBe(true);
    expect(response.body.length).toBe(1);
    expect(response.body[0]).toHaveProperty('_id');
    expect(response.body[0].name).toBe('Proyecto de Prueba');
    expect(response.body[0].description).toBe('Descripción del proyecto de prueba');
    expect(response.body[0].projectType).toBe('educacion');
  });

  test('should create postulation successfully', async () => {
    const adminUser = await createTestUser({
      email: 'admin@postulation.com',
      name: 'Admin',
      role: 'admin'
    });

    const volunteerUser = await createTestUser({
      email: 'volunteer@postulation.com',
      name: 'Volunteer',
      role: 'volunteer'
    });

    const adminLogin = await request(app)
      .post('/api/auth/login')
      .send({ email: 'admin@postulation.com', password: 'password123' });

    const projectResponse = await request(app)
      .post('/api/projects')
      .set('Authorization', `Bearer ${adminLogin.body.token}`)      .send({
        name: 'Proyecto para Postulación',
        description: 'Proyecto test',
        location: 'Test Location',
        startDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
        endDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(),
        volunteersRequired: 3,
        status: 'activo',
        organizer: adminLogin.body.id,
        projectType: 'medio_ambiente',
        type: 'virtual',
        requirements: 'Requisito test'
      });

    const projectId = projectResponse.body[0]._id;

    const volunteerLogin = await request(app)
      .post('/api/auth/login')
      .send({ email: 'volunteer@postulation.com', password: 'password123' });    const postulationData = {
      projectId: projectId,
      userId: volunteerLogin.body.id
    };const response = await request(app)
      .post('/api/postulations')
      .set('Authorization', `Bearer ${volunteerLogin.body.token}`)
      .send(postulationData);

    if (response.status !== 201) {
      console.log('Error en creación de postulación:', response.body);
    }    expect(response.status).toBe(201);
    expect(response.body).toHaveProperty('_id');
    expect(response.body.status).toBe('pending');
    expect(response.body.projectId).toBe(projectId);
    expect(response.body.userId).toBe(volunteerLogin.body.id);
    expect(response.body).toHaveProperty('applicationDate');
  });

  test('should update postulation status successfully', async () => {
    const adminUser = await createTestUser({
      email: 'admin@status.com',
      name: 'Admin',
      role: 'admin'
    });

    const volunteerUser = await createTestUser({
      email: 'volunteer@status.com',
      name: 'Volunteer',
      role: 'volunteer'
    });

    const adminLogin = await request(app)
      .post('/api/auth/login')
      .send({ email: 'admin@status.com', password: 'password123' });

    const projectResponse = await request(app)
      .post('/api/projects')
      .set('Authorization', `Bearer ${adminLogin.body.token}`)      .send({
        name: 'Proyecto Status Test',
        description: 'Proyecto para test de status',
        location: 'Test Location',
        startDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
        endDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(),
        volunteersRequired: 2,
        status: 'activo',
        organizer: adminLogin.body.id,
        projectType: 'social',
        type: 'hibrido',
        requirements: 'Requisito status'
      });

    const projectId = projectResponse.body[0]._id;

    const volunteerLogin = await request(app)
      .post('/api/auth/login')
      .send({ email: 'volunteer@status.com', password: 'password123' });    const postulationResponse = await request(app)
      .post('/api/postulations')
      .set('Authorization', `Bearer ${volunteerLogin.body.token}`)
      .send({
        projectId: projectId,
        userId: volunteerLogin.body.id
      });

    const postulationId = postulationResponse.body._id;    const response = await request(app)
      .put('/api/postulations/status')
      .set('Authorization', `Bearer ${adminLogin.body.token}`)
      .send({
        ids: [postulationId],
        newStatus: 'accepted'
      });

    if (response.status !== 200) {
      console.log('Error en actualización de estado de postulación:', response.body);
    }    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('message');
    expect(response.body.message).toBe('Postulations status updated successfully');
    expect(response.body).toHaveProperty('postulaciones');
    expect(response.body.postulaciones).toHaveLength(1);
    expect(response.body.postulaciones[0].status).toBe('accepted');
    expect(response.body.postulaciones[0]._id).toBe(postulationId);
  });

});
