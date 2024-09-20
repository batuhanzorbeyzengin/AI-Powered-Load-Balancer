# AI-Powered Load Balancer

> **BETA NOTICE**: This project is currently in BETA stage. Testing is ongoing and the system may not be fully stable. Use with caution in production environments.

## Overview

This project implements an advanced, AI-powered load balancer system that uses machine learning techniques to optimize request routing, predict traffic patterns, and adapt to changing server conditions in real-time. It's designed to handle complex scenarios and provide intelligent load balancing for high-traffic applications.

## Table of Contents

1. [Features](#features)
2. [System Architecture](#system-architecture)
3. [Project Structure](#project-structure)
4. [Installation](#installation)
5. [Configuration](#configuration)
6. [Usage](#usage)
7. [Modules](#modules)
8. [API Reference](#api-reference)
9. [Machine Learning Models](#machine-learning-models)
10. [Load Balancing Strategies](#load-balancing-strategies)
11. [Monitoring and Analytics](#monitoring-and-analytics)
12. [Testing](#testing)
13. [Docker-based Test Environment](#docker-based-test-environment)
14. [Deployment](#deployment)
15. [Contributing](#contributing)
16. [License](#license)

## Features

- AI-driven traffic prediction and server selection
- Enhanced load balancing algorithms including Round Robin, Weighted Round Robin, and Least Connections
- Improved anomaly detection for identifying unusual request patterns
- Content-aware routing based on request characteristics
- User behavior analysis for optimized request handling
- Real-time performance monitoring and adaptive load balancing
- Energy-efficient server management
- Caching optimization based on content popularity predictions
- Comprehensive analytics and reporting
- Secure routing with JWT authentication
- WebSocket support for real-time dashboard updates
- Docker-based test environment for simulating various server configurations
- Dynamic server health checks and weight adjustments

## System Architecture

The system consists of several interconnected modules:

- **LoadBalancer**: Core module that handles request routing with multiple algorithms
- **MLModels**: Enhanced machine learning models for various predictions
- **ServerProfiler**: Monitors and profiles connected servers with improved metrics
- **ContentAnalysis**: Analyzes incoming request content for better routing decisions
- **CacheOptimizer**: Optimizes caching strategies based on ML predictions
- **SecurityRouter**: Handles security-related routing decisions
- **EnergyOptimizer**: Manages energy-efficient server utilization
- **AnalysisModule**: Generates comprehensive reports and analytics

## Project Structure
```
├─ .env.example
├─ .gitignore
├─ README.md
├─ package-lock.json
├─ package.json
├─ src
│  ├─ api
│  │  └─ routes.js
│  ├─ config
│  │  └─ config.js
│  ├─ db
│  │  ├─ mongo.js
│  ├─ loadTester.js
│  ├─ modules
│  │  ├─ analysis
│  │  │  └─ index.js
│  │  ├─ cacheOptimizer
│  │  │  └─ index.js
│  │  ├─ contentAnalysis
│  │  │  └─ index.js
│  │  ├─ energyOptimizer
│  │  │  └─ index.js
│  │  ├─ errorHandler
│  │  │  └─ index.js
│  │  ├─ loadBalancer
│  │  │  └─ index.js
│  │  ├─ mlModels
│  │  │  ├─ README.md
│  │  │  └─ index.js
│  │  ├─ securityRouter
│  │  │  └─ index.js
│  │  └─ serverProfiler
│  │     └─ index.js
│  ├─ saved_models
│  │  ├─ anomalyDetection
│  │  │  ├─ model.json
│  │  │  └─ weights.bin
│  │  ├─ contentPopularity
│  │  │  ├─ model.json
│  │  │  └─ weights.bin
│  │  ├─ serverSelection
│  │  │  ├─ model.json
│  │  │  └─ weights.bin
│  │  ├─ trafficPrediction
│  │  │  ├─ model.json
│  │  │  └─ weights.bin
│  │  └─ userBehavior
│  │     ├─ model.json
│  │     └─ weights.bin
│  ├─ server.js
│  ├─ utils
│  │  ├─ logger.js
│  │  └─ modelPersistence.js
│  └─ views
│     ├─ dashboard.ejs
│     └─ login.ejs
├─ test
│  ├─ Dockerfile
│  ├─ docker-compose.yml
|  |- loadTester.js
│  ├─ simulateServers.js
│  └─ manageTestEnvironment.js
```

## Installation

1. Clone the repository:
   ```
   git clone https://github.com/batuhanzorbeyzengin/AI-Powered-Load-Balancer.git
   ```

2. Install dependencies:
   ```
   cd AI-Powered-Load-Balancer
   npm install
   ```

3. Set up the database (MongoDB):
   - Install MongoDB if not already installed
   - Create a new database named `loadbalancer`

4. Configure environment variables:
   - Copy `.env.example` to `.env`
   - Update the variables in `.env` with your specific configuration

5. Install Docker and Docker Compose for the test environment (optional):
   - Follow the official Docker installation guide for your operating system

## Configuration

Modify `config/config.js` to adjust various system parameters:

- Server ports
- Database connection strings
- JWT secret
- Machine learning model parameters
- Caching settings
- Load balancing algorithm selection
- Health check intervals

## Usage

1. Start the load balancer:
   ```
   npm start
   ```

2. Access the dashboard:
   Open a web browser and navigate to `http://localhost:3010/dashboard`

3. Monitor real-time analytics and server performance through the dashboard.

4. Use the API to change load balancing algorithms or trigger ML model training.

## Modules

### LoadBalancer

Handles the core load balancing logic, integrating predictions from ML models to make intelligent routing decisions. Now includes multiple algorithms:

- Round Robin
- Weighted Round Robin
- Least Connections
- ML-optimized selection

### MLModels

Contains enhanced machine learning models for:

- Traffic prediction
- Server selection
- User behavior analysis
- Content popularity prediction
- Anomaly detection

Models now include more features and are trained on larger datasets for improved accuracy.

### ServerProfiler

Monitors connected servers, tracking their performance, load, and other relevant metrics. Now includes:

- More detailed server health checks
- Dynamic weight adjustments based on server performance
- Historical performance tracking

### ContentAnalysis

Analyzes incoming requests to extract relevant features for the ML models. Improvements include:

- More detailed content type analysis
- Semantic analysis of request payloads
- Geolocation-based request classification

### CacheOptimizer

Implements intelligent caching strategies based on content popularity predictions and user behavior. Now features:

- ML-driven cache eviction policies
- Content-aware caching strategies
- User behavior-based cache prefetching

### SecurityRouter

Handles security-related routing decisions and implements authentication mechanisms. Enhancements include:

- More sophisticated threat detection
- Integration with anomaly detection model
- Enhanced JWT token management

### EnergyOptimizer

Manages server power states to optimize energy consumption while maintaining performance. New features:

- ML-driven power state predictions
- Integration with server load predictions for proactive scaling

### AnalysisModule

Generates comprehensive reports and analytics on system performance and behavior. Now includes:

- More detailed performance metrics
- ML model performance analysis
- Comparative analysis of different load balancing strategies

## API Reference

- `GET /api/dashboard/data`: Retrieve dashboard data
- `POST /api/train`: Trigger ML model training
- `GET /generate-analysis`: Generate a full system analysis report
- `POST /set-algorithm`: Change the active load balancing algorithm

For a complete API reference, please refer to the [API Documentation](./docs/api.md).

## Machine Learning Models

The system utilizes several enhanced machine learning models:

1. Traffic Prediction Model: Now uses LSTM networks for better time-series prediction
2. Server Selection Model: Improved with reinforcement learning techniques
3. User Behavior Model: Enhanced with more features for better user segmentation
4. Content Popularity Model: Now includes trend analysis for better predictions
5. Anomaly Detection Model: Improved with ensemble methods for higher accuracy

For more details on these models, refer to the [MLModels README](./src/modules/mlModels/README.md).

## Load Balancing Strategies

The load balancer now implements several strategies with improvements:

- Round Robin: Enhanced with server health checks
- Weighted Round Robin: Now with dynamic weight adjustments based on server performance
- Least Connections: Improved to consider server capacity
- ML-optimized: Uses predictions from multiple models for optimal server selection
- Content-based routing: Enhanced with more detailed content analysis
- Geographic proximity: Improved with more accurate geolocation data

These strategies are dynamically selected based on current conditions, ML model predictions, and historical performance data.

## Monitoring and Analytics

The system provides enhanced real-time monitoring through a web-based dashboard, showing:

- Server load distribution with historical trends
- Traffic patterns and predictions
- Anomaly detection alerts with detailed explanations
- Performance metrics for each load balancing strategy
- ML model accuracy and performance over time
- Energy efficiency metrics

## Testing

Run the enhanced test suite:

```
npm test
```

For advanced load testing with various scenarios, use the updated script:

```
node src/loadTester.js
```

## Docker-based Test Environment

The project includes a Docker-based test environment that simulates multiple servers with different configurations. This allows for more realistic testing of the load balancer under various conditions.

### Setting up the Test Environment

1. Navigate to the `test` directory:
   ```
   cd test
   ```

2. Build and start the Docker containers:
   ```
   node manageTestEnvironment.js start
   ```

3. To stop the test environment:
   ```
   node manageTestEnvironment.js stop
   ```

4. To restart a specific server:
   ```
   node manageTestEnvironment.js restart server1
   ```

### Test Environment Structure

- `Dockerfile`: Defines the container image for simulated servers
- `docker-compose.yml`: Orchestrates multiple server containers with different configurations
- `simulateServers.js`: The main application that runs inside each container, simulating server behavior
- `manageTestEnvironment.js`: A utility script to manage the Docker-based test environment

The test environment simulates servers with various CPU, RAM, and network configurations, allowing for comprehensive testing of the load balancer's performance and decision-making capabilities.

## Deployment

For production deployment:

1. Set up a reverse proxy (e.g., Nginx) in front of the load balancer
2. Configure SSL/TLS
3. Set up a production-grade MongoDB instance
4. Adjust environment variables for production settings
5. Use a process manager like PM2 to run the application
6. Consider deploying the load balancer in a containerized environment for easier scaling

Refer to [Deployment Guide](./docs/deployment.md) for detailed instructions.

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

Please read [CONTRIBUTING.md](./CONTRIBUTING.md) for details on our code of conduct and the process for submitting pull requests.

## License

This project is licensed under the MIT License - see the [LICENSE.md](LICENSE.md) file for details.