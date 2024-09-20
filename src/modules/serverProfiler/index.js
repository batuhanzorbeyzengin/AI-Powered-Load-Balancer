const { Server } = require('../../db/mongo');
const logger = require('../../utils/logger');

class ServerProfiler {
  constructor() {
    this.servers = [];
    this.weights = {};
  }

  async initialize() {
    try {
      await this.loadServers();
      this.initializeWeights();
      logger.info('ServerProfiler initialized successfully');
    } catch (error) {
      logger.error('Failed to initialize ServerProfiler', { error: error.message });
      throw error;
    }
  }

  async loadServers() {
    try {
      this.servers = await Server.find({});
      logger.info(`Loaded ${this.servers.length} servers from database`);
    } catch (error) {
      logger.error('Failed to load servers', { error: error.message });
      throw error;
    }
  }

  initializeWeights() {
    this.servers.forEach(server => {
      this.weights[server.id] = 1; // Default weight
    });
  }

  async getProfiles() {
    try {
      await this.updateServerStats();
      return this.servers.map(server => ({
        ...server.toObject(),
        weight: this.weights[server.id]
      }));
    } catch (error) {
      logger.error('Failed to get server profiles', { error: error.message });
      return [];
    }
  }

  async updateServerStats() {
    for (let server of this.servers) {
      try {
        const stats = await this.getServerStats(server);
        await Server.findOneAndUpdate(
          { id: server.id },
          { 
            $set: { 
              stats: stats, 
              lastUpdated: new Date(),
              currentLoad: stats.cpu
            } 
          },
          { new: true }
        );
      } catch (error) {
        logger.error(`Failed to update stats for server ${server.id}`, { error: error.message });
      }
    }
    await this.loadServers();
  }

  async getServerStats(server) {
    // Simulated stats retrieval
    return {
      cpu: Math.random() * 100,
      memory: Math.random() * 100,
      networkTraffic: Math.random() * 1000,
      activeConnections: Math.floor(Math.random() * 1000),
    };
  }

  updateWeights(newWeights) {
    Object.assign(this.weights, newWeights);
  }
}

module.exports = ServerProfiler;