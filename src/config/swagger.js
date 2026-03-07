import process from 'process';
import swaggerJsdoc from 'swagger-jsdoc';

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'ProjectOS API Documentation',
      version: '1.0.0',
      description: 'API documentation for ProjectOS collaborative platform',
    },
    servers: [
      {
        url: `http://localhost:${process.env.PORT || 5001}`,
        description: 'Development server',
      },
    ],
    tags: [
      { name: 'Auth', description: 'Authentication and token management' },
      { name: 'Projects', description: 'Project management and member operations' },
      { name: 'Tasks', description: 'Task management within projects' },
      { name: 'Messages', description: 'Real-time chat message management' },
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
    security: [
      {
        bearerAuth: [],
      },
    ],
  },
  apis: ['./src/routes/*.js'], // Path to the API docs
};

const swaggerSpec = swaggerJsdoc(options);

export default swaggerSpec;
