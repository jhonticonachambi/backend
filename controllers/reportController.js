// controllers/reportController.js
const { createCanvas } = require('canvas');
const PDFDocument = require('pdfkit');
const fs = require('fs');
const path = require('path');
const Project = require('../models/Project');
const Postulacion = require('../models/Postulation');
const Task = require('../models/Task');

const calculateDaysRemaining = (endDate) => {
    const today = new Date();
    const end = new Date(endDate);
    const diffTime = end - today;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)); // Convierte el tiempo en días
    return diffDays >= 0 ? diffDays : 0; // Si el tiempo es negativo, devolvemos 0
  };

// Crear la carpeta 'reports' si no existe
const reportsDir = path.join(__dirname, '..', 'reports');
if (!fs.existsSync(reportsDir)) {
    fs.mkdirSync(reportsDir);
}

// Función para generar un nombre aleatorio para el archivo
function generateRandomFileName() {
    const randomNum = Math.floor(Math.random() * 1000000); // Genera un número aleatorio
    return `report-${randomNum}.pdf`; // Nombre de archivo en formato report-xxxxx.pdf
}

// Función para dibujar una tabla con bordes
function drawTable(doc, startX, startY, headers, rows) {
    const cellPadding = 5;
    const rowHeight = 20;
    const columnWidth = [250, 250]; // Primera columna mucho más grande (450px) y la segunda más pequeña (150px)

    // Dibuja los encabezados de la tabla
    doc.fontSize(10);
    for (let i = 0; i < headers.length; i++) {
        const x = startX + columnWidth[i] * i;
        doc.rect(x, startY, columnWidth[i], rowHeight).stroke();
        doc.text(headers[i], x + cellPadding, startY + cellPadding);
    }

    // Dibuja las filas de la tabla
    for (let rowIndex = 0; rowIndex < rows.length; rowIndex++) {
        const row = rows[rowIndex];
        const y = startY + (rowIndex + 1) * rowHeight;

        for (let colIndex = 0; colIndex < row.length; colIndex++) {
            const x = startX + columnWidth[colIndex] * colIndex;
            doc.rect(x, y, columnWidth[colIndex], rowHeight).stroke();
            doc.text(row[colIndex], x + cellPadding, y + cellPadding);
        }
    }
}
// Controlador para mostrar detalles
const getAllProjectsWithDetails = async (req, res) => {
    try {
      // Obtén todos los proyectos
      const projects = await Project.find();
  
      // Para cada proyecto, agregamos los datos requeridos
      const detailedProjects = await Promise.all(projects.map(async (project) => {
        // Obtener miembros postulados al proyecto
        const members = await Postulacion.find({ projectId: project._id, status: 'accepted' }).populate('userId');
  
        // Obtener las tareas del proyecto
        const tasks = await Task.find({ project: project._id });
  
        // Calcular el número de tareas completadas
        const completedTasks = tasks.filter(task => task.status === 'completed').length;
  
        // Calcular los días restantes
        const daysRemaining = calculateDaysRemaining(project.endDate);
  
        // Construir un objeto con los datos adicionales para el proyecto
        return {
          ...project.toObject(),
          members: members.length, // Número de miembros aceptados
          tasks: tasks.length, // Número total de tareas
          completedTasks, // Número de tareas completadas
          daysRemaining, // Días restantes hasta el final del proyecto
        };
      }));
  
      res.status(200).json(detailedProjects); // Devuelve los proyectos detallados
    } catch (error) {
      console.error('Error al obtener los proyectos:', error);
      res.status(500).json({ message: 'Error en el servidor' });
    }
  };
// Controlador para generar el reporte
const generateReport = async (req, res) => {
    const projectId = req.params.id; // ID del proyecto que se pasa por parámetro

    try {
        // Buscar el proyecto
        const project = await Project.findById(projectId).populate('organizer');
        if (!project) {
            return res.status(404).send('Proyecto no encontrado');
        }

        // Buscar las postulaciones relacionadas con el proyecto
        const postulaciones = await Postulacion.find({ projectId: projectId }).populate('userId');

        // Buscar las tareas relacionadas con el proyecto
        const tasks = await Task.find({ project: projectId });

        // Crear un nombre aleatorio para el archivo PDF
        const fileName = generateRandomFileName();
        const filePath = path.join(reportsDir, fileName);

        // Crear el documento PDF
        const doc = new PDFDocument();

        // Enviar el archivo como un Blob al frontend
        const buffers = [];
        doc.on('data', buffers.push.bind(buffers));
        doc.on('end', () => {
            const pdfBuffer = Buffer.concat(buffers);
            res.contentType('application/pdf');
            res.send(pdfBuffer);  // Enviar el archivo PDF como respuesta
        });

        // Agregar título
        doc.fontSize(18).text(`Reporte para el proyecto: ${project.name}`, { align: 'center' });
        doc.moveDown();

        // Información del proyecto (con más espacio y mejor formato)
        doc.fontSize(12).text(`Descripción:`, { underline: true });
        doc.text(`${project.description}`);
        doc.moveDown();

        doc.fontSize(12).text(`Requisitos:`, { underline: true });
        doc.text(`${project.requirements}`);
        doc.moveDown();

        doc.fontSize(12).text(`Fecha de inicio:`, { underline: true });
        doc.text(`${project.startDate.toLocaleDateString()}`);
        doc.moveDown();

        doc.fontSize(12).text(`Fecha de fin:`, { underline: true });
        doc.text(`${project.endDate.toLocaleDateString()}`);
        doc.moveDown();

        doc.fontSize(12).text(`Voluntarios requeridos:`, { underline: true });
        doc.text(`${project.volunteersRequired}`);
        doc.moveDown();

        doc.fontSize(12).text(`Organizador:`, { underline: true });
        doc.text(`${project.organizer.name}`);
        doc.moveDown();

        doc.fontSize(12).text(`Correo del organizador:`, { underline: true });
        doc.text(`${project.organizer.email}`);
        doc.moveDown();

        // Agregar tabla para las postulaciones
        doc.text('Postulaciones:', { underline: true });
        doc.moveDown();

        // Definir las cabeceras y filas de la tabla de postulaciones
        const postulacionesHeaders = ['Nombre del postulante', 'Estado'];
        const postulacionesRows = postulaciones.map(postulacion => [postulacion.userId.name, postulacion.status]);

        // Dibujar la tabla de postulaciones
        drawTable(doc, 100, doc.y, postulacionesHeaders, postulacionesRows);
        doc.moveDown();

        // Agregar tareas
        doc.fontSize(12).text(`Tareas relacionadas:`, { underline: true });
        doc.moveDown();

        // Definir las cabeceras y filas de la tabla de tareas
        const tasksHeaders = ['Descripción de la tarea', 'Estado'];
        const tasksRows = tasks.map(task => [task.description, task.status]);

        // Dibujar la tabla de tareas
        drawTable(doc, 100, doc.y, tasksHeaders, tasksRows);

        // Finalizar el documento PDF
        doc.end();
    } catch (error) {
        console.error('Error al generar el reporte:', error);
        res.status(500).send('Error al generar el reporte');
    }
};

module.exports = {getAllProjectsWithDetails,generateReport};
