const fetch = require('node-fetch');
const config = require('./config/config');

const LOAD_BALANCER_URL = 'http://localhost:3010'; // Load balancer'ın çalıştığı port

const scenarios = [
  { name: 'Simple GET', path: '/', method: 'GET', weight: 3 },
  { name: 'Get Users', path: '/api/users', method: 'GET', weight: 2 },
  { name: 'Post Data', path: '/api/data', method: 'POST', body: { test: 'data' }, weight: 2 },
  { name: 'Heavy Operation', path: '/api/heavy', method: 'GET', weight: 1 },
  { name: 'Error Scenario', path: '/api/error', method: 'GET', weight: 1 },
];

async function runScenario(scenario) {
  const startTime = Date.now();
  try {
    const response = await fetch(`${LOAD_BALANCER_URL}${scenario.path}`, {
      method: scenario.method,
      headers: {
        'Content-Type': 'application/json',
      },
      body: scenario.body ? JSON.stringify(scenario.body) : undefined,
    });

    const endTime = Date.now();
    const duration = endTime - startTime;

    console.log(`Scenario: ${scenario.name}`);
    console.log(`Status: ${response.status}`);
    console.log(`Duration: ${duration}ms`);
    console.log('---');
  } catch (error) {
    console.error(`Error in scenario ${scenario.name}:`, error.message);
  }
}

async function runLoadTest(duration = 60000, concurrency = 5) {
  const startTime = Date.now();
  let requestCount = 0;

  while (Date.now() - startTime < duration) {
    const promises = [];
    for (let i = 0; i < concurrency; i++) {
      const scenario = selectRandomScenario();
      promises.push(runScenario(scenario));
      requestCount++;
    }
    await Promise.all(promises);
    await new Promise(resolve => setTimeout(resolve, 200)); // 200ms bekle
  }

  console.log(`Load test completed. Total requests: ${requestCount}`);
}

function selectRandomScenario() {
  const totalWeight = scenarios.reduce((sum, scenario) => sum + scenario.weight, 0);
  let randomValue = Math.random() * totalWeight;

  for (const scenario of scenarios) {
    randomValue -= scenario.weight;
    if (randomValue <= 0) {
      return scenario;
    }
  }

  return scenarios[scenarios.length - 1];
}

// Run the load test for 5 minutes
runLoadTest(5 * 60 * 1000).catch(console.error);