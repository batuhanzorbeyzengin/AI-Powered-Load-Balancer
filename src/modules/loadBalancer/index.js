const logger = require("../../utils/logger");
const fetch = require("node-fetch");

class LoadBalancer {
  constructor(mlModels, serverProfiler, cacheOptimizer, analysisModule) {
    this.mlModels = mlModels;
    this.serverProfiler = serverProfiler;
    this.cacheOptimizer = cacheOptimizer;
    this.analysisModule = analysisModule;
    this.serverHealthChecks = {};
    this.lastUsedServerIndex = -1;
    this.algorithm = 'weighted-round-robin';
    this.serverWeights = {};
    this.serverPerformanceHistory = {};
    this.healthCheckInterval = 5000; // 5 seconds
    this.failureThreshold = 3; // Number of consecutive failures before marking server as unhealthy
    this.successThreshold = 2; // Number of consecutive successes before marking server as healthy again
  }

  async initialize() {
    const servers = await this.serverProfiler.getProfiles();
    servers.forEach(server => {
      this.serverWeights[server.id] = 1;
      this.serverPerformanceHistory[server.id] = [];
      this.serverHealthChecks[server.id] = {
        isHealthy: true,
        lastCheck: Date.now(),
        consecutiveFailures: 0,
        consecutiveSuccesses: 0
      };
    });
    this.startHealthChecks();
    logger.info(`Initialized LoadBalancer with ${servers.length} servers`);
  }

  startHealthChecks() {
    setInterval(() => {
      this.performHealthChecks();
    }, this.healthCheckInterval);
    logger.info("Started periodic health checks");
  }

  async performHealthChecks() {
    const servers = await this.serverProfiler.getProfiles();
    logger.info(`Performing health checks on ${servers.length} servers`);
    for (const server of servers) {
      await this.checkServerHealth(server);
    }
    this.updateServerWeights();
    this.logHealthStatus();
  }

  async checkServerHealth(server) {
    try {
      const response = await fetch(`${server.url}/health`, { timeout: 5000 });
      const health = await response.json();
      
      if (response.ok) {
        this.serverHealthChecks[server.id].consecutiveSuccesses++;
        this.serverHealthChecks[server.id].consecutiveFailures = 0;
        if (this.serverHealthChecks[server.id].consecutiveSuccesses >= this.successThreshold) {
          this.serverHealthChecks[server.id].isHealthy = true;
        }
      } else {
        this.serverHealthChecks[server.id].consecutiveFailures++;
        this.serverHealthChecks[server.id].consecutiveSuccesses = 0;
      }

      if (this.serverHealthChecks[server.id].consecutiveFailures >= this.failureThreshold) {
        this.serverHealthChecks[server.id].isHealthy = false;
      }

      this.serverHealthChecks[server.id] = {
        ...this.serverHealthChecks[server.id],
        lastCheck: Date.now(),
        load: health.load,
        activeConnections: health.activeConnections,
        specialization: health.specialization,
      };
      
      logger.info(`Health check for server ${server.id}: ${this.serverHealthChecks[server.id].isHealthy ? 'Healthy' : 'Unhealthy'}, Load: ${health.load}, Connections: ${health.activeConnections}`);
    } catch (error) {
      logger.error(`Health check failed for server ${server.id}`, { error: error.message });
      this.serverHealthChecks[server.id].consecutiveFailures++;
      this.serverHealthChecks[server.id].consecutiveSuccesses = 0;
      if (this.serverHealthChecks[server.id].consecutiveFailures >= this.failureThreshold) {
        this.serverHealthChecks[server.id].isHealthy = false;
      }
    }
  }

  updateServerWeights() {
    const healthyServers = Object.values(this.serverHealthChecks).filter(s => s.isHealthy);
    const totalLoad = healthyServers.reduce((sum, s) => sum + s.load, 0);
    const avgLoad = totalLoad / healthyServers.length || 1;

    for (const [serverId, health] of Object.entries(this.serverHealthChecks)) {
      if (health.isHealthy) {
        const loadFactor = avgLoad / (health.load || 1);
        const recentPerformance = this.getRecentPerformance(serverId);
        this.serverWeights[serverId] = loadFactor * recentPerformance;
      } else {
        this.serverWeights[serverId] = 0;
      }
    }
    logger.info("Updated server weights based on health and performance");
  }

  logHealthStatus() {
    const healthStatus = Object.entries(this.serverHealthChecks).map(([serverId, health]) => ({
      serverId,
      isHealthy: health.isHealthy,
      load: health.load,
      activeConnections: health.activeConnections
    }));
    logger.info("Current server health status:", { healthStatus });
  }

  async routeRequest(request) {
    try {
      const contentInfo = await this.analyzeContent(request);
      const serverProfiles = await this.getServerProfiles();
      const userInfo = this.getUserInfo(request);

      if (serverProfiles.length === 0) {
        logger.error("No healthy servers available for routing");
        throw new Error("No healthy servers available");
      }

      let selectedServer;
      switch (this.algorithm) {
        case 'round-robin':
          selectedServer = this.roundRobin(serverProfiles);
          break;
        case 'weighted-round-robin':
          selectedServer = this.weightedRoundRobin(serverProfiles);
          break;
        case 'least-connections':
          selectedServer = this.leastConnections(serverProfiles);
          break;
        case 'ml-optimized':
          selectedServer = await this.mlOptimizedSelection(request, contentInfo, serverProfiles, userInfo);
          break;
        default:
          throw new Error('Invalid load balancing algorithm');
      }

      if (!selectedServer) {
        logger.error("No suitable server found after algorithm selection");
        throw new Error("No suitable server found");
      }

      await this.optimizeCache(userInfo, contentInfo);

      const startTime = Date.now();
      const result = await this.forwardRequest(request, selectedServer);
      const endTime = Date.now();
      this.recordPerformance(selectedServer.id, endTime - startTime);

      if (this.analysisModule) {
        this.analysisModule.recordRoutingDecision(request, selectedServer, {});
        this.analysisModule.recordPerformanceMetric({
          responseTime: endTime - startTime,
          error: false,
        });
      }

      return result;
    } catch (error) {
      logger.error("Error in routeRequest", {
        error: error.message,
        requestId: request.requestId,
        stack: error.stack,
      });
      if (this.analysisModule) {
        this.analysisModule.recordPerformanceMetric({
          responseTime: Date.now() - request.startTime,
          error: true,
        });
      }
      throw error;
    }
  }

  roundRobin(serverProfiles) {
    const healthyServers = serverProfiles.filter(server => this.serverHealthChecks[server.id]?.isHealthy);
    if (healthyServers.length === 0) return null;
    this.lastUsedServerIndex = (this.lastUsedServerIndex + 1) % healthyServers.length;
    return healthyServers[this.lastUsedServerIndex];
  }

  weightedRoundRobin(serverProfiles) {
    const healthyServers = serverProfiles.filter(server => this.serverHealthChecks[server.id]?.isHealthy);
    if (healthyServers.length === 0) return null;

    let totalWeight = healthyServers.reduce((sum, server) => sum + (this.serverWeights[server.id] || 0), 0);
    let random = Math.random() * totalWeight;

    for (const server of healthyServers) {
      random -= this.serverWeights[server.id] || 0;
      if (random <= 0) {
        return server;
      }
    }

    return healthyServers[healthyServers.length - 1];
  }

  leastConnections(serverProfiles) {
    return serverProfiles
      .filter(server => this.serverHealthChecks[server.id]?.isHealthy)
      .reduce((min, server) => 
        (this.serverHealthChecks[server.id]?.activeConnections || Infinity) < (this.serverHealthChecks[min.id]?.activeConnections || Infinity) ? server : min
      , serverProfiles[0]);
  }

  async mlOptimizedSelection(request, contentInfo, serverProfiles, userInfo) {
    const predictions = await this.mlModels.predict(contentInfo, serverProfiles, userInfo);
    
    if (predictions.isAnomaly) {
      logger.warn("Anomaly detected in request", { requestId: request.requestId });
      return this.handleAnomaly(request, predictions, serverProfiles);
    }

    return this.selectOptimalServer(predictions, serverProfiles, contentInfo);
  }

  async getServerProfiles() {
    return (await this.serverProfiler.getProfiles()).filter(profile => this.serverHealthChecks[profile.id]?.isHealthy);
  }

  selectOptimalServer(predictions, serverProfiles, contentInfo) {
    const { serverSelection } = predictions;
    
    // Content-based routing
    const specializedServer = serverProfiles.find(
      (server) =>
        this.serverHealthChecks[server.id]?.specialization === contentInfo.contentType &&
        this.serverHealthChecks[server.id]?.load < 80
    );
    if (specializedServer) {
      return specializedServer;
    }

    // Use ML predictions for server selection
    const selectedIndex = serverSelection.indexOf(Math.max(...serverSelection));
    return serverProfiles[selectedIndex];
  }

  async analyzeContent(request) {
    try {
      return {
        contentSize: parseInt(request.headers["content-length"]) || 0,
        contentType: request.headers["content-type"] || "application/octet-stream",
        semanticAnalysis: {
          tokenCount: request.body ? String(request.body).length : 0,
        },
        geolocation: request.geolocation || { country: "unknown" },
        expectedPopularity: 0.5,
        requestMethod: request.method,
        path: request.path,
        queryParams: Object.keys(request.query).length,
      };
    } catch (error) {
      logger.error("Error analyzing content", {
        error: error.message,
        stack: error.stack,
      });
      return null;
    }
  }

  getUserInfo(request) {
    return {
      sessionDuration: Math.random() * 3600,
      pageViews: Math.floor(Math.random() * 10),
      bounceRate: Math.random(),
      deviceType: ["mobile", "tablet", "desktop"][Math.floor(Math.random() * 3)],
      userType: ["new", "returning", "frequent"][Math.floor(Math.random() * 3)],
    };
  }

  async handleAnomaly(request, predictions, serverProfiles) {
    logger.warn("Handling anomalous request", { requestId: request.requestId });
    const safeServer = serverProfiles.reduce((safest, server) => {
      const health = this.serverHealthChecks[server.id];
      if (!health || !health.isHealthy) return safest;
      if (!safest || health.load < this.serverHealthChecks[safest.id].load) {
        return server;
      }
      return safest;
    }, null);

    if (!safeServer) {
      throw new Error("No safe server available for anomalous request");
    }

    return safeServer;
  }

  async optimizeCache(userInfo, contentInfo) {
    try {
      await this.cacheOptimizer.optimizeCache(userInfo, contentInfo);
    } catch (error) {
      logger.error("Error optimizing cache", {
        error: error.message,
        stack: error.stack,
      });
    }
  }

  recordPerformance(serverId, responseTime) {
    this.serverPerformanceHistory[serverId].push(responseTime);
    if (this.serverPerformanceHistory[serverId].length > 1000) {
      this.serverPerformanceHistory[serverId].shift();
    }
  }

  getRecentPerformance(serverId) {
    const recentRequests = this.serverPerformanceHistory[serverId].slice(-100);
    if (recentRequests.length === 0) return 1;
    const avgResponseTime = recentRequests.reduce((sum, time) => sum + time, 0) / recentRequests.length;
    return 1000 / (avgResponseTime + 1); // Higher value for faster responses
  }

  async forwardRequest(request, server) {
    logger.info(`Forwarding request to server: ${server.id}`, {
      requestId: request.requestId,
    });

    try {
      const forwardUrl = new URL(request.path, server.url);
      const forwardOptions = {
        method: request.method,
        headers: {
          ...request.headers,
          host: forwardUrl.host,
        },
        body: ['GET', 'HEAD'].includes(request.method.toUpperCase()) ? undefined : request.body,
        timeout: 10000, // 10 seconds timeout
      };

      const response = await fetch(forwardUrl.toString(), forwardOptions);
      
      const responseBody = await response.text();
      const responseHeaders = Object.fromEntries(response.headers.entries());

      logger.info(`Request forwarded successfully to server ${server.id}`, {
        requestId: request.requestId,
        statusCode: response.status,
      });

      return {
        status: response.status,
        headers: responseHeaders,
        body: responseBody,
      };
    } catch (error) {
      logger.error(`Error forwarding request to server ${server.id}`, {
        requestId: request.requestId,
        error: error.message,
        stack: error.stack,
      });
      throw new Error(`Failed to forward request: ${error.message}`);
    }
  }

  setAlgorithm(algorithm) {
    if (['round-robin', 'weighted-round-robin', 'least-connections', 'ml-optimized'].includes(algorithm)) {
      this.algorithm = algorithm;
    } else {
      throw new Error('Invalid load balancing algorithm');
    }
  }
}

module.exports = LoadBalancer;