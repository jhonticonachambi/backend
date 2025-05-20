const swaggerJsdoc = require('swagger-jsdoc');
const swaggerUi = require('swagger-ui-express');

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'API de SWII Backend',
      version: '1.0.0',
      description: 'Documentación de la API para el proyecto SWII Backend',
    },
    servers: [
      {
        url: 'https://fronted-five.vercel.app', // Cambia esto según tu entorno
      },
    ],
  },
  apis: ['./routes/*.js'], // Archivos donde se documentarán las rutas
};

const swaggerSpec = swaggerJsdoc(options);

const setupSwaggerDocs = (app) => {
  app.use('/docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));
};

module.exports = setupSwaggerDocs;
