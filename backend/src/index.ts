import express from 'express';
import cors from 'cors';
import mcpConfigRouter from './routes/mcpConfig';
import designSystemRouter from './routes/designSystem';
import componentRouter from './routes/component';
import designRouter from './routes/design';
import codeRouter from './routes/code';
import swaggerUi from 'swagger-ui-express';
import swaggerJSDoc from 'swagger-jsdoc';
import { connectMongo } from './db/mongo';

const app = express();
const port = process.env.PORT || 3001;

const swaggerOptions = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'AutoKit API',
      version: '1.0.0',
      description: 'AutoKit 设计系统自动化工具后端API文档'
    },
    servers: [
      { url: 'http://localhost:' + port }
    ]
  },
  apis: ['./src/routes/*.ts']
};
const swaggerSpec = swaggerJSDoc(swaggerOptions);

app.use(cors());
app.use(express.json());

app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

app.use('/api/mcp-config', mcpConfigRouter);
app.use('/api/design-system', designSystemRouter);
app.use('/api/component', componentRouter);
app.use('/api/design', designRouter);
app.use('/api/code', codeRouter);

app.get('/', (req, res) => {
  res.send('AutoKit Backend API Running');
});

(async () => {
  await connectMongo();
  app.listen(port, () => {
    console.log(`AutoKit backend listening on port ${port}`);
    console.log(`Swagger API docs available at http://localhost:${port}/api-docs`);
  });
})(); 