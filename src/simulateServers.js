const express = require('express');
const config = require('./config/config');

function createServer(id, port, specialization = null) {
  const app = express();
  let serverLoad = 0;

  app.use(express.json());

  app.use((req, res, next) => {
    console.log(`[${id}] Received request: ${req.method} ${req.url}`);
    serverLoad = Math.min(100, serverLoad + 10); // Increase load with each request
    setTimeout(() => {
      serverLoad = Math.max(0, serverLoad - 5); // Gradually decrease load
    }, 1000);
    next();
  });

  app.get('/health', (req, res) => {
    res.json({ id, load: serverLoad, specialization });
  });

  app.get('/', (req, res) => {
    simulateResponse(res, () => res.send(`Hello from ${id}`));
  });

  app.get('/api/users', (req, res) => {
    simulateResponse(res, () => res.json([{ id: 1, name: 'John Doe' }, { id: 2, name: 'Jane Doe' }]));
  });

  app.post('/api/data', (req, res) => {
    simulateResponse(res, () => res.status(201).json({ message: 'Data received', data: req.body }));
  });

  app.get('/api/heavy', (req, res) => {
    simulateResponse(res, () => res.json({ result: 'Heavy operation completed' }), 1000, 3000);
  });

  app.get('/api/error', (req, res) => {
    simulateResponse(res, () => res.status(500).json({ error: 'Internal Server Error' }));
  });

  app.listen(port, () => {
    console.log(`${id} is running on http://localhost:${port}`);
  });
}

function simulateResponse(res, sendResponse, minDelay = 10, maxDelay = 500) {
  const delay = Math.floor(Math.random() * (maxDelay - minDelay + 1) + minDelay);
  setTimeout(() => {
    sendResponse();
  }, delay);
}

const servers = [
  { id: 'server1', port: 3001, specialization: 'general' },
  { id: 'server2', port: 3002, specialization: 'users' },
  { id: 'server3', port: 3003, specialization: 'data' },
  { id: 'server4', port: 3004, specialization: 'heavy' },
  { id: 'server5', port: 3005, specialization: 'error' }
];

servers.forEach(server => createServer(server.id, server.port, server.specialization));

console.log('All simulated servers are running.');