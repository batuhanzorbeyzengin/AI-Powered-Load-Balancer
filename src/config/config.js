module.exports = {
  port: process.env.PORT || 3010,
  mongoUri: process.env.MONGO_URI || "mongodb://localhost:27017/loadbalancer",
  redisUri: process.env.REDIS_URI || "redis://localhost:6379",
  logLevel: process.env.LOG_LEVEL || "info",
  maxServers: 5,
  updateInterval: 60000, // Server stats update interval in milliseconds
  mlModelPath: "./ml-models",
  jwtSecret: process.env.JWT_SECRET || 'uDU1xgqES1e4fai70VwUBl6gjiydmRv8',
  servers: [
    { id: 'server1', url: 'http://localhost:3001' },
    { id: 'server2', url: 'http://localhost:3002' },
    { id: 'server3', url: 'http://localhost:3003' },
    { id: 'server4', url: 'http://localhost:3004' },
    { id: 'server5', url: 'http://localhost:3005' },
  ]
};
