const mongoose = require('mongoose');
const config = require('../config/config');
const logger = require('../utils/logger');

const serverSchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true },
  url: { type: String, required: true },
  currentLoad: { type: Number, default: 0 },
  status: { type: String, enum: ['active', 'inactive'], default: 'active' },
  stats: {
    cpu: Number,
    memory: Number,
    networkTraffic: Number,
    activeConnections: Number
  },
  lastUpdated: { type: Date, default: Date.now }
});

const Server = mongoose.model('Server', serverSchema);

async function connectToDatabase() {
  try {
    await mongoose.connect(config.mongoUri, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    logger.info('Connected to MongoDB');
  } catch (error) {
    logger.error('Failed to connect to MongoDB', { error: error.message });
    throw error;
  }
}

async function initializeServers() {
  try {
    const existingServers = await Server.find({});
    if (existingServers.length === 0) {
      logger.info('No servers found in database. Initializing with default configuration.');
      const serverDocuments = config.servers.map(server => ({
        id: server.id,
        url: server.url,
        currentLoad: 0,
        status: 'active'
      }));

      await Server.insertMany(serverDocuments);
      logger.info(`Initialized ${serverDocuments.length} servers in database`);
    } else {
      logger.info(`Found ${existingServers.length} existing servers in database`);
    }
  } catch (error) {
    logger.error('Failed to initialize servers', { error: error.message });
    throw error;
  }
}

module.exports = {
  connectToDatabase,
  initializeServers,
  Server
};