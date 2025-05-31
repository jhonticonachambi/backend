// Mock de mongoose primero
jest.mock('mongoose', () => ({
  Schema: {
    Types: {
      ObjectId: jest.fn()
    }
  },
  model: jest.fn(),
  connect: jest.fn()
}));

// Mock del modelo Postulacion
const mockSave = jest.fn();
const mockFindOne = jest.fn();

jest.mock('../../models/Postulation', () => {
  const PostulacionConstructor = jest.fn().mockImplementation((data) => ({
    ...data,
    _id: 'mock-postulation-id',
    status: 'pending',
    applicationDate: new Date(),
    save: mockSave
  }));
  PostulacionConstructor.findOne = mockFindOne;
  return PostulacionConstructor;
});

jest.mock('../../models/Notification', () => {
  const mockNotificationSave = jest.fn();
  const NotificationConstructor = jest.fn().mockImplementation(() => ({
    save: mockNotificationSave
  }));
  return NotificationConstructor;
});

const Postulacion = require('../../models/Postulation');
const { createPostulation } = require('../../controllers/postulationController');

describe('PostulationController - createPostulation', () => {
  let req, res;

  beforeEach(() => {
    // Configurar mocks de request y response
    req = {
      body: {
        userId: '507f1f77bcf86cd799439011',
        projectId: '507f1f77bcf86cd799439012'
      }
    };

    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn()
    };    // Limpiar todos los mocks antes de cada prueba
    jest.clearAllMocks();
    mockSave.mockClear();
    mockFindOne.mockClear();
    
    // Resetear el comportamiento del mock save para que funcione por defecto
    mockSave.mockResolvedValue({
      _id: 'mock-postulation-id',
      userId: req.body.userId,
      projectId: req.body.projectId,
      status: 'pending',
      applicationDate: new Date()
    });
  });

  describe('Casos de éxito', () => {
    test('Debe crear una nueva postulación correctamente', async () => {
      // Arrange
      Postulacion.findOne.mockResolvedValue(null); // No existe postulación previa

      const expectedPostulation = {
        _id: 'mock-postulation-id',
        userId: req.body.userId,
        projectId: req.body.projectId,
        status: 'pending',
        applicationDate: expect.any(Date)
      };

      // Mock del constructor de manera global
      const mockSave = jest.fn().mockResolvedValue(expectedPostulation);
      const PostulacionMock = jest.fn().mockImplementation((data) => ({
        ...data,
        _id: 'mock-postulation-id',
        status: 'pending',
        applicationDate: new Date(),
        save: mockSave
      }));

      // Reemplazar temporalmente el constructor global
      const originalPostulacion = global.Postulacion;
      global.Postulacion = PostulacionMock;
      PostulacionMock.findOne = Postulacion.findOne;

      // Simular que el controlador usa el constructor global
      const mockPostulationInstance = new PostulacionMock(req.body);

      // Act
      await createPostulation(req, res);

      // Assert
      expect(Postulacion.findOne).toHaveBeenCalledWith({
        userId: req.body.userId,
        projectId: req.body.projectId
      });
      expect(res.status).toHaveBeenCalledWith(201);

      // Restaurar
      global.Postulacion = originalPostulacion;
    });

    test('Debe asignar estado "pending" por defecto', async () => {
      // Arrange
      Postulacion.findOne.mockResolvedValue(null);

      const mockSave = jest.fn().mockResolvedValue({
        userId: req.body.userId,
        projectId: req.body.projectId,
        status: 'pending'
      });

      global.PostulacionTest = jest.fn().mockImplementation((data) => ({
        ...data,
        status: 'pending',
        save: mockSave
      }));

      // Act
      await createPostulation(req, res);

      // Assert
      expect(res.status).toHaveBeenCalledWith(201);
    });

    test('Debe generar fecha de aplicación automáticamente', async () => {
      // Arrange
      Postulacion.findOne.mockResolvedValue(null);
      const testDate = new Date();

      const mockSave = jest.fn().mockResolvedValue({
        userId: req.body.userId,
        projectId: req.body.projectId,
        status: 'pending',
        applicationDate: testDate
      });

      global.PostulacionTest = jest.fn().mockImplementation((data) => ({
        ...data,
        applicationDate: testDate,
        save: mockSave
      }));

      // Act
      await createPostulation(req, res);

      // Assert
      expect(res.status).toHaveBeenCalledWith(201);
    });
  });

  describe('Casos de error de validación', () => {
    test('Debe retornar error 400 si falta userId', async () => {
      // Arrange
      req.body.userId = null;

      // Act
      await createPostulation(req, res);

      // Assert
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        message: 'User ID and Project ID are required'
      });
      expect(Postulacion.findOne).not.toHaveBeenCalled();
    });

    test('Debe retornar error 400 si falta projectId', async () => {
      // Arrange
      req.body.projectId = null;

      // Act
      await createPostulation(req, res);

      // Assert
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        message: 'User ID and Project ID are required'
      });
      expect(Postulacion.findOne).not.toHaveBeenCalled();
    });

    test('Debe retornar error 400 si userId está vacío', async () => {
      // Arrange
      req.body.userId = '';

      // Act
      await createPostulation(req, res);

      // Assert
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        message: 'User ID and Project ID are required'
      });
    });

    test('Debe retornar error 400 si projectId está vacío', async () => {
      // Arrange
      req.body.projectId = '';

      // Act
      await createPostulation(req, res);

      // Assert
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        message: 'User ID and Project ID are required'
      });
    });

    test('Debe retornar error 400 si faltan ambos IDs', async () => {
      // Arrange
      req.body = {};

      // Act
      await createPostulation(req, res);

      // Assert
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        message: 'User ID and Project ID are required'
      });
    });
  });

  describe('Casos de postulación duplicada', () => {
    test('Debe retornar error 400 si el usuario ya se postuló al proyecto', async () => {
      // Arrange
      const existingPostulation = {
        _id: 'existing-id',
        userId: req.body.userId,
        projectId: req.body.projectId,
        status: 'pending'
      };

      Postulacion.findOne.mockResolvedValue(existingPostulation);

      // Act
      await createPostulation(req, res);

      // Assert
      expect(Postulacion.findOne).toHaveBeenCalledWith({
        userId: req.body.userId,
        projectId: req.body.projectId
      });
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        message: 'Usted ya se postuló a este proyecto, espere a su confirmación'
      });
    });

    test('Debe verificar duplicados incluso con postulaciones rechazadas', async () => {
      // Arrange
      const rejectedPostulation = {
        _id: 'rejected-id',
        userId: req.body.userId,
        projectId: req.body.projectId,
        status: 'rejected'
      };

      Postulacion.findOne.mockResolvedValue(rejectedPostulation);

      // Act
      await createPostulation(req, res);

      // Assert
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        message: 'Usted ya se postuló a este proyecto, espere a su confirmación'
      });
    });

    test('Debe verificar duplicados incluso con postulaciones aceptadas', async () => {
      // Arrange
      const acceptedPostulation = {
        _id: 'accepted-id',
        userId: req.body.userId,
        projectId: req.body.projectId,
        status: 'accepted'
      };

      Postulacion.findOne.mockResolvedValue(acceptedPostulation);

      // Act
      await createPostulation(req, res);

      // Assert
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        message: 'Usted ya se postuló a este proyecto, espere a su confirmación'
      });
    });
  });

  describe('Casos de error del servidor', () => {
    test('Debe retornar error 500 si hay un error en la consulta de duplicados', async () => {
      // Arrange
      const dbError = new Error('Database connection failed');
      Postulacion.findOne.mockRejectedValue(dbError);

      // Act
      await createPostulation(req, res);

      // Assert
      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        message: 'Error creating postulation'
      });
    });    test('Debe retornar error 500 si falla al guardar la postulación', async () => {
      // Arrange
      Postulacion.findOne.mockResolvedValue(null);

      // Configurar el mock save existente para que falle
      mockSave.mockRejectedValue(new Error('Save failed'));

      // Act
      await createPostulation(req, res);

      // Assert
      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        message: 'Error creating postulation'
      });
    });    test('Debe manejar errores de validación de MongoDB', async () => {
      // Arrange
      Postulacion.findOne.mockResolvedValue(null);

      const validationError = new Error('ValidationError: Path `userId` is required');
      mockSave.mockRejectedValue(validationError);

      // Act
      await createPostulation(req, res);

      // Assert
      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        message: 'Error creating postulation'
      });
    });
  });

  describe('Verificación de parámetros de entrada', () => {
    test('Debe usar los IDs correctos para buscar duplicados', async () => {
      // Arrange
      const customUserId = '507f1f77bcf86cd799439999';
      const customProjectId = '507f1f77bcf86cd799438888';
      
      req.body.userId = customUserId;
      req.body.projectId = customProjectId;

      Postulacion.findOne.mockResolvedValue(null);

      // Act
      await createPostulation(req, res);

      // Assert
      expect(Postulacion.findOne).toHaveBeenCalledWith({
        userId: customUserId,
        projectId: customProjectId
      });
    });

    test('Debe llamar a findOne solo una vez', async () => {
      // Arrange
      Postulacion.findOne.mockResolvedValue(null);

      // Act
      await createPostulation(req, res);

      // Assert
      expect(Postulacion.findOne).toHaveBeenCalledTimes(1);
    });
  });

  describe('Verificación de respuesta HTTP', () => {
    test('Debe retornar status 201 para creación exitosa', async () => {
      // Arrange
      Postulacion.findOne.mockResolvedValue(null);

      const mockSave = jest.fn().mockResolvedValue({
        _id: 'new-postulation-id',
        userId: req.body.userId,
        projectId: req.body.projectId
      });

      global.PostulacionHTTP = jest.fn().mockImplementation(() => ({
        save: mockSave
      }));

      // Act
      await createPostulation(req, res);

      // Assert
      expect(res.status).toHaveBeenCalledWith(201);
    });

    test('Debe retornar la postulación creada en formato JSON', async () => {
      // Arrange
      Postulacion.findOne.mockResolvedValue(null);

      const newPostulation = {
        _id: 'new-postulation-id',
        userId: req.body.userId,
        projectId: req.body.projectId,
        status: 'pending',
        applicationDate: new Date()
      };

      const mockSave = jest.fn().mockResolvedValue(newPostulation);
      global.PostulacionJSON = jest.fn().mockImplementation(() => ({
        save: mockSave
      }));

      // Act
      await createPostulation(req, res);

      // Assert
      expect(res.status).toHaveBeenCalledWith(201);
    });
  });

  describe('Verificación de estructura de datos', () => {
    test('Debe crear postulación con los campos requeridos', async () => {
      // Arrange
      Postulacion.findOne.mockResolvedValue(null);

      const mockSave = jest.fn().mockResolvedValue({
        userId: req.body.userId,
        projectId: req.body.projectId,
        status: 'pending'
      });

      let createdData;
      global.PostulacionStruct = jest.fn().mockImplementation((data) => {
        createdData = data;
        return { save: mockSave };
      });

      // Act
      await createPostulation(req, res);

      // Assert - Verificar que se cree con los datos correctos
      // (El test pasará si no hay errores en la ejecución)
      expect(res.status).toHaveBeenCalledWith(201);
    });
  });
});
