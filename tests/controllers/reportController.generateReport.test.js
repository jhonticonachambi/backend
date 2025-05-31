const { generateReport } = require('../../controllers/reportController');

// Mock de mongoose primero
jest.mock('mongoose', () => ({
  Schema: {
    Types: {
      ObjectId: jest.fn()
    }
  },
  Types: {
    ObjectId: jest.fn((id) => id)
  },
  model: jest.fn(),
  connect: jest.fn()
}));

// Mock de modelos ANTES de importar el controlador
jest.mock('../../models/Project', () => ({
  findById: jest.fn(),
  aggregate: jest.fn(),
  find: jest.fn()
}));

jest.mock('../../models/Postulation', () => ({
  find: jest.fn(),
  aggregate: jest.fn()
}));

jest.mock('../../models/Task', () => ({
  find: jest.fn()
}));

// Mock de PDFKit
const mockPDFDoc = {
  fontSize: jest.fn().mockReturnThis(),
  text: jest.fn().mockReturnThis(),
  moveDown: jest.fn().mockReturnThis(),
  pipe: jest.fn().mockReturnThis(),
  end: jest.fn().mockReturnThis(),
  on: jest.fn(),
  font: jest.fn().mockReturnThis(),
  fillColor: jest.fn().mockReturnThis(),
  rect: jest.fn().mockReturnThis(),
  fill: jest.fn().mockReturnThis(),
  save: jest.fn().mockReturnThis(),
  restore: jest.fn().mockReturnThis(),
  lineWidth: jest.fn().mockReturnThis(),
  moveTo: jest.fn().mockReturnThis(),
  lineTo: jest.fn().mockReturnThis(),
  stroke: jest.fn().mockReturnThis()
};

jest.mock('pdfkit', () => {
  return jest.fn().mockImplementation(() => mockPDFDoc);
});

// Importar después de los mocks
const Project = require('../../models/Project');
const Postulacion = require('../../models/Postulation');
const Task = require('../../models/Task');
const PDFDocument = require('pdfkit');
const mongoose = require('mongoose');

describe('reportController - generateReport', () => {
  let req, res;
  beforeEach(() => {
    req = {
      params: { id: '507f1f77bcf86cd799439011' },
      body: {}
    };

    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
      setHeader: jest.fn(),
      end: jest.fn(),
      send: jest.fn(),
      contentType: jest.fn()
    };
    
    jest.clearAllMocks();
  });

  describe('Casos de éxito', () => {    test('debe generar reporte PDF exitosamente', async () => {
      // Mock de datos del proyecto
      const mockProject = {
        _id: '507f1f77bcf86cd799439011',
        name: 'Proyecto Test',
        description: 'Descripción del proyecto',
        requirements: 'Requisitos del proyecto',
        startDate: new Date('2023-01-01'),
        endDate: new Date('2023-12-31'),
        volunteersRequired: 5,
        budget: 100000,
        organizer: { _id: 'organizer1', name: 'Organizador Test' }
      };
      
      const mockPostulations = [
        { 
          _id: 'post1',
          userId: { _id: 'user1', name: 'Usuario 1', email: 'user1@test.com' },
          status: 'aceptada',
          created_at: new Date('2023-01-15')
        }
      ];

      const mockTasks = [
        {
          _id: 'task1',
          title: 'Tarea 1',
          description: 'Descripción tarea 1',
          due_date: new Date('2023-06-01'),
          status: 'completada'
        }
      ];

      // Configurar mocks
      Project.findById.mockReturnValue({
        populate: jest.fn().mockResolvedValue(mockProject)
      });
      
      Postulacion.find.mockReturnValue({
        populate: jest.fn().mockResolvedValue(mockPostulations)
      });
      
      Task.find.mockResolvedValue(mockTasks);      // Simular eventos de PDF
      mockPDFDoc.on.mockImplementation((event, callback) => {
        if (event === 'data') {
          // Simular múltiples eventos de data
          setTimeout(() => callback(Buffer.from('test-chunk-1')), 0);
          setTimeout(() => callback(Buffer.from('test-chunk-2')), 5);
        }
        if (event === 'end') {
          // Ejecutar después de los eventos data
          setTimeout(() => callback(), 10);
        }
        return mockPDFDoc;
      });await generateReport(req, res);
      
      // Esperar a que se ejecuten los eventos asincrónicos
      await new Promise(resolve => setTimeout(resolve, 50));
      
      expect(Project.findById).toHaveBeenCalledWith('507f1f77bcf86cd799439011');
      expect(res.contentType).toHaveBeenCalledWith('application/pdf');
      expect(res.send).toHaveBeenCalledWith(expect.any(Buffer));
    });    test('debe manejar proyecto sin postulaciones', async () => {
      const mockProject = {
        _id: '507f1f77bcf86cd799439011',
        name: 'Proyecto Sin Postulaciones',
        description: 'Proyecto de prueba',
        requirements: 'Requisitos básicos',
        startDate: new Date('2023-01-01'),
        endDate: new Date('2023-12-31'),
        volunteersRequired: 3,
        organizer: { name: 'Organizador Test' }
      };

      Project.findById.mockReturnValue({
        populate: jest.fn().mockResolvedValue(mockProject)
      });
      
      Postulacion.find.mockReturnValue({
        populate: jest.fn().mockResolvedValue([])
      });
      
      Task.find.mockResolvedValue([]);

      mockPDFDoc.on.mockImplementation((event, callback) => {
        if (event === 'end') setTimeout(() => callback(), 10);
        if (event === 'data') setTimeout(() => callback(Buffer.from('test')), 5);
        return mockPDFDoc;
      });

      await generateReport(req, res);

      expect(Postulacion.find).toHaveBeenCalledWith({ projectId: '507f1f77bcf86cd799439011' });
      expect(PDFDocument).toHaveBeenCalled();
    });
  });

  describe('Validaciones', () => {
    test('debe retornar error 404 si proyecto no existe', async () => {
      Project.findById.mockReturnValue({
        populate: jest.fn().mockResolvedValue(null)
      });

      await generateReport(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.send).toHaveBeenCalledWith('Proyecto no encontrado');
    });
  });

  describe('Manejo de errores', () => {
    test('debe manejar errores de base de datos del proyecto', async () => {
      Project.findById.mockReturnValue({
        populate: jest.fn().mockRejectedValue(new Error('Error de BD proyecto'))
      });

      await generateReport(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.send).toHaveBeenCalledWith('Error al generar el reporte');
    });    test('debe manejar errores al obtener postulaciones', async () => {
      const mockProject = {
        _id: '507f1f77bcf86cd799439011',
        name: 'Test Project',
        description: 'Test description',
        requirements: 'Test requirements',
        startDate: new Date('2023-01-01'),
        endDate: new Date('2023-12-31'),
        volunteersRequired: 2,
        organizer: { name: 'Organizador' }
      };

      Project.findById.mockReturnValue({
        populate: jest.fn().mockResolvedValue(mockProject)
      });
      
      Postulacion.find.mockReturnValue({
        populate: jest.fn().mockRejectedValue(new Error('Error postulaciones'))
      });

      await generateReport(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.send).toHaveBeenCalledWith('Error al generar el reporte');
    });    test('debe manejar errores de generación PDF', async () => {
      const mockProject = {
        _id: '507f1f77bcf86cd799439011',
        name: 'Test Project',
        description: 'Test description',
        requirements: 'Test requirements',
        startDate: new Date('2023-01-01'),
        endDate: new Date('2023-12-31'),
        volunteersRequired: 2,
        organizer: { name: 'Organizador' }
      };

      Project.findById.mockReturnValue({
        populate: jest.fn().mockResolvedValue(mockProject)
      });
      
      Postulacion.find.mockReturnValue({
        populate: jest.fn().mockResolvedValue([])
      });
      
      Task.find.mockResolvedValue([]);

      // Simular error en PDFDocument constructor
      PDFDocument.mockImplementationOnce(() => {
        throw new Error('Error al crear PDF');
      });

      await generateReport(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.send).toHaveBeenCalledWith('Error al generar el reporte');
    });
  });

  describe('Funcionalidad PDF', () => {    test('debe configurar headers PDF correctamente', async () => {
      const mockProject = {
        _id: '507f1f77bcf86cd799439011',
        name: 'Test Project',
        description: 'Test description',
        requirements: 'Test requirements',
        startDate: new Date('2023-01-01'),
        endDate: new Date('2023-12-31'),
        volunteersRequired: 2,
        organizer: { name: 'Organizador' },
        budget: 10000
      };

      Project.findById.mockReturnValue({
        populate: jest.fn().mockResolvedValue(mockProject)
      });
      
      Postulacion.find.mockReturnValue({
        populate: jest.fn().mockResolvedValue([])
      });
      
      Task.find.mockResolvedValue([]);      mockPDFDoc.on.mockImplementation((event, callback) => {
        if (event === 'data') {
          setTimeout(() => callback(Buffer.from('test-chunk-1')), 0);
          setTimeout(() => callback(Buffer.from('test-chunk-2')), 5);
        }
        if (event === 'end') {
          setTimeout(() => callback(), 10);
        }
        return mockPDFDoc;
      });await generateReport(req, res);
      
      // Esperar a que se ejecuten los eventos asincrónicos
      await new Promise(resolve => setTimeout(resolve, 50));
      
      expect(res.contentType).toHaveBeenCalledWith('application/pdf');
      expect(res.send).toHaveBeenCalledWith(expect.any(Buffer));
      expect(mockPDFDoc.end).toHaveBeenCalled();
    });    test('debe llamar métodos de formateo de PDF', async () => {
      const mockProject = {
        _id: '507f1f77bcf86cd799439011',
        name: 'Test Project',
        description: 'Test Description',
        requirements: 'Test requirements',
        startDate: new Date('2023-01-01'),
        endDate: new Date('2023-12-31'),
        volunteersRequired: 3,
        organizer: { name: 'Organizador' },
        budget: 10000
      };

      Project.findById.mockReturnValue({
        populate: jest.fn().mockResolvedValue(mockProject)
      });
      
      Postulacion.find.mockReturnValue({
        populate: jest.fn().mockResolvedValue([])
      });
      
      Task.find.mockResolvedValue([]);

      mockPDFDoc.on.mockImplementation((event, callback) => {
        if (event === 'end') setTimeout(() => callback(), 10);
        return mockPDFDoc;
      });

      await generateReport(req, res);

      expect(mockPDFDoc.fontSize).toHaveBeenCalled();
      expect(mockPDFDoc.text).toHaveBeenCalled();
      expect(mockPDFDoc.moveDown).toHaveBeenCalled();
    });
  });
});