const swaggerJsdoc = require('swagger-jsdoc');

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Dicero API Documentation',
      version: '1.0.0',
      description: 'API Documentation cho dự án Boardgame Dicero',
    },
    servers: [
      {
        url: 'http://localhost:8080',
        description: 'Môi trường Local (Development)',
      },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
        },
      },
    },
  },
  // Khai báo đường dẫn trỏ tới các file Route để đọc docs
  apis: ['./src/routes/*.js'], 
};

const swaggerSpec = swaggerJsdoc(options);

module.exports = swaggerSpec;