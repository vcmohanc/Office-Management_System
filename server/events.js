import { EventEmitter } from 'events';

export const caseEvents = new EventEmitter();

let clients = [];

const CASE_BROADCAST_ROLES = ['admin', 'account', 'support'];

export const sseHandler = (req, res) => {
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
  res.setHeader('Referrer-Policy', 'no-referrer');
  res.setHeader('Connection', 'keep-alive');

  res.write(': connected\n\n');

  const clientId = Date.now();

  const newClient = {
    id: clientId,
    res,
    role: req.user?.role || ''
  };

  clients.push(newClient);

  req.on('close', () => {
    clients = clients.filter(client => client.id !== clientId);
  });
};

caseEvents.on('CASE_REGISTERED', (data) => {
  clients
    .filter(c => CASE_BROADCAST_ROLES.includes(c.role))
    .forEach(client => {
      client.res.write(`event: CASE_REGISTERED\ndata: ${JSON.stringify(data)}\n\n`);
    });
});

caseEvents.on('CASE_UPDATED', (data) => {
  clients
    .filter(c => CASE_BROADCAST_ROLES.includes(c.role))
    .forEach(client => {
      client.res.write(`event: CASE_UPDATED\ndata: ${JSON.stringify(data)}\n\n`);
    });
});
