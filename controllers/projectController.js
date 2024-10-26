// controllers/projectController.js
const mongoose = require('mongoose');
const Project = require('../models/Project');
const { validationResult } = require('express-validator'); // Asegúrate de que esta línea esté presente

// // // Crear un nuevo proyecto
// // Crear un nuevo proyecto
// exports.createProject = async (req, res) => {
//   const errors = validationResult(req);
//   if (!errors.isEmpty()) {
//     return res.status(400).json({ errors: errors.array() });
//   }

//   // Verificar si es un array o un solo objeto
//   const projects = Array.isArray(req.body) ? req.body : [req.body]; 

//   try {
//     const createdProjects = [];

//     // Recorrer cada proyecto en el array
//     for (const projectData of projects) {
//       const {
//         name,
//         description,
//         requirements,
//         type,
//         startDate,
//         endDate,
//         volunteersRequired,
//         projectType,
//         bannerImage, // Agregar el campo bannerImage
//         organizer // Agregar el campo organizer
//       } = projectData;

//       // Crear un nuevo proyecto
//       const project = new Project({
//         name,
//         description,
//         requirements,
//         type,
//         startDate,
//         endDate,
//         volunteersRequired,
//         projectType,
//         bannerImage,  // Incluir bannerImage en el modelo
//         organizer
//       });

//       // Guardar el proyecto en la base de datos
//       const savedProject = await project.save();
//       createdProjects.push(savedProject);
//     }

//     res.status(201).json(createdProjects); // Retornar todos los proyectos creados
//   } catch (error) {
//     console.error('Error al crear los proyectos:', error);
//     res.status(500).json({ message: 'Error en el servidor' });
//   }
// };


exports.createProject = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  // Verificar si es un array o un solo objeto
  const projects = Array.isArray(req.body) ? req.body : [req.body]; 

  try {
    const createdProjects = [];

    for (const projectData of projects) {
      const {
        name,
        description,
        requirements,
        type,
        startDate,
        endDate,
        volunteersRequired,
        projectType,
        bannerImage,
        organizer,  // Obtener el ID del organizador del cuerpo de la solicitud
      } = projectData;

      // Validar que el organizer no esté vacío
      if (!organizer) {
        return res.status(400).json({ message: 'El ID del organizador es requerido' });
      }

      // Crear un nuevo proyecto
      const project = new Project({
        name,
        description,
        requirements,
        type,
        startDate,
        endDate,
        volunteersRequired,
        projectType,
        bannerImage,
        organizer, // Usar el ID del organizador del cuerpo de la solicitud
      });

      const savedProject = await project.save();
      createdProjects.push(savedProject);
    }

    res.status(201).json(createdProjects);
  } catch (error) {
    console.error('Error al crear los proyectos:', error);
    res.status(500).json({ message: 'Error en el servidor' });
  }
};




// exports.createProject = async (req, res) => {
//   const errors = validationResult(req);
//   if (!errors.isEmpty()) {
//     return res.status(400).json({ errors: errors.array() });
//   }

//   // Verificar si es un array o un solo objeto
//   const projects = Array.isArray(req.body) ? req.body : [req.body]; 

//   try {
//     const createdProjects = [];

//     // Recorrer cada proyecto en el array
//     for (const projectData of projects) {
//       const {
//         name,
//         description,
//         requirements,
//         type,
//         startDate,
//         endDate,
//         volunteersRequired,
//         projectType,
//         bannerImage // Agregar el campo bannerImage
//       } = projectData;

//       // Crear un nuevo proyecto
//       const project = new Project({
//         name,
//         description,
//         requirements,
//         type,
//         startDate,
//         endDate,
//         volunteersRequired,
//         projectType,
//         bannerImage  // Incluir bannerImage en el modelo
//       });

//       // Guardar el proyecto en la base de datos
//       const savedProject = await project.save();
//       createdProjects.push(savedProject);
//     }

//     res.status(201).json(createdProjects); // Retornar todos los proyectos creados
//   } catch (error) {
//     console.error('Error al crear los proyectos:', error);
//     res.status(500).json({ message: 'Error en el servidor' });
//   }
// };


// Obtener todos los proyectos
exports.getAllProjects = async (req, res) => {
  try {
    const projects = await Project.find(); // Encuentra todos los proyectos en la colección
    res.status(200).json(projects); // Devuelve los proyectos con un código de estado 200
  } catch (error) {
    console.error('Error al obtener los proyectos:', error);
    res.status(500).json({ message: 'Error en el servidor' }); // Maneja cualquier error que ocurra
  }
};

// Obtener un proyecto por nombre (reemplaza guiones por espacios para coincidir con el nombre en la BD)
exports.getProjectByName = async (req, res) => {
  const { name } = req.params;

  try {
    // Reemplaza los guiones en la URL por espacios para coincidir con el formato en la base de datos
    const formattedName = name.replace(/-/g, ' ');
    const project = await Project.findOne({ name: formattedName });
    
    if (!project) return res.status(404).json({ message: 'Proyecto no encontrado' });

    res.json(project);
  } catch (error) {
    console.error('Error al obtener el proyecto:', error);
    res.status(500).json({ message: 'Error en el servidor' });
  }
};


exports.getProjectById = async (req, res) => {
  const { id } = req.params;

  // Validar si el ID es válido
  if (!mongoose.Types.ObjectId.isValid(id)) {
    return res.status(400).json({ message: 'ID no válido' });
  }

  try {
    const project = await Project.findById(id)
      .populate('applicants', 'name')
      .populate('feedback.userId', 'name');

    if (!project) {
      return res.status(404).json({ message: 'Proyecto no encontrado' });
    }

    res.json(project);
  } catch (error) {
    console.error('Error al obtener el proyecto:', error);
    res.status(500).json({ message: 'Error en el servidor' });
  }
};


// Postularse a un proyecto
exports.applyToProject = async (req, res) => {
  const { projectId } = req.params;
  const userId = req.user.id; // Suponiendo que estás usando middleware de autenticación para obtener el usuario

  try {
    const project = await Project.findById(projectId);
    if (!project) return res.status(404).json({ message: 'Proyecto no encontrado' });

    // Verificar si el usuario ya se postuló
    if (project.applicants.includes(userId)) {
      return res.status(400).json({ message: 'Ya te postulaste a este proyecto' });
    }

    project.applicants.push(userId);
    await project.save();
    res.status(200).json({ message: 'Postulación exitosa', project });
  } catch (error) {
    console.error('Error al postularse al proyecto:', error);
    res.status(500).json({ message: 'Error en el servidor' });
  }
};

// Agregar retroalimentación al proyecto
exports.addFeedback = async (req, res) => {
  const { projectId } = req.params;
  const { message } = req.body;
  const userId = req.user.id;

  try {
    const project = await Project.findById(projectId);
    if (!project) return res.status(404).json({ message: 'Proyecto no encontrado' });

    // Verificar si el mensaje de retroalimentación no está vacío
    if (!message || message.trim().length === 0) {
      return res.status(400).json({ message: 'El mensaje de retroalimentación no puede estar vacío' });
    }

    project.feedback.push({ userId, message });
    await project.save();
    res.status(200).json({ message: 'Retroalimentación agregada', project });
  } catch (error) {
    console.error('Error al agregar retroalimentación:', error);
    res.status(500).json({ message: 'Error en el servidor' });
  }
};

// Actualizar un proyecto por ID
exports.updateProject = async (req, res) => {
  const { id } = req.params;
  const updates = req.body; // Obtiene los datos que se van a actualizar

  try {
    // Encuentra el proyecto por ID y actualízalo
    const project = await Project.findByIdAndUpdate(id, updates, { new: true, runValidators: true });
    
    if (!project) return res.status(404).json({ message: 'Proyecto no encontrado' });

    res.json({ message: 'Proyecto actualizado', project });
  } catch (error) {
    console.error('Error al actualizar el proyecto:', error);
    res.status(500).json({ message: 'Error en el servidor' });
  }
};

