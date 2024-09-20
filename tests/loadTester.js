const fetch = require('node-fetch');
const testConfig = require('../src/config/testConfig');

const LOAD_BALANCER_URL = `http://localhost:${testConfig.port}`;

async function runScenario(scenario) {
  console.log(`Starting scenario: ${scenario.name}`);
  console.log(`Description: ${scenario.description}`);
  
  const startTime = Date.now();
  let currentStage = 0;
  let totalRequests = 0;
  let successfulRequests = 0;
  let failedRequests = 0;
  let totalResponseTime = 0;

  while (currentStage < scenario.stages.length) {
    const stage = scenario.stages[currentStage];
    const stageEndTime = startTime + stage.duration;
    
    console.log(`Entering stage ${currentStage + 1}: ${stage.requestsPerSecond} requests per second`);
    
    if (stage.failedServerId) {
      console.log(`Simulating failure of server: ${stage.failedServerId}`);
      // Implement server failure simulation logic here
    }

    while (Date.now() < stageEndTime) {
      const promises = [];
      for (let i = 0; i < stage.requestsPerSecond; i++) {
        promises.push(sendRequest(stage.failedServerId));
      }
      const results = await Promise.all(promises);
      
      results.forEach(result => {
        totalRequests++;
        if (result.success) {
          successfulRequests++;
          totalResponseTime += result.duration;
        } else {
          failedRequests++;
        }
      });

      await new Promise(resolve => setTimeout(resolve, 1000));
    }

    currentStage++;
  }

  const avgResponseTime = totalRequests > 0 ? totalResponseTime / successfulRequests : 0;
  const successRate = (successfulRequests / totalRequests) * 100;

  console.log(`Scenario ${scenario.name} completed.`);
  console.log(`Total Requests: ${totalRequests}`);
  console.log(`Successful Requests: ${successfulRequests}`);
  console.log(`Failed Requests: ${failedRequests}`);
  console.log(`Average Response Time: ${avgResponseTime.toFixed(2)}ms`);
  console.log(`Success Rate: ${successRate.toFixed(2)}%`);
}

async function sendRequest(failedServerId) {
  const requestType = selectRequestType();
  const userProfile = selectUserProfile();
  const geoLocation = selectGeoLocation();
  
  const startTime = Date.now();
  try {
    const response = await fetch(`${LOAD_BALANCER_URL}${requestType.path}`, {
      method: requestType.method,
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': `LoadTester/${userProfile.name}`,
        'X-Geo-Location': geoLocation.name,
      },
      body: requestType.method === 'POST' || requestType.method === 'PUT' ? JSON.stringify({ test: 'data' }) : undefined,
    });

    const endTime = Date.now();
    const duration = endTime - startTime;

    if (response.ok) {
      console.log(`Request: ${requestType.name}, Status: ${response.status}, Duration: ${duration}ms, User: ${userProfile.name}, Location: ${geoLocation.name}`);
      return { success: true, duration };
    } else {
      console.error(`Error in request ${requestType.name}: Status ${response.status}`);
      return { success: false, duration };
    }

  } catch (error) {
    console.error(`Error in request ${requestType.name}:`, error.message);
    return { success: false, duration: Date.now() - startTime };
  }
}

function selectRequestType() {
  return weightedRandomSelection(testConfig.requestTypes);
}

function selectUserProfile() {
  return weightedRandomSelection(testConfig.userProfiles);
}

function selectGeoLocation() {
  return weightedRandomSelection(testConfig.geoLocations);
}

function weightedRandomSelection(items) {
  const totalWeight = items.reduce((sum, item) => sum + (item.weight || 1), 0);
  let random = Math.random() * totalWeight;

  for (const item of items) {
    random -= (item.weight || 1);
    if (random <= 0) {
      return item;
    }
  }

  return items[items.length - 1];
}

async function runLoadTest() {
  for (const scenario of testConfig.loadTestScenarios) {
    await runScenario(scenario);
    // Add a small delay between scenarios
    await new Promise(resolve => setTimeout(resolve, 5000));
  }
}

runLoadTest().catch(console.error);