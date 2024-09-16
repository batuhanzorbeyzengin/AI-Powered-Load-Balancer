const fs = require('fs').promises;
const path = require('path');
const logger = require('../../utils/logger');

class Analysis {
  constructor(mlModels, loadBalancer) {
    this.mlModels = mlModels;
    this.loadBalancer = loadBalancer;
    this.analysisData = {
      trainingHistory: [],
      routingDecisions: [],
      performanceMetrics: [],
    };
    this.reportsDir = path.join(__dirname, '..', '..', 'reports');
  }

  setLoadBalancer(loadBalancer) {
    this.loadBalancer = loadBalancer;
  }

  async ensureReportsDirectory() {
    try {
      await fs.mkdir(this.reportsDir, { recursive: true });
    } catch (error) {
      logger.error('Failed to create reports directory', { error: error.message });
    }
  }

  async recordTraining(modelName, epoch, loss) {
    this.analysisData.trainingHistory.push({
      modelName,
      epoch,
      loss,
      timestamp: Date.now(),
    });
  }

  recordRoutingDecision(request, selectedServer, predictions) {
    this.analysisData.routingDecisions.push({
      timestamp: Date.now(),
      requestPath: request.path,
      selectedServer: selectedServer.id,
      predictions,
    });
  }

  recordPerformanceMetric(metric) {
    this.analysisData.performanceMetrics.push({
      ...metric,
      timestamp: Date.now(),
    });
  }

  async generateReport() {
    try {
      const report = {
        trainingProgress: this.analyzeTrainingProgress(),
        routingAnalysis: this.analyzeRoutingDecisions(),
        performanceAnalysis: this.analyzePerformanceMetrics(),
        modelAccuracy: await this.analyzeModelAccuracy(),
        serverUtilization: this.analyzeServerUtilization(),
        requestPatterns: this.analyzeRequestPatterns(),
      };

      await this.saveReport(report);
      return report;
    } catch (error) {
      logger.error('Failed to generate analysis report', { error: error.message });
      throw error;
    }
  }

  analyzeTrainingProgress() {
    const modelProgress = {};
    this.analysisData.trainingHistory.forEach(({ modelName, epoch, loss }) => {
      if (!modelProgress[modelName]) {
        modelProgress[modelName] = [];
      }
      modelProgress[modelName].push({ epoch, loss });
    });

    return Object.entries(modelProgress).map(([modelName, progress]) => ({
      modelName,
      initialLoss: progress[0]?.loss ?? null,
      finalLoss: progress[progress.length - 1]?.loss ?? null,
      improvement: progress.length > 1 
        ? ((progress[0].loss - progress[progress.length - 1].loss) / progress[0].loss) * 100 
        : 0,
      epochs: progress.length,
    }));
  }

  analyzeRoutingDecisions() {
    const serverUsage = {};
    const totalDecisions = this.analysisData.routingDecisions.length;

    this.analysisData.routingDecisions.forEach(({ selectedServer }) => {
      serverUsage[selectedServer] = (serverUsage[selectedServer] || 0) + 1;
    });

    return Object.entries(serverUsage).map(([server, count]) => ({
      server,
      usageCount: count,
      usagePercentage: totalDecisions > 0 ? (count / totalDecisions) * 100 : 0,
    }));
  }

  analyzePerformanceMetrics() {
    if (this.analysisData.performanceMetrics.length === 0) {
      return { averageResponseTime: null, errorRate: null, totalRequests: 0 };
    }

    const totalResponseTime = this.analysisData.performanceMetrics.reduce(
      (sum, metric) => sum + metric.responseTime,
      0
    );
    const totalErrors = this.analysisData.performanceMetrics.filter(
      (metric) => metric.error
    ).length;
    const totalRequests = this.analysisData.performanceMetrics.length;

    return {
      averageResponseTime: totalResponseTime / totalRequests,
      errorRate: (totalErrors / totalRequests) * 100,
      totalRequests,
    };
  }

  async analyzeModelAccuracy() {
    // This is a placeholder. In a real-world scenario, you'd compare predictions to actual outcomes.
    return {
      trafficPrediction: Math.random() * 100,
      serverSelection: Math.random() * 100,
      userBehavior: Math.random() * 100,
      contentPopularity: Math.random() * 100,
      anomalyDetection: Math.random() * 100,
    };
  }

  analyzeServerUtilization() {
    const serverStats = {};
    this.analysisData.routingDecisions.forEach(({ selectedServer, predictions }) => {
      if (!serverStats[selectedServer]) {
        serverStats[selectedServer] = {
          requestCount: 0,
          averageLoad: 0,
        };
      }
      serverStats[selectedServer].requestCount++;
      serverStats[selectedServer].averageLoad += predictions.trafficPrediction || 0;
    });

    return Object.entries(serverStats).map(([server, stats]) => ({
      server,
      requestCount: stats.requestCount,
      averageLoad: stats.requestCount > 0 ? stats.averageLoad / stats.requestCount : 0,
    }));
  }

  analyzeRequestPatterns() {
    const pathCounts = {};
    this.analysisData.routingDecisions.forEach(({ requestPath }) => {
      pathCounts[requestPath] = (pathCounts[requestPath] || 0) + 1;
    });

    return Object.entries(pathCounts)
      .map(([path, count]) => ({ path, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);  // Top 10 most requested paths
  }

  async saveReport(report) {
    await this.ensureReportsDirectory();
    const reportPath = path.join(this.reportsDir, `analysis_report_${Date.now()}.json`);
    try {
      await fs.writeFile(reportPath, JSON.stringify(report, null, 2));
      logger.info(`Analysis report saved to ${reportPath}`);
    } catch (error) {
      logger.error('Failed to save analysis report', { error: error.message });
      throw error;
    }
  }
}

module.exports = Analysis;