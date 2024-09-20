const { execSync } = require('child_process');

function startTestEnvironment() {
  console.log('Starting test environment...');
  execSync('docker compose up -d --build', { stdio: 'inherit' });
  console.log('Test environment started.');
}

function stopTestEnvironment() {
  console.log('Stopping test environment...');
  execSync('docker compose down', { stdio: 'inherit' });
  console.log('Test environment stopped.');
}

function restartServer(serverId) {
  console.log(`Restarting ${serverId}...`);
  execSync(`docker compose restart ${serverId}`, { stdio: 'inherit' });
  console.log(`${serverId} restarted.`);
}

// Kullanım örneği
if (process.argv[2] === 'start') {
  startTestEnvironment();
} else if (process.argv[2] === 'stop') {
  stopTestEnvironment();
} else if (process.argv[2] === 'restart' && process.argv[3]) {
  restartServer(process.argv[3]);
} else {
  console.log('Usage: node manageTestEnvironment.js [start|stop|restart <serverId>]');
}