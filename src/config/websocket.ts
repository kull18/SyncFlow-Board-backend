import { WebSocketServer, WebSocket } from 'ws';
import { IncomingMessage } from 'http';
import jwt from 'jsonwebtoken';
import { JwtPayload, WsEvent } from '../types';

const clients = new Map<number, WebSocket>();

export const initWebSocket = (wss: WebSocketServer): void => {
  wss.on('connection', (ws: WebSocket, req: IncomingMessage) => {
    const url   = new URL(req.url!, `http://${req.headers.host}`);
    const token = url.searchParams.get('token');

    if (!token) { ws.close(1008, 'Token requerido'); return; }

    let payload: JwtPayload;
    try {
      payload = jwt.verify(token, process.env.JWT_SECRET!) as JwtPayload;
    } catch {
      ws.close(1008, 'Token inválido');
      return;
    }

    clients.set(payload.userId, ws);
    console.log(`🔌 Usuario ${payload.userId} conectado | Total: ${clients.size}`);

    ws.on('pong', () => {});
    ws.on('close', () => {
      clients.delete(payload.userId);
      console.log(`❌ Usuario ${payload.userId} desconectado | Total: ${clients.size}`);
    });
    ws.on('error', (err) => console.error(`WS error usuario ${payload.userId}:`, err.message));
  });

  setInterval(() => {
    clients.forEach((ws) => { if (ws.readyState === WebSocket.OPEN) ws.ping(); });
  }, 30_000);
};

export const broadcast = (event: WsEvent): void => {
  const message = JSON.stringify(event);
  clients.forEach((ws) => { if (ws.readyState === WebSocket.OPEN) ws.send(message); });
};