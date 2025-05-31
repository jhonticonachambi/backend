const { getActiveProjects } = require('../../controllers/projectController');

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

// Mock de todas las dependencias ANTES de importar el controlador
jest.mock('../../models/Project', () => ({
  find: jest.fn()
}));

jest.mock('../../models/Task', () => ({
  find: jest.fn()
}));

jest.mock('../../models/Postulation', () => ({
  find: jest.fn()
}));

jest.mock('../../models/User', () => ({
  findById: jest.fn()
}));

jest.mock('express-validator', () => ({
  validationResult: jest.fn()
}));

const Project = require('../../models/Project');

// Mock de la fecha actual para tener control sobre las pruebas
const mockCurrentDate = new Date('2025-05-29T10:00:00.000Z');

describe('ProjectController - getActiveProjects', () => {
  let req, res;

  beforeEach(() => {
    // Configurar mocks de request y response
    req = {};

    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis()
    };

    // Limpiar mocks
    jest.clearAllMocks();

    // Mock de Date para tener control sobre la fecha actual
    jest.spyOn(global, 'Date').mockImplementation(() => mockCurrentDate);
    global.Date.now = jest.fn(() => mockCurrentDate.getTime());
  });

  afterEach(() => {
    // Restaurar Date original
    jest.restoreAllMocks();
  });

  describe('Casos de éxito', () => {
    test('Debe retornar proyectos activos (no expirados) correctamente', async () => {
      // Arrange
      const mockActiveProjects = [
        {
          _id: '507f1f77bcf86cd799439011',
          name: 'Proyecto Activo 1',
          description: 'Descripción del proyecto 1',
          startDate: new Date('2025-01-01'),
          endDate: new Date('2025-12-31'), // Fecha futura
          status: 'activo',
          volunteersRequired: 10
        },
        {
          _id: '507f1f77bcf86cd799439012',
          name: 'Proyecto Activo 2',
          description: 'Descripción del proyecto 2',
          startDate: new Date('2025-03-01'),
          endDate: new Date('2025-08-31'), // Fecha futura
          status: 'activo',
          volunteersRequired: 5
        }
      ];

      Project.find.mockResolvedValue(mockActiveProjects);

      // Act
      await getActiveProjects(req, res);

      // Assert
      expect(Project.find).toHaveBeenCalledWith({ 
        endDate: { $gte: mockCurrentDate } 
      });
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(mockActiveProjects);
    });

    test('Debe retornar array vacío cuando no hay proyectos activos', async () => {
      // Arrange
      Project.find.mockResolvedValue([]);

      // Act
      await getActiveProjects(req, res);

      // Assert
      expect(Project.find).toHaveBeenCalledWith({ 
        endDate: { $gte: mockCurrentDate } 
      });
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith([]);
    });

    test('Debe filtrar correctamente proyectos por fecha de finalización', async () => {
      // Arrange
      const mockActiveProjects = [
        {
          _id: '507f1f77bcf86cd799439013',
          name: 'Proyecto Límite',
          endDate: new Date('2025-05-29T10:00:00.000Z'), // Mismo día
          status: 'activo'
        }
      ];

      Project.find.mockResolvedValue(mockActiveProjects);

      // Act
      await getActiveProjects(req, res);

      // Assert
      expect(Project.find).toHaveBeenCalledWith({ 
        endDate: { $gte: mockCurrentDate } 
      });
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(mockActiveProjects);
    });

    test('Debe manejar proyectos con diferentes estados pero fecha válida', async () => {
      // Arrange
      const mockProjects = [
        {
          _id: '507f1f77bcf86cd799439014',
          name: 'Proyecto En Progreso',
          endDate: new Date('2025-12-31'),
          status: 'en progreso'
        },
        {
          _id: '507f1f77bcf86cd799439015',
          name: 'Proyecto Activo',
          endDate: new Date('2025-11-30'),
          status: 'activo'
        }
      ];

      Project.find.mockResolvedValue(mockProjects);

      // Act
      await getActiveProjects(req, res);

      // Assert
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(mockProjects);
    });
  });

  describe('Casos de error del servidor', () => {
    test('Debe retornar error 500 si hay un error en la base de datos', async () => {
      // Arrange
      const dbError = new Error('Database connection failed');
      Project.find.mockRejectedValue(dbError);

      // Spy en console.error para verificar que se registra el error
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();

      // Act
      await getActiveProjects(req, res);

      // Assert
      expect(Project.find).toHaveBeenCalledWith({ 
        endDate: { $gte: mockCurrentDate } 
      });
      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({ 
        message: 'Error en el servidor' 
      });
      expect(consoleSpy).toHaveBeenCalledWith(
        'Error al obtener los proyectos activos:', 
        dbError
      );

      // Limpiar spy
      consoleSpy.mockRestore();
    });

    test('Debe manejar errores de timeout de la base de datos', async () => {
      // Arrange
      const timeoutError = new Error('Operation timeout');
      Project.find.mockRejectedValue(timeoutError);

      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();

      // Act
      await getActiveProjects(req, res);

      // Assert
      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({ 
        message: 'Error en el servidor' 
      });
      expect(consoleSpy).toHaveBeenCalledWith(
        'Error al obtener los proyectos activos:', 
        timeoutError
      );

      consoleSpy.mockRestore();
    });

    test('Debe manejar errores de validación de MongoDB', async () => {
      // Arrange
      const validationError = new Error('Invalid query parameter');
      Project.find.mockRejectedValue(validationError);

      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();

      // Act
      await getActiveProjects(req, res);

      // Assert
      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({ 
        message: 'Error en el servidor' 
      });
      expect(consoleSpy).toHaveBeenCalledWith(
        'Error al obtener los proyectos activos:', 
        validationError
      );

      consoleSpy.mockRestore();
    });
  });

  describe('Verificación de consulta MongoDB', () => {    test('Debe usar la consulta correcta para filtrar proyectos activos', async () => {
      // Arrange
      Project.find.mockResolvedValue([]);

      // Act
      await getActiveProjects(req, res);

      // Assert
      expect(Project.find).toHaveBeenCalledTimes(1);
      expect(Project.find).toHaveBeenCalledWith({ 
        endDate: { $gte: mockCurrentDate } 
      });
      
      // Verificar que la fecha usada es la actual
      const callArgs = Project.find.mock.calls[0][0];
      expect(callArgs.endDate.$gte).toEqual(mockCurrentDate);
    });

    test('Debe llamar a Project.find solo una vez', async () => {
      // Arrange
      Project.find.mockResolvedValue([]);

      // Act
      await getActiveProjects(req, res);

      // Assert
      expect(Project.find).toHaveBeenCalledTimes(1);
    });
  });

  describe('Verificación de respuesta HTTP', () => {
    test('Debe retornar status 200 para respuesta exitosa', async () => {
      // Arrange
      Project.find.mockResolvedValue([]);

      // Act
      await getActiveProjects(req, res);

      // Assert
      expect(res.status).toHaveBeenCalledTimes(1);
      expect(res.status).toHaveBeenCalledWith(200);
    });

    test('Debe retornar los datos en formato JSON', async () => {
      // Arrange
      const mockData = [{ name: 'Test Project' }];
      Project.find.mockResolvedValue(mockData);

      // Act
      await getActiveProjects(req, res);

      // Assert
      expect(res.json).toHaveBeenCalledTimes(1);
      expect(res.json).toHaveBeenCalledWith(mockData);
    });
  });

  describe('Casos edge con fechas límite', () => {
    test('Debe incluir proyectos que terminan exactamente en la fecha actual', async () => {
      // Arrange
      const projectEndingToday = {
        _id: '507f1f77bcf86cd799439016',
        name: 'Proyecto Termina Hoy',
        endDate: mockCurrentDate, // Termina exactamente hoy
        status: 'activo'
      };

      Project.find.mockResolvedValue([projectEndingToday]);

      // Act
      await getActiveProjects(req, res);

      // Assert
      expect(Project.find).toHaveBeenCalledWith({ 
        endDate: { $gte: mockCurrentDate } 
      });
      expect(res.json).toHaveBeenCalledWith([projectEndingToday]);
    });

    test('Debe manejar proyectos con fechas muy lejanas en el futuro', async () => {
      // Arrange
      const futureProject = {
        _id: '507f1f77bcf86cd799439017',
        name: 'Proyecto Futuro Lejano',
        endDate: new Date('2030-12-31'),
        status: 'activo'
      };

      Project.find.mockResolvedValue([futureProject]);

      // Act
      await getActiveProjects(req, res);

      // Assert
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith([futureProject]);
    });
  });
});
