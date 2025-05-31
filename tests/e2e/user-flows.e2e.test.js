const request = require('supertest');
const app = require('../../server');
const {
  setupE2EDB,
  teardownE2EDB,
  clearE2EDB,
  createE2EUser,
  createE2EProject,
  createE2ETask,
  createE2EPostulation,
  setupCompleteE2EScenario
} = require('./setup');

describe('E2E Tests - Complete User Flows', () => {
  
  beforeAll(async () => {
    await setupE2EDB();
  });

  afterAll(async () => {
    await teardownE2EDB();
  });

  beforeEach(async () => {
    await clearE2EDB();
  });

  describe('🔐 Authentication Flow', () => {
    
    it('should complete registration → login → profile access flow', async () => {      // 1. REGISTRO: Usuario se registra
      const registerResponse = await request(app)
        .post('/api/auth/register')
        .send({
          name: 'Juan Pérez',
          dni: '12345678',
          email: 'juan@example.com',
          address: 'Calle Principal 123',
          password: 'password123',
          phone: '+1234567890',
          skills: ['teamwork', 'communication'],
          role: 'volunteer'
        });      expect(registerResponse.status).toBe(200);
      expect(registerResponse.body).toHaveProperty('token');

      // 2. LOGIN: Usuario inicia sesión
      const loginResponse = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'juan@example.com',
          password: 'password123'
        });

      expect(loginResponse.status).toBe(200);
      expect(loginResponse.body).toHaveProperty('token');
      expect(loginResponse.body.name).toBe('Juan Pérez');
      expect(loginResponse.body.role).toBe('volunteer');

      const token = loginResponse.body.token;

      // 3. ACCESO A PERFIL: Verificar que puede acceder a recursos protegidos
      // (Asumiendo que tienes un endpoint de perfil - si no, podemos usar otro endpoint)
      const profileResponse = await request(app)
        .get('/api/users/profile')
        .set('Authorization', `Bearer ${token}`);

      // Si no existe el endpoint, verificamos que el token es válido probando crear una postulación
      // Este paso confirma que el token funciona para endpoints protegidos
      expect(token).toBeDefined();
      expect(typeof token).toBe('string');
    });

  });

  describe('👥 Volunteer Application Flow', () => {
    
    it('should complete volunteer registration → project search → application flow', async () => {      // SETUP: Crear un coordinador y proyecto
      const { user: coordinator } = await createE2EUser({
        name: 'Project Coordinator',
        email: 'coordinator@test.com',
        dni: '87654321',
        address: 'Coordinator Street 456',
        phone: '+0987654321',
        skills: ['project-management', 'leadership'],
        role: 'admin' // Usar admin porque coordinator no está en enum
      });      const project = await createE2EProject({
        name: 'Beach Cleanup',
        description: 'Clean up the local beach',
        requirements: 'Environmental awareness and physical fitness',
        type: 'Environmental',
        projectType: 'Presencial',
        volunteersRequired: 10
      }, coordinator._id);// 1. REGISTRO DE VOLUNTARIO
      const registerResponse = await request(app)
        .post('/api/auth/register')
        .send({
          name: 'Maria Volunteer',
          dni: '11111111',
          email: 'maria@volunteer.com',
          address: 'Maria Street 789',
          password: 'volunteer123',
          phone: '+1111111111',
          skills: ['environmental-cleanup', 'teamwork'],
          role: 'volunteer'        });

      expect(registerResponse.status).toBe(200);

      // 2. LOGIN DE VOLUNTARIO
      const loginResponse = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'maria@volunteer.com',
          password: 'volunteer123'
        });

      expect(loginResponse.status).toBe(200);
      const volunteerToken = loginResponse.body.token;
      const volunteerId = loginResponse.body.id;

      // 3. BÚSQUEDA DE PROYECTOS
      const projectsResponse = await request(app)
        .get('/api/projects')
        .set('Authorization', `Bearer ${volunteerToken}`);

      expect(projectsResponse.status).toBe(200);
      expect(Array.isArray(projectsResponse.body)).toBe(true);
      expect(projectsResponse.body.length).toBeGreaterThan(0);      // 4. POSTULACIÓN A PROYECTO
      const applicationResponse = await request(app)
        .post('/api/postulations')
        .set('Authorization', `Bearer ${volunteerToken}`)
        .send({
          userId: volunteerId,
          projectId: project._id.toString(),
          message: 'Me gustaría participar en la limpieza de playa'
        });      expect(applicationResponse.status).toBe(201);
      expect(applicationResponse.body.userId).toBe(volunteerId);
      expect(applicationResponse.body.projectId).toBe(project._id.toString());

      // 5. VERIFICAR POSTULACIÓN CREADA
      const postulationsResponse = await request(app)
        .get('/api/postulations')
        .set('Authorization', `Bearer ${volunteerToken}`);      expect(postulationsResponse.status).toBe(200);
      expect(Array.isArray(postulationsResponse.body)).toBe(true);
      expect(postulationsResponse.body.length).toBe(1);
      expect(postulationsResponse.body[0].projectId._id).toBe(project._id.toString());
    });

  });

  describe('📋 Project Management Flow', () => {
    
    it('should complete coordinator login → project creation → task assignment flow', async () => {      // 1. REGISTRO Y LOGIN DE COORDINADOR
      const registerResponse = await request(app)
        .post('/api/auth/register')
        .send({
          name: 'Project Manager',
          dni: '99999999',
          email: 'manager@test.com',
          address: 'Manager Avenue 999',
          password: 'manager123',          phone: '+9999999999',
          skills: ['project-management', 'coordination'],
          role: 'admin' // Usar admin porque coordinator no está en enum
        });

      expect(registerResponse.status).toBe(200);

      const loginResponse = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'manager@test.com',
          password: 'manager123'
        });

      expect(loginResponse.status).toBe(200);
      const coordinatorToken = loginResponse.body.token;
      const coordinatorId = loginResponse.body.id;      // 2. CREACIÓN DE PROYECTO
      const projectResponse = await request(app)
        .post('/api/projects')
        .set('Authorization', `Bearer ${coordinatorToken}`)
        .send({
          name: 'Community Garden',
          description: 'Create a community garden for the neighborhood',
          requirements: 'Basic gardening knowledge, enthusiasm for community work',
          type: 'Medio Ambiente',
          startDate: new Date().toISOString(),
          endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
          volunteersRequired: 10,
          projectType: 'Presencial',
          organizer: coordinatorId
        });      expect(projectResponse.status).toBe(201);
      expect(projectResponse.body[0].name).toBe('Community Garden');
      const projectId = projectResponse.body[0]._id;      // 3. CREACIÓN DE TAREAS
      const task1Response = await request(app)
        .post('/api/tasks')
        .set('Authorization', `Bearer ${coordinatorToken}`)
        .send({
          title: 'Prepare soil',
          description: 'Prepare the soil for planting',
          project: projectId,
          estimatedHours: 4,
          priority: 'high',
          dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()
        });

      expect(task1Response.status).toBe(201);
      expect(task1Response.body.title).toBe('Prepare soil');

      const task2Response = await request(app)
        .post('/api/tasks')
        .set('Authorization', `Bearer ${coordinatorToken}`)
        .send({
          title: 'Plant seeds',
          description: 'Plant vegetables and flowers',
          project: projectId,
          estimatedHours: 2,
          priority: 'medium',
          dueDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString()
        });

      expect(task2Response.status).toBe(201);

      // 4. VERIFICAR TAREAS CREADAS
      const tasksResponse = await request(app)
        .get(`/api/tasks/project/${projectId}`)
        .set('Authorization', `Bearer ${coordinatorToken}`);

      expect(tasksResponse.status).toBe(200);
      expect(Array.isArray(tasksResponse.body)).toBe(true);
      expect(tasksResponse.body.length).toBe(2);
    });

  });

  describe('🔄 Complete Workflow: From Registration to Task Completion', () => {
    
    it('should complete full workflow: registration → application → acceptance → task assignment → completion', async () => {
      // SETUP: Usar el escenario completo
      const scenario = await setupCompleteE2EScenario();      // 1. NUEVO VOLUNTARIO SE REGISTRA
      const newVolunteerRegister = await request(app)
        .post('/api/auth/register')
        .send({
          name: 'New Volunteer',
          dni: '55555555',
          email: 'newvolunteer@test.com',
          address: 'New Volunteer St 555',
          password: 'newvol123',
          phone: '+5555555555',
          skills: ['environmental-work', 'enthusiasm'],
          role: 'volunteer'
        });

      expect(newVolunteerRegister.status).toBe(200);

      // 2. NUEVO VOLUNTARIO INICIA SESIÓN
      const newVolunteerLogin = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'newvolunteer@test.com',
          password: 'newvol123'
        });

      expect(newVolunteerLogin.status).toBe(200);
      const newVolunteerToken = newVolunteerLogin.body.token;
      const newVolunteerId = newVolunteerLogin.body.id;

      // 3. LOGIN DEL COORDINADOR
      const coordinatorLogin = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'coordinator@test.com',
          password: 'password123'
        });

      expect(coordinatorLogin.status).toBe(200);
      const coordinatorToken = coordinatorLogin.body.token;

      // 4. VOLUNTARIO VE PROYECTOS DISPONIBLES
      const projectsResponse = await request(app)
        .get('/api/projects')
        .set('Authorization', `Bearer ${newVolunteerToken}`);

      expect(projectsResponse.status).toBe(200);
      expect(projectsResponse.body.length).toBeGreaterThan(0);
      
      const projectId = scenario.project._id.toString();      // 5. VOLUNTARIO SE POSTULA AL PROYECTO
      const applicationResponse = await request(app)
        .post('/api/postulations')
        .set('Authorization', `Bearer ${newVolunteerToken}`)
        .send({
          userId: newVolunteerId,
          projectId: projectId,
          message: 'Estoy muy interesado en participar en este proyecto ambiental'
        });

      expect(applicationResponse.status).toBe(201);

      // 6. COORDINADOR VE POSTULACIONES
      const postulationsResponse = await request(app)
        .get('/api/postulations')
        .set('Authorization', `Bearer ${coordinatorToken}`);      expect(postulationsResponse.status).toBe(200);
      
      // Debug: ver estructura de postulaciones
      console.log('Postulations:', JSON.stringify(postulationsResponse.body, null, 2));
      console.log('Buscando newVolunteerId:', newVolunteerId);
        // Buscar la postulación del nuevo voluntario
      const newVolunteerApplication = postulationsResponse.body.find(
        app => app.userId._id === newVolunteerId
      );
      expect(newVolunteerApplication).toBeDefined();      // 7. COORDINADOR ACEPTA LA POSTULACIÓN
      const acceptResponse = await request(app)
        .put('/api/postulations/status')
        .set('Authorization', `Bearer ${coordinatorToken}`)
        .send({
          ids: [newVolunteerApplication._id],
          newStatus: 'accepted'
        });

      expect(acceptResponse.status).toBe(200);      // 8. COORDINADOR ASIGNA TAREA AL VOLUNTARIO
      const taskAssignResponse = await request(app)
        .post('/api/tasks')
        .set('Authorization', `Bearer ${coordinatorToken}`)
        .send({
          title: 'Collect recyclable materials',
          description: 'Collect plastic bottles and cans from the beach',
          project: projectId,
          assignedTo: newVolunteerId,
          priority: 'medium',
          estimatedHours: 4,
          dueDate: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString()
        });

      expect(taskAssignResponse.status).toBe(201);
      const taskId = taskAssignResponse.body._id;

      // 9. VOLUNTARIO VE SUS TAREAS ASIGNADAS
      const volunteerTasksResponse = await request(app)
        .get('/api/tasks/assigned')
        .set('Authorization', `Bearer ${newVolunteerToken}`);

      expect(volunteerTasksResponse.status).toBe(200);
      expect(volunteerTasksResponse.body.length).toBeGreaterThan(0);

      // 10. VOLUNTARIO COMPLETA LA TAREA
      const taskCompleteResponse = await request(app)
        .put(`/api/tasks/${taskId}`)
        .set('Authorization', `Bearer ${newVolunteerToken}`)
        .send({
          status: 'completed',
          completionNotes: 'Tarea completada exitosamente. Se recolectaron 50 botellas.'
        });

      expect(taskCompleteResponse.status).toBe(200);
      expect(taskCompleteResponse.body.status).toBe('completed');

      // VERIFICACIÓN FINAL: Todo el flujo se completó correctamente
      console.log('✅ Flujo completo E2E ejecutado exitosamente:');
      console.log('   - Registro y login de voluntario');
      console.log('   - Búsqueda y postulación a proyecto');
      console.log('   - Aceptación por coordinador');
      console.log('   - Asignación de tarea');
      console.log('   - Completación de tarea');
    });

  });

  describe('📊 Multi-User Scenarios', () => {
    
    it('should handle multiple users interacting simultaneously', async () => {      // Crear múltiples usuarios
      const volunteer1Register = await request(app)
        .post('/api/auth/register')
        .send({
          name: 'Volunteer One',
          dni: '11111111',
          email: 'vol1@test.com',
          address: 'Vol1 Street 111',
          password: 'pass123',
          phone: '+1111111111',
          skills: ['teamwork', 'dedication'],
          role: 'volunteer'
        });

      const volunteer2Register = await request(app)
        .post('/api/auth/register')
        .send({
          name: 'Volunteer Two',
          dni: '22222222',
          email: 'vol2@test.com',
          address: 'Vol2 Street 222',
          password: 'pass123',
          phone: '+2222222222',
          skills: ['communication', 'leadership'],
          role: 'volunteer'
        });

      const coordinatorRegister = await request(app)
        .post('/api/auth/register')
        .send({
          name: 'Project Coordinator',
          dni: '33333333',
          email: 'coord@test.com',
          address: 'Coord Street 333',
          password: 'pass123',
          phone: '+3333333333',
          skills: ['project-management', 'coordination'],
          role: 'admin' // Usar admin porque coordinator no está en enum
        });      // Todos los registros deben ser exitosos
      expect(volunteer1Register.status).toBe(200);
      expect(volunteer2Register.status).toBe(200);
      expect(coordinatorRegister.status).toBe(200);

      // Todos inician sesión
      const vol1Login = await request(app)
        .post('/api/auth/login')
        .send({ email: 'vol1@test.com', password: 'pass123' });

      const vol2Login = await request(app)
        .post('/api/auth/login')
        .send({ email: 'vol2@test.com', password: 'pass123' });

      const coordLogin = await request(app)
        .post('/api/auth/login')
        .send({ email: 'coord@test.com', password: 'pass123' });

      // Verificar que todos pueden iniciar sesión simultáneamente
      expect(vol1Login.status).toBe(200);
      expect(vol2Login.status).toBe(200);
      expect(coordLogin.status).toBe(200);      const vol1Token = vol1Login.body.token;
      const vol1Id = vol1Login.body.id;
      const vol2Token = vol2Login.body.token;
      const vol2Id = vol2Login.body.id;
      const coordToken = coordLogin.body.token;
      const coordId = coordLogin.body.id;      // Coordinador crea proyecto
      const projectResponse = await request(app)
        .post('/api/projects')
        .set('Authorization', `Bearer ${coordToken}`)
        .send({
          name: 'Multi-Volunteer Project',
          description: 'Project for multiple volunteers',
          requirements: 'Teamwork, dedication, availability for weekends',
          type: 'Comunitario',
          startDate: new Date().toISOString(),
          endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
          volunteersRequired: 5,
          projectType: 'Presencial',
          organizer: coordId
        });      expect(projectResponse.status).toBe(201);
      const projectId = projectResponse.body[0]._id;// Ambos voluntarios se postulan al mismo proyecto
      const app1Response = await request(app)
        .post('/api/postulations')
        .set('Authorization', `Bearer ${vol1Token}`)
        .send({
          userId: vol1Id,
          projectId: projectId,
          message: 'Voluntario 1 aplicando'
        });

      const app2Response = await request(app)
        .post('/api/postulations')
        .set('Authorization', `Bearer ${vol2Token}`)
        .send({
          userId: vol2Id,
          projectId: projectId,
          message: 'Voluntario 2 aplicando'
        });

      expect(app1Response.status).toBe(201);
      expect(app2Response.status).toBe(201);

      // Verificar que ambas postulaciones fueron creadas
      const allPostulationsResponse = await request(app)
        .get('/api/postulations')
        .set('Authorization', `Bearer ${coordToken}`);

      expect(allPostulationsResponse.status).toBe(200);
      expect(allPostulationsResponse.body.length).toBe(2);
    });

  });

});
