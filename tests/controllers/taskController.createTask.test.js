// Mock de mongoose primero
jest.mock('mongoose', () => ({
  Schema: jest.fn().mockImplementation(() => ({
    pre: jest.fn(),
    set: jest.fn(),
    virtual: jest.fn(() => ({ get: jest.fn() }))
  })),
  model: jest.fn(),
  connect: jest.fn(),
  Types: {
    ObjectId: jest.fn()
  }
}));

// Mock del modelo Task ANTES de importar el controlador
jest.mock('../../models/Task', () => {
  const mockSave = jest.fn();
  const mockTask = jest.fn().mockImplementation((data) => {
    const taskInstance = { ...data, _id: '507f1f77bcf86cd799439011' };
    taskInstance.save = mockSave;
    return taskInstance;
  });
  
  // Adjuntar el método save al constructor para poder hacer assertions
  mockTask.mockSave = mockSave;
  
  return mockTask;
});

// Mock del modelo Notification
jest.mock('../../models/Notification', () => jest.fn());

const { createTask } = require('../../controllers/taskController');
const Task = require('../../models/Task');

describe('taskController - createTask', () => {
  let req, res;

  beforeEach(() => {
    // Configurar mocks de request y response
    req = {
      body: {}
    };

    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn()
    };

    // Limpiar mocks
    jest.clearAllMocks();
  });

  describe('Casos de éxito', () => {
    test('debe crear tarea exitosamente con datos válidos', async () => {
      // Arrange
      const taskData = {
        title: 'Tarea de prueba',
        description: 'Descripción de la tarea',
        estimatedHours: 5,
        project: '507f1f77bcf86cd799439022',
        status: 'pending',
        priority: 'medium',
        dueDate: new Date('2025-12-31')
      };

      req.body = taskData;

      const expectedTask = {
        ...taskData,
        _id: '507f1f77bcf86cd799439011'
      };      // Mock del save que resuelve exitosamente
      Task.mockSave.mockResolvedValue(expectedTask);

      // Act
      await createTask(req, res);

      // Assert
      expect(Task).toHaveBeenCalledWith(taskData);
      expect(Task.mockSave).toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
        _id: '507f1f77bcf86cd799439011',
        title: 'Tarea de prueba',
        description: 'Descripción de la tarea',
        estimatedHours: 5,
        project: '507f1f77bcf86cd799439022',
        status: 'pending',
        priority: 'medium'
      }));
    });

    test('debe crear tarea con datos mínimos requeridos', async () => {
      // Arrange
      const taskData = {
        title: 'Tarea mínima',
        description: 'Descripción básica',
        estimatedHours: 1,
        project: '507f1f77bcf86cd799439022'
      };      req.body = taskData;

      const expectedTask = {
        ...taskData,
        _id: '507f1f77bcf86cd799439011',
        status: 'pending', // default
        priority: 'medium' // default
      };

      Task.mockSave.mockResolvedValue(expectedTask);

      // Act
      await createTask(req, res);

      // Assert
      expect(Task).toHaveBeenCalledWith(taskData);
      expect(Task.mockSave).toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
        _id: '507f1f77bcf86cd799439011',
        title: 'Tarea mínima',
        description: 'Descripción básica',
        estimatedHours: 1,
        project: '507f1f77bcf86cd799439022'
      }));
    });

    test('debe crear tarea con assignedTo como array', async () => {
      // Arrange
      const taskData = {
        title: 'Tarea con asignados',
        description: 'Tarea asignada a múltiples usuarios',
        estimatedHours: 8,
        project: '507f1f77bcf86cd799439022',
        assignedTo: ['507f1f77bcf86cd799439033', '507f1f77bcf86cd799439034'],
        priority: 'high'
      };

      req.body = taskData;

      const expectedTask = {
        ...taskData,
        _id: '507f1f77bcf86cd799439011'
      };      Task.mockSave.mockResolvedValue(expectedTask);

      // Act
      await createTask(req, res);

      // Assert
      expect(Task).toHaveBeenCalledWith(taskData);
      expect(Task.mockSave).toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
        _id: '507f1f77bcf86cd799439011',
        title: 'Tarea con asignados',
        description: 'Tarea asignada a múltiples usuarios',
        estimatedHours: 8,
        project: '507f1f77bcf86cd799439022',
        assignedTo: ['507f1f77bcf86cd799439033', '507f1f77bcf86cd799439034'],
        priority: 'high'
      }));
    });
  });

  describe('Validaciones', () => {
    test('debe fallar cuando falta el título', async () => {
      // Arrange
      const taskData = {
        description: 'Sin título',
        estimatedHours: 2,
        project: '507f1f77bcf86cd799439022'
      };

      req.body = taskData;

      const validationError = new Error('Task validation failed: title: Path `title` is required.');
      validationError.name = 'ValidationError';
      Task.mockSave.mockRejectedValue(validationError);

      // Act
      await createTask(req, res);

      // Assert
      expect(Task).toHaveBeenCalledWith(taskData);
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({ 
        message: 'Task validation failed: title: Path `title` is required.' 
      });
    });

    test('debe fallar cuando falta la descripción', async () => {
      // Arrange
      const taskData = {
        title: 'Sin descripción',
        estimatedHours: 2,
        project: '507f1f77bcf86cd799439022'
      };

      req.body = taskData;

      const validationError = new Error('Task validation failed: description: Path `description` is required.');
      validationError.name = 'ValidationError';
      Task.mockSave.mockRejectedValue(validationError);

      // Act
      await createTask(req, res);

      // Assert
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({ 
        message: 'Task validation failed: description: Path `description` is required.' 
      });
    });

    test('debe fallar cuando falta el proyecto', async () => {
      // Arrange
      const taskData = {
        title: 'Sin proyecto',
        description: 'Tarea sin proyecto',
        estimatedHours: 2
      };

      req.body = taskData;

      const validationError = new Error('Task validation failed: project: Path `project` is required.');
      validationError.name = 'ValidationError';
      Task.mockSave.mockRejectedValue(validationError);

      // Act
      await createTask(req, res);

      // Assert
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({ 
        message: 'Task validation failed: project: Path `project` is required.' 
      });
    });

    test('debe fallar con estimatedHours inválidas (menos de 0.5)', async () => {
      // Arrange
      const taskData = {
        title: 'Horas inválidas',
        description: 'Tarea con horas negativas',
        estimatedHours: 0.2,
        project: '507f1f77bcf86cd799439022'
      };

      req.body = taskData;

      const validationError = new Error('Task validation failed: estimatedHours: Path `estimatedHours` (0.2) is less than minimum allowed value (0.5).');
      Task.mockSave.mockRejectedValue(validationError);

      // Act
      await createTask(req, res);

      // Assert
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({ 
        message: 'Task validation failed: estimatedHours: Path `estimatedHours` (0.2) is less than minimum allowed value (0.5).' 
      });
    });

    test('debe fallar con priority inválida', async () => {
      // Arrange
      const taskData = {
        title: 'Prioridad inválida',
        description: 'Tarea con prioridad incorrecta',
        estimatedHours: 3,
        project: '507f1f77bcf86cd799439022',
        priority: 'super-high' // valor no válido
      };

      req.body = taskData;

      const validationError = new Error('Task validation failed: priority: `super-high` is not a valid enum value for path `priority`.');
      Task.mockSave.mockRejectedValue(validationError);

      // Act
      await createTask(req, res);

      // Assert
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({ 
        message: 'Task validation failed: priority: `super-high` is not a valid enum value for path `priority`.' 
      });
    });

    test('debe fallar con status inválido', async () => {
      // Arrange
      const taskData = {
        title: 'Status inválido',
        description: 'Tarea con status incorrecto',
        estimatedHours: 2,
        project: '507f1f77bcf86cd799439022',
        status: 'invalid-status'
      };

      req.body = taskData;

      const validationError = new Error('Task validation failed: status: `invalid-status` is not a valid enum value for path `status`.');
      Task.mockSave.mockRejectedValue(validationError);

      // Act
      await createTask(req, res);

      // Assert
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({ 
        message: 'Task validation failed: status: `invalid-status` is not a valid enum value for path `status`.' 
      });
    });
  });

  describe('Manejo de errores', () => {
    test('debe manejar errores de base de datos', async () => {
      // Arrange
      const taskData = {
        title: 'Tarea válida',
        description: 'Error de BD',
        estimatedHours: 3,
        project: '507f1f77bcf86cd799439022'
      };

      req.body = taskData;

      const dbError = new Error('Database connection failed');
      Task.mockSave.mockRejectedValue(dbError);

      // Act
      await createTask(req, res);

      // Assert
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({ 
        message: 'Database connection failed' 
      });
    });

    test('debe manejar errores de duplicación', async () => {
      // Arrange
      const taskData = {
        title: 'Tarea duplicada',
        description: 'Misma tarea',
        estimatedHours: 2,
        project: '507f1f77bcf86cd799439022'
      };

      req.body = taskData;

      const duplicateError = new Error('E11000 duplicate key error');
      duplicateError.code = 11000;
      Task.mockSave.mockRejectedValue(duplicateError);

      // Act
      await createTask(req, res);

      // Assert
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({ 
        message: 'E11000 duplicate key error' 
      });
    });

    test('debe manejar ObjectId inválido en project', async () => {
      // Arrange
      const taskData = {
        title: 'ID inválido',
        description: 'Proyecto con ID inválido',
        estimatedHours: 1,
        project: 'invalid-object-id'
      };

      req.body = taskData;

      const castError = new Error('Cast to ObjectId failed for value "invalid-object-id" at path "project"');
      castError.name = 'CastError';
      Task.mockSave.mockRejectedValue(castError);

      // Act
      await createTask(req, res);

      // Assert
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({ 
        message: 'Cast to ObjectId failed for value "invalid-object-id" at path "project"' 
      });
    });
  });

  describe('Campos opcionales', () => {
    test('debe crear tarea con dueDate válida', async () => {
      // Arrange
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + 30);
      
      const taskData = {
        title: 'Tarea con fecha límite',
        description: 'Tarea programada',
        estimatedHours: 4,
        project: '507f1f77bcf86cd799439022',
        dueDate: futureDate
      };

      req.body = taskData;

      const expectedTask = {
        ...taskData,
        _id: '507f1f77bcf86cd799439011'
      };      Task.mockSave.mockResolvedValue(expectedTask);

      // Act
      await createTask(req, res);

      // Assert
      expect(Task).toHaveBeenCalledWith(taskData);
      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
        _id: '507f1f77bcf86cd799439011',
        title: 'Tarea con fecha límite',
        description: 'Tarea programada',
        estimatedHours: 4,
        project: '507f1f77bcf86cd799439022'
      }));
    });

    test('debe fallar con dueDate en el pasado', async () => {
      // Arrange
      const pastDate = new Date();
      pastDate.setDate(pastDate.getDate() - 1);
      
      const taskData = {
        title: 'Fecha pasada',
        description: 'Fecha límite inválida',
        estimatedHours: 2,
        project: '507f1f77bcf86cd799439022',
        dueDate: pastDate
      };

      req.body = taskData;

      const validationError = new Error('Task validation failed: dueDate: La fecha límite no puede estar en el pasado.');
      Task.mockSave.mockRejectedValue(validationError);

      // Act
      await createTask(req, res);

      // Assert
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({ 
        message: 'Task validation failed: dueDate: La fecha límite no puede estar en el pasado.' 
      });
    });
  });
});
