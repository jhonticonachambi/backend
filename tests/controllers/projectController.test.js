const mongoose = require('mongoose');
const { createProject, getAllProjects, getProjectByName } = require('../../controllers/projectController');
const Project = require('../../models/Project');

jest.mock('../../models/Project'); // Mock del modelo Project

describe('Controlador de Proyectos', () => {
    
  const originalConsoleError = console.error;

  beforeAll(() => {
    console.error = jest.fn(); // Mockear console.error
  });
  afterEach(() => {
    jest.clearAllMocks(); // Limpiar los mocks después de cada prueba
  });

  describe('createProject', () => {
    it('Debe devolver un error si falta el campo "organizer"', async () => {
      const req = { body: { name: 'Proyecto Test' } }; // No incluye el organizer
      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn(),
      };

      await createProject(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({ message: 'El ID del organizador es requerido' });
    });

    it('Debe crear un proyecto y devolverlo', async () => {
      const req = {
        body: {
          name: 'Proyecto Test',
          organizer: 'user123',
        },
      };
      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn(),
      };

      Project.mockImplementation(() => ({
        save: jest.fn().mockResolvedValue({ _id: 'project123', ...req.body }),
      }));

      await createProject(req, res);

      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith([{ _id: 'project123', ...req.body }]);
    });
  });

  describe('getAllProjects', () => {
    it('Debe devolver una lista de proyectos', async () => {
      const req = {};
      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn(),
      };

      const mockProjects = [
        { _id: 'project1', name: 'Proyecto 1' },
        { _id: 'project2', name: 'Proyecto 2' },
      ];

      Project.find.mockResolvedValue(mockProjects);

      await getAllProjects(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(mockProjects);
    });

    it('Debe devolver un error en caso de fallo del servidor', async () => {
      const req = {};
      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn(),
      };

      Project.find.mockRejectedValue(new Error('Error en el servidor'));

      await getAllProjects(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({ message: 'Error en el servidor' });
    });
  });

  describe('getProjectByName', () => {
    it('Debe devolver un proyecto por su nombre', async () => {
      const req = { params: { name: 'Proyecto-Test' } }; // Nombre con guión
      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn(),
      };

      const mockProject = { _id: 'project1', name: 'Proyecto Test' };

      Project.findOne.mockResolvedValue(mockProject);

      await getProjectByName(req, res);

      expect(Project.findOne).toHaveBeenCalledWith({ name: 'Proyecto Test' }); // Reemplazo de guiones
      expect(res.json).toHaveBeenCalledWith(mockProject);
    });

    it('Debe devolver un error si el proyecto no existe', async () => {
      const req = { params: { name: 'Proyecto-Inexistente' } };
      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn(),
      };

      Project.findOne.mockResolvedValue(null);

      await getProjectByName(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({ message: 'Proyecto no encontrado' });
    });
  });
});
