const testConfig = {
  // Genel test ayarları
  testDuration: 30 * 60 * 1000, // 30 dakika
  concurrency: 10,
  port: 3010,

  // Simüle edilecek sunucular
  servers: [
    {
      id: "server1",
      port: 3001,
      cpu: { cores: 4, speed: 2.5 }, // GHz
      ram: 8, // GB
      storage: 500, // GB
      networkBandwidth: 1000, // Mbps
      reliability: 0.99, // 99% uptime
      specialization: "static",
    },
    {
      id: "server2",
      port: 3002,
      cpu: { cores: 8, speed: 3.0 },
      ram: 16,
      storage: 1000,
      networkBandwidth: 2000,
      reliability: 0.995, // 99.5% uptime
      specialization: "api",
    },
    {
      id: "server3",
      port: 3003,
      cpu: { cores: 2, speed: 2.0 },
      ram: 4,
      storage: 250,
      networkBandwidth: 500,
      reliability: 0.98, // 98% uptime
      specialization: "static",
    },
    {
      id: "server4",
      port: 3004,
      cpu: { cores: 16, speed: 3.5 },
      ram: 32,
      storage: 2000,
      networkBandwidth: 5000,
      reliability: 0.999, // 99.9% uptime
      specialization: "compute",
    },
    {
      id: "server5",
      port: 3005,
      cpu: { cores: 1, speed: 1.5 },
      ram: 2,
      storage: 100,
      networkBandwidth: 100,
      reliability: 0.97, // 97% uptime
      specialization: "static",
    },
  ],

  // Yük testi senaryoları
  loadTestScenarios: [
    {
      name: "Gradual Increase",
      description: "Traffic gradually increases over time",
      duration: 10 * 60 * 1000, // 10 minutes
      stages: [
        { duration: 2 * 60 * 1000, requestsPerSecond: 50 },
        { duration: 3 * 60 * 1000, requestsPerSecond: 100 },
        { duration: 3 * 60 * 1000, requestsPerSecond: 200 },
        { duration: 2 * 60 * 1000, requestsPerSecond: 300 },
      ],
    },
    {
      name: "Sudden Spike",
      description: "Sudden traffic spike followed by normal traffic",
      duration: 5 * 60 * 1000, // 5 minutes
      stages: [
        { duration: 1 * 60 * 1000, requestsPerSecond: 50 },
        { duration: 1 * 60 * 1000, requestsPerSecond: 500 },
        { duration: 3 * 60 * 1000, requestsPerSecond: 100 },
      ],
    },
    {
      name: "Server Failure Simulation",
      description: "Simulate a server going offline during high traffic",
      duration: 10 * 60 * 1000, // 10 minutes
      stages: [
        { duration: 3 * 60 * 1000, requestsPerSecond: 200 },
        {
          duration: 4 * 60 * 1000,
          requestsPerSecond: 200,
          failedServerId: "server2",
        },
        { duration: 3 * 60 * 1000, requestsPerSecond: 200 },
      ],
    },
  ],

  // İstek türleri ve ağırlıkları
  requestTypes: [
    {
      name: "Static Content",
      path: "/",
      method: "GET",
      weight: 40,
      specialization: "static",
    },
    {
      name: "API GET Users",
      path: "/api/users",
      method: "GET",
      weight: 20,
      specialization: "api",
    },
    {
      name: "API GET Products",
      path: "/api/products",
      method: "GET",
      weight: 15,
      specialization: "api",
    },
    {
      name: "API POST Order",
      path: "/api/orders",
      method: "POST",
      weight: 10,
      specialization: "api",
    },
    {
      name: "API PUT User",
      path: "/api/users/1",
      method: "PUT",
      weight: 5,
      specialization: "api",
    },
    {
      name: "Heavy Computation",
      path: "/api/heavy",
      method: "GET",
      weight: 8,
      specialization: "compute",
    },
    {
      name: "Error Scenario",
      path: "/api/error",
      method: "GET",
      weight: 2,
      specialization: "api",
    },
  ],

  // Simüle edilecek hatalar
  simulatedErrors: [
    { type: "timeout", probability: 0.01, responseTime: 30000 },
    { type: "serverError", probability: 0.005, statusCode: 500 },
    { type: "networkError", probability: 0.002 },
  ],

  // Coğrafi konum simülasyonu
  geoLocations: [
    { name: "US East", weight: 30, latency: 50 },
    { name: "US West", weight: 20, latency: 100 },
    { name: "Europe", weight: 25, latency: 150 },
    { name: "Asia", weight: 15, latency: 200 },
    { name: "Australia", weight: 10, latency: 250 },
  ],

  // Kullanıcı davranış profilleri
  userProfiles: [
    { name: "Casual", sessionDuration: 5 * 60 * 1000, requestFrequency: 10000 },
    {
      name: "Regular",
      sessionDuration: 15 * 60 * 1000,
      requestFrequency: 5000,
    },
    {
      name: "Power User",
      sessionDuration: 30 * 60 * 1000,
      requestFrequency: 2000,
    },
  ],

  // Load balancer ayarları
  loadBalancer: {
    algorithms: [
      "round-robin",
      "weighted-round-robin",
      "least-connections",
      "ml-optimized",
    ],
    healthCheckInterval: 5000, // ms
    failureThreshold: 3,
    successThreshold: 2,
  },

  // ML model eğitim ayarları
  mlTraining: {
    trainingInterval: 30 * 60 * 1000, // 30 dakika
    batchSize: 64,
    epochs: 20,
    learningRate: 0.001,
    validationSplit: 0.2,
  },

  // Performans metrikleri
  performanceMetrics: {
    responseTimeThreshold: 500, // ms
    errorRateThreshold: 0.01, // 1%
    cpuUtilizationThreshold: 0.8, // 80%
    memoryUtilizationThreshold: 0.8, // 80%
  },
};

module.exports = testConfig;
