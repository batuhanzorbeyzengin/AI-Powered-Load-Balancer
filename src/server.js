const express = require('express');
const path = require('path');
const http = require('http');
const socketIo = require('socket.io');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const fetch = require('node-fetch');
const config = require('./config/config');
const logger = require('./utils/logger');
const routes = require('./api/routes');
const { connectToDatabase, initializeServers } = require('./db/mongo');

const ContentAnalysis = require('./modules/contentAnalysis');
const ServerProfiler = require('./modules/serverProfiler');
const MLModels = require('./modules/mlModels');
const LoadBalancer = require('./modules/loadBalancer');
const CacheOptimizer = require('./modules/cacheOptimizer');
const ErrorHandler = require('./modules/errorHandler');
const SecurityRouter = require('./modules/securityRouter');
const EnergyOptimizer = require('./modules/energyOptimizer');
const Analysis = require('./modules/analysis');

const app = express();
const server = http.createServer(app);
const io = socketIo(server);

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

app.use(express.static(path.join(__dirname, 'public')));
app.use(express.json());
app.use(logger.requestLogger.bind(logger));

const contentAnalysis = new ContentAnalysis();
const serverProfiler = new ServerProfiler();
const mlModels = new MLModels();
const cacheOptimizer = new CacheOptimizer();
const analysisModule = new Analysis(mlModels, null);
const loadBalancer = new LoadBalancer(mlModels, serverProfiler, cacheOptimizer, analysisModule);
analysisModule.setLoadBalancer(loadBalancer);
const errorHandler = new ErrorHandler();
const securityRouter = new SecurityRouter(serverProfiler);
const energyOptimizer = new EnergyOptimizer(serverProfiler, loadBalancer);

const users = [
  { id: 1, username: 'admin', password: bcrypt.hashSync('password', 10) }
];

app.get('/login', (req, res) => {
  res.render('login');
});

app.post('/login', async (req, res) => {
  const { username, password } = req.body;
  const user = users.find(u => u.username === username);
  if (user && await bcrypt.compare(password, user.password)) {
    const token = jwt.sign({ id: user.id, username: user.username }, config.jwtSecret, { expiresIn: '1h' });
    res.json({ token });
  } else {
    res.status(401).json({ error: 'Invalid credentials' });
  }
});

const authenticateJWT = (req, res, next) => {
  const token = req.headers.authorization;
  if (token) {
    jwt.verify(token, config.jwtSecret, (err, user) => {
      if (err) {
        return res.sendStatus(403);
      }
      req.user = user;
      next();
    });
  } else {
    res.sendStatus(401);
  }
};

app.get('/dashboard', authenticateJWT, (req, res) => {
  res.render('dashboard', { user: req.user });
});

app.get('/api/dashboard/data', authenticateJWT, async (req, res) => {
  const { range } = req.query;
  const dashboardData = await generateDashboardData(range);
  res.json(dashboardData);
});

app.get('/generate-analysis', async (req, res) => {
  try {
    const report = await analysisModule.generateReport();
    res.json(report);
  } catch (error) {
    logger.error('Failed to generate analysis report', { error: error.message, stack: error.stack });
    res.status(500).json({ error: 'Failed to generate analysis report', details: error.message });
  }
});

app.use(async (req, res, next) => {
  const startTime = Date.now();
  try {
    const routingResult = await loadBalancer.routeRequest(req);
    
    logger.info(`Request routed`, { 
      requestId: req.requestId, 
      routingResult 
    });

    const selectedServer = config.servers.find(server => server.id === routingResult.serverId);
    if (!selectedServer) {
      throw new Error('Selected server not found');
    }

    const proxyRes = await fetch(selectedServer.url + req.url, {
      method: req.method,
      headers: {
        ...req.headers,
        host: new URL(selectedServer.url).host
      },
      body: req.method !== 'GET' && req.method !== 'HEAD' ? req.body : undefined
    });

    res.status(proxyRes.status);
    for (const [key, value] of proxyRes.headers.entries()) {
      res.setHeader(key, value);
    }
    res.send(await proxyRes.text());

    const duration = Date.now() - startTime;
    logger.logPerformance('request-processing', duration, { requestId: req.requestId });
  } catch (error) {
    const errorId = errorHandler.logError(error, { requestId: req.requestId });
    res.status(500).json({ error: 'Internal Server Error', errorId });
  }
});

io.on('connection', (socket) => {
  console.log('A user connected');

  const interval = setInterval(async () => {
    const dashboardData = await generateDashboardData('1h');
    socket.emit('dashboardUpdate', dashboardData);
  }, 5000);

  socket.on('disconnect', () => {
    console.log('User disconnected');
    clearInterval(interval);
  });
});

app.use(errorHandler.handle.bind(errorHandler));

app.post('/train', authenticateJWT, async (req, res) => {
  try {
    await mlModels.train(req.body, analysisModule);
    res.json({ status: 'success', message: 'Models trained successfully' });
  } catch (error) {
    errorHandler.logError(error, { requestId: req.requestId });
    res.status(500).json({ status: 'error', message: 'Failed to train models' });
  }
});

async function generateDashboardData(range) {
  const serverProfiles = await serverProfiler.getProfiles();
  return {
    trafficData: generateTrafficData(range),
    serverLoad: serverProfiles.map(profile => ({
      server: profile.id,
      load: profile.currentLoad
    })),
    userBehavior: generateUserBehaviorData(),
    contentPopularity: generateContentPopularityData(),
    systemStatus: {
      activeServers: serverProfiles.length,
      totalUsers: Math.floor(Math.random() * 10000),
      avgResponseTime: Math.floor(Math.random() * 500)
    },
    anomalies: Math.random() > 0.7
      ? [{ id: Date.now(), message: 'Unusual traffic spike detected' }]
      : [],
    performanceMetrics: generatePerformanceMetrics()
  };
}

function generateTrafficData(range) {
  let dataPoints;
  switch(range) {
    case '1h':
      dataPoints = 60;
      break;
    case '24h':
      dataPoints = 24;
      break;
    case '7d':
      dataPoints = 7;
      break;
    case '30d':
      dataPoints = 30;
      break;
    default:
      dataPoints = 24;
  }
  
  return Array(dataPoints).fill().map((_, i) => ({
    time: i,
    traffic: Math.floor(Math.random() * 1000)
  }));
}

function generateUserBehaviorData() {
  return [
    { name: 'New', value: Math.floor(Math.random() * 100) },
    { name: 'Returning', value: Math.floor(Math.random() * 100) },
    { name: 'Frequent', value: Math.floor(Math.random() * 100) },
  ];
}

function generateContentPopularityData() {
  return Array(5).fill().map((_, i) => ({
    content: `Content ${i+1}`,
    popularity: Math.random(),
    views: Math.floor(Math.random() * 10000)
  }));
}

function generatePerformanceMetrics() {
  return {
    cpuUsage: Math.random() * 100,
    memoryUsage: Math.random() * 100,
    networkLatency: Math.random() * 100,
    errorRate: Math.random() * 5
  };
}

async function initializeModules() {
  try {
    await connectToDatabase();
    await initializeServers();
    await serverProfiler.initialize();
    const profiles = await serverProfiler.getProfiles();
    if (profiles.length === 0) {
      logger.error('No server profiles available. Application cannot start.');
      process.exit(1);
    } else {
      logger.info(`Loaded ${profiles.length} server profiles`);
    }
    await mlModels.initialize();
    await analysisModule.ensureReportsDirectory();
    energyOptimizer.initialize();
    logger.info('All modules initialized successfully');
  } catch (error) {
    logger.error('Failed to initialize modules', { error: error.message, stack: error.stack });
    process.exit(1);
  }
}

initializeModules().then(() => {
  server.listen(config.port, () => {
    console.log(`Server running on port ${config.port}`);
  });
}).catch(err => {
  logger.error('Failed to start server', { error: err.message, stack: err.stack });
  process.exit(1);
});

module.exports = app;