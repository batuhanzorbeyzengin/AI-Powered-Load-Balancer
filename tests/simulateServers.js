const express = require('express');
const app = express();
const port = 3000;

const serverConfig = {
  id: process.env.SERVER_ID,
  cpu: {
    cores: parseInt(process.env.CPU_CORES),
    speed: parseFloat(process.env.CPU_SPEED)
  },
  ram: parseInt(process.env.RAM),
  storage: parseInt(process.env.STORAGE),
  networkBandwidth: parseInt(process.env.NETWORK_BANDWIDTH),
  reliability: parseFloat(process.env.RELIABILITY)
};

let serverLoad = 0;
let activeConnections = 0;

app.use(express.json());

app.use((req, res, next) => {
  console.log(`[${serverConfig.id}] Received request: ${req.method} ${req.url}`);
  activeConnections++;
  serverLoad = Math.min(100, serverLoad + (100 / serverConfig.cpu.cores));
  setTimeout(() => {
    serverLoad = Math.max(0, serverLoad - (50 / serverConfig.cpu.cores));
    activeConnections--;
  }, 1000);
  next();
});

app.get('/health', (req, res) => {
  res.json({
    id: serverConfig.id,
    status: serverLoad < 80 ? 'healthy' : 'overloaded',
    load: serverLoad,
    activeConnections,
    cpu: serverConfig.cpu,
    ram: serverConfig.ram,
    storage: serverConfig.storage,
    networkBandwidth: serverConfig.networkBandwidth
  });
});

app.get('/', (req, res) => {
  simulateResponse(res, () => res.send(`Hello from ${serverConfig.id}`));
});

app.get('/api/users', (req, res) => {
  simulateResponse(res, () => res.json([{ id: 1, name: 'John Doe' }, { id: 2, name: 'Jane Doe' }]));
});

app.post('/api/data', (req, res) => {
  simulateResponse(res, () => res.status(201).json({ message: 'Data received', data: req.body }));
});

app.get('/api/heavy', (req, res) => {
  simulateHeavyOperation(res);
});

app.get('/api/error', (req, res) => {
  simulateErrorResponse(res);
});

function simulateResponse(res, sendResponse) {
  const processingTime = calculateProcessingTime();
  setTimeout(() => {
    if (Math.random() < serverConfig.reliability) {
      sendResponse();
    } else {
      res.status(500).json({ error: 'Internal Server Error' });
    }
  }, processingTime);
}

function simulateHeavyOperation(res) {
  const heavyOperationTime = calculateProcessingTime() * 5;
  setTimeout(() => {
    res.json({ result: 'Heavy operation completed' });
  }, heavyOperationTime);
}

function simulateErrorResponse(res) {
  const errorTypes = ['Bad Request', 'Unauthorized', 'Forbidden', 'Not Found', 'Internal Server Error'];
  const randomError = errorTypes[Math.floor(Math.random() * errorTypes.length)];
  const processingTime = calculateProcessingTime();
  setTimeout(() => {
    res.status(500).json({ error: randomError });
  }, processingTime);
}

function calculateProcessingTime() {
  const basetime = 10;
  const cpuFactor = (4 / serverConfig.cpu.cores) * (2.5 / serverConfig.cpu.speed);
  const ramFactor = 8 / serverConfig.ram;
  return Math.floor(basetime * cpuFactor * ramFactor);
}

app.listen(port, () => {
  console.log(`${serverConfig.id} is running on http://localhost:${port}`);
});