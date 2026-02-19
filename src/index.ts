import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import http from 'http';
import { WebSocketServer } from 'ws';

import { testConnection } from './config/database';
import { initWebSocket } from './config/websocket';
import { authRouter }  from './routes/auth.routes';
import { tasksRouter } from './routes/task.routes';
import { usersRouter } from './routes/user.routes';


//regiber requirements xD

const app    = express();
const server = http.createServer(app);
const wss    = new WebSocketServer({ server });

app.use(cors());
app.use(express.json());

app.use('/api/auth',  authRouter);
app.use('/api/tasks', tasksRouter);
app.use('/api/users', usersRouter);

app.get('/health', (_req, res) => res.json({ status: 'ok' }));

initWebSocket(wss);

const PORT = Number(process.env.PORT) || 3000;

testConnection().then(() => {
  server.listen(PORT, () => {
    console.log(`Servidor corriendo en http://localhost:${PORT}`);
    console.log(`WebSocket disponible en ws://localhost:${PORT}`);
  });
});