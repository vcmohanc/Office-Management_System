import { EventEmitter } from 'events';

export const caseEvents = new EventEmitter();

let clients = [];

const CASE_BROADCAST_ROLES = ['admin', 'account', 'support'];

export const sseHandler = (req, res) => {
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
  res.setHeader('Referrer-Policy', 'no-referrer');
  res.setHeader('Connection', 'keep-alive');
  res.setHeader('X-Accel-Buffering', 'no');

  res.write(': connected\n\n');

  const clientId = Date.now();

  const newClient = {
    id: clientId,
    res,
    role: req.user?.role || ''
  };

  clients.push(newClient);

  // Heartbeat ping every 20 seconds to prevent reverse-proxy / Nginx timeouts
  const heartbeat = setInterval(() => {
    try {
      res.write(': ping\n\n');
    } catch {
      clearInterval(heartbeat);
    }
  }, 20000);

  req.on('close', () => {
    clearInterval(heartbeat);
    clients = clients.filter(client => client.id !== clientId);
  });
};

const safeBroadcast = (eventName, data) => {
  const payload = `event: ${eventName}\ndata: ${JSON.stringify(data)}\n\n`;
  clients
    .filter(c => CASE_BROADCAST_ROLES.includes(c.role))
    .forEach(client => {
      try {
        client.res.write(payload);
      } catch (err) {
        console.error(`Error sending SSE event ${eventName} to client ${client.id}:`, err);
      }
    });
};

caseEvents.on('CASE_REGISTERED', (data) => {
  safeBroadcast('CASE_REGISTERED', data);
});

caseEvents.on('CASE_UPDATED', (data) => {
  safeBroadcast('CASE_UPDATED', data);
});
