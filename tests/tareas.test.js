const mongoose = require('mongoose');
const taskController = require('../controllers/taskController');
const Task = require('../models/Task');

// Mock del modelo Task
jest.mock('../models/Task');

describe('Task Controller - createTask', () => {

  // Limpiar los mocks antes de cada prueba
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('debería retornar un error si falta algún campo requerido', async () => {
    // Simulamos la petición con un campo faltante (falta `project`)
    const mockRequest = {
      body: {
        title: 'Tarea de prueba',
        description: 'Descripción de la tarea de prueba',
        assignedTo: ['60f5f1b2d5d0a0f2a4f6c830'],
        // Falta `project`
      }
    };

    // Simulamos la respuesta (response)
    const mockResponse = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
    };

    // Simulamos que la función save() fallará por un error de validación
    Task.prototype.save = jest.fn().mockRejectedValue(new Error('Task validation failed'));

    // Ejecutamos el controlador
    await taskController.createTask(mockRequest, mockResponse);

    // Verificamos que el error haya sido manejado correctamente
    expect(mockResponse.status).toHaveBeenCalledWith(400); // Status de error 400
    expect(mockResponse.json).toHaveBeenCalledWith({ message: 'Task validation failed' }); // Mensaje de error
  });

});
