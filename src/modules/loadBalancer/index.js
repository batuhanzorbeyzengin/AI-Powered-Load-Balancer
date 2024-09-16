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
  }

  async routeRequest(request) {
    try {
      const contentInfo = await this.analyzeContent(request);
      const serverProfiles = await this.getServerProfiles();
      const userInfo = this.getUserInfo(request);

      if (serverProfiles.length === 0) {
        throw new Error("No healthy servers available");
      }

      const predictions = await this.mlModels.predict(
        contentInfo,
        serverProfiles,
        userInfo
      );

      let selectedServer;
      if (predictions.isAnomaly) {
        logger.warn("Anomaly detected in request", {
          requestId: request.requestId,
        });
        selectedServer = await this.handleAnomaly(
          request,
          predictions,
          serverProfiles
        );
      } else {
        selectedServer = this.selectOptimalServer(
          predictions,
          serverProfiles,
          contentInfo
        );
      }

      if (!selectedServer) {
        throw new Error("No suitable server found");
      }

      await this.optimizeCache(userInfo, contentInfo, predictions);

      if (this.analysisModule) {
        this.analysisModule.recordRoutingDecision(
          request,
          selectedServer,
          predictions
        );
        this.analysisModule.recordPerformanceMetric({
          responseTime: Date.now() - request.startTime,
          error: false,
        });
      }

      return this.forwardRequest(request, selectedServer);
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

  async getServerProfiles() {
    const profiles = await this.serverProfiler.getProfiles();
    const healthyProfiles = [];
    for (const profile of profiles) {
      if (
        !this.serverHealthChecks[profile.id] ||
        Date.now() - this.serverHealthChecks[profile.id].lastCheck > 10000
      ) {
        await this.checkServerHealth(profile);
      }
      if (this.serverHealthChecks[profile.id]?.isHealthy) {
        healthyProfiles.push(profile);
      }
    }
    return healthyProfiles;
  }

  async checkServerHealth(server) {
    try {
      const response = await fetch(`${server.url}/health`, { timeout: 5000 });
      const health = await response.json();
      this.serverHealthChecks[server.id] = {
        isHealthy: response.ok,
        lastCheck: Date.now(),
        load: health.load,
        specialization: health.specialization,
      };
      logger.info(
        `Health check for server ${server.id}: ${response.ok ? "OK" : "Failed"}, Load: ${health.load}`
      );
    } catch (error) {
      logger.error(`Health check failed for server ${server.id}`, {
        error: error.message,
      });
      this.serverHealthChecks[server.id] = {
        isHealthy: false,
        lastCheck: Date.now(),
      };
    }
  }

  selectOptimalServer(predictions, serverProfiles, contentInfo) {
    const { serverSelection } = predictions;

    // Content-based routing
    const specializedServer = serverProfiles.find(
      (server) =>
        this.serverHealthChecks[server.id]?.specialization ===
          contentInfo.contentType &&
        this.serverHealthChecks[server.id].load < 80
    );
    if (specializedServer) {
      return specializedServer;
    }

    // Weighted Round Robin
    const totalWeight = serverSelection.reduce(
      (sum, weight) => sum + weight,
      0
    );
    let targetWeight = Math.random() * totalWeight;

    for (let i = 0; i < serverProfiles.length; i++) {
      const index = (this.lastUsedServerIndex + 1 + i) % serverProfiles.length;
      const server = serverProfiles[index];
      const health = this.serverHealthChecks[server.id];

      if (health && health.isHealthy && health.load < 90) {
        targetWeight -= serverSelection[index];
        if (targetWeight <= 0) {
          this.lastUsedServerIndex = index;
          return server;
        }
      }
    }

    // Fallback to least loaded server
    this.lastUsedServerIndex = serverProfiles.reduce(
      (minIndex, server, index, arr) =>
        this.serverHealthChecks[server.id].load <
        this.serverHealthChecks[arr[minIndex].id].load
          ? index
          : minIndex,
      0
    );
    return serverProfiles[this.lastUsedServerIndex];
  }

  async analyzeContent(request) {
    try {
      return {
        contentSize: parseInt(request.headers["content-length"]) || 0,
        contentType:
          request.headers["content-type"] || "application/octet-stream",
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
    // Bu metod, gerçek bir senaryoda kullanıcı oturum bilgilerinden veya
    // request headers'dan elde edilebilir. Şimdilik örnek değerler kullanıyoruz.
    return {
      sessionDuration: Math.random() * 3600, // 0-1 saat arası rastgele bir süre
      pageViews: Math.floor(Math.random() * 10),
      bounceRate: Math.random(),
      deviceType: ["mobile", "tablet", "desktop"][
        Math.floor(Math.random() * 3)
      ],
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

  async optimizeCache(userInfo, contentInfo, predictions) {
    try {
      const { userBehavior, contentPopularity } = predictions;
      await this.cacheOptimizer.optimizeCache(
        userInfo,
        contentInfo,
        userBehavior,
        contentPopularity
      );
    } catch (error) {
      logger.error("Error optimizing cache", {
        error: error.message,
        stack: error.stack,
      });
    }
  }

  async forwardRequest(request, server) {
    logger.info(`Forwarding request to server: ${server.id}`, {
      requestId: request.requestId,
    });
    return { status: "forwarded", serverId: server.id };
  }
}

module.exports = LoadBalancer;
