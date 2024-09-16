const tf = require('@tensorflow/tfjs-node');
const { loadModel, saveModel } = require('../../utils/modelPersistence');
const logger = require('../../utils/logger');

class MLModels {
  constructor() {
    this.models = {
      trafficPrediction: null,
      serverSelection: null,
      userBehavior: null,
      contentPopularity: null,
      anomalyDetection: null
    };
  }

  async initialize() {
    await this.loadModels();
  }

  async loadModels() {
    for (const modelName in this.models) {
      this.models[modelName] = await loadModel(modelName);
      if (!this.models[modelName]) {
        this.models[modelName] = await this[`create${modelName.charAt(0).toUpperCase() + modelName.slice(1)}Model`]();
        await saveModel(this.models[modelName], modelName);
      }
    }
  }

  async predict(contentInfo, serverProfiles, userInfo) {
    const trafficPrediction = await this.predictTraffic(contentInfo);
    const serverSelection = await this.selectServer(trafficPrediction, serverProfiles);
    const userBehavior = await this.predictUserBehavior(userInfo);
    const contentPopularity = await this.predictContentPopularity(contentInfo);
    const isAnomaly = await this.detectAnomaly(contentInfo, serverProfiles, userInfo);

    return {
      trafficPrediction,
      serverSelection,
      userBehavior,
      contentPopularity,
      isAnomaly
    };
  }

  async predictTraffic(contentInfo) {
    const preprocessedInfo = this.preprocessContentInfo(contentInfo);
    logger.info(`Predicting traffic with input: ${JSON.stringify(preprocessedInfo)}`);
    const input = tf.tensor2d([preprocessedInfo]);
    const prediction = this.models.trafficPrediction.predict(input);
    return prediction.dataSync()[0];
  }

  async selectServer(trafficPrediction, serverProfiles) {
    const input = tf.tensor2d([this.preprocessServerSelection(trafficPrediction, serverProfiles)]);
    const prediction = this.models.serverSelection.predict(input);
    return Array.from(prediction.dataSync());
  }

  async predictUserBehavior(userInfo) {
    const input = tf.tensor2d([this.preprocessUserInfo(userInfo)]);
    const prediction = this.models.userBehavior.predict(input);
    return Array.from(prediction.dataSync());
  }

  async predictContentPopularity(contentInfo) {
    const input = tf.tensor2d([this.preprocessContentInfo(contentInfo)]);
    const prediction = this.models.contentPopularity.predict(input);
    return prediction.dataSync()[0];
  }

  async detectAnomaly(contentInfo, serverProfiles, userInfo) {
    const input = tf.tensor2d([this.preprocessAnomalyDetection(contentInfo, serverProfiles, userInfo)]);
    const prediction = this.models.anomalyDetection.predict(input);
    return prediction.dataSync()[0] > 0.5;
  }

  preprocessContentInfo(contentInfo) {
    const features = [
      contentInfo.contentSize || 0,
      contentInfo.semanticAnalysis?.tokenCount || 0,
      contentInfo.geolocation?.country === 'unknown' ? 0 : 1,
      ...this.oneHotEncode(contentInfo.contentType || 'unknown', ['text', 'image', 'video', 'application']),
      contentInfo.expectedPopularity || 0,
      contentInfo.requestMethod === 'GET' ? 1 : 0,
      contentInfo.requestMethod === 'POST' ? 1 : 0,
      contentInfo.path?.length || 0,
      contentInfo.queryParams || 0
    ];

    while (features.length < 9) {
      features.push(0);
    }

    if (features.length > 9) {
      features.length = 9;
    }

    logger.info(`Preprocessed content info: ${JSON.stringify(features)}`);
    return features;
  }

  preprocessServerSelection(trafficPrediction, serverProfiles) {
    return [
      trafficPrediction,
      ...serverProfiles.flatMap(profile => [
        profile.currentLoad || 0,
        profile.performance || 0,
        profile.activeConnections || 0
      ])
    ];
  }

  preprocessUserInfo(userInfo) {
    const defaultUserInfo = {
      sessionDuration: 0,
      pageViews: 0,
      bounceRate: 0,
      deviceType: 'unknown',
      userType: 'new'
    };

    const mergedUserInfo = { ...defaultUserInfo, ...userInfo };

    logger.info(`Preprocessing user info: ${JSON.stringify(mergedUserInfo)}`);

    const preprocessed = [
      mergedUserInfo.sessionDuration,
      mergedUserInfo.pageViews,
      mergedUserInfo.bounceRate,
      ...this.oneHotEncode(mergedUserInfo.deviceType, ['mobile', 'tablet', 'desktop']),
      ...this.oneHotEncode(mergedUserInfo.userType, ['new', 'returning', 'frequent'])
    ];

    logger.info(`Preprocessed user info: ${JSON.stringify(preprocessed)}`);
    return preprocessed;
  }

  preprocessAnomalyDetection(contentInfo, serverProfiles, userInfo) {
    const preprocessed = [
      ...this.preprocessContentInfo(contentInfo),
      ...this.preprocessServerSelection(0, serverProfiles),
      ...this.preprocessUserInfo(userInfo)
    ];
    logger.info(`Preprocessed anomaly detection input: ${JSON.stringify(preprocessed)}`);
    return preprocessed;
  }

  oneHotEncode(value, categories) {
    return categories.map(category => value === category ? 1 : 0);
  }

  async createTrafficPredictionModel() {
    const model = tf.sequential();
    model.add(tf.layers.dense({ units: 64, activation: 'relu', inputShape: [9] }));
    model.add(tf.layers.dense({ units: 32, activation: 'relu' }));
    model.add(tf.layers.dense({ units: 1 }));
    model.compile({ optimizer: 'adam', loss: 'meanSquaredError' });
    return model;
  }

  async createServerSelectionModel() {
    const model = tf.sequential();
    model.add(tf.layers.dense({ units: 64, activation: 'relu', inputShape: [16] })); // 1 + 3 * 5 servers
    model.add(tf.layers.dense({ units: 32, activation: 'relu' }));
    model.add(tf.layers.dense({ units: 5, activation: 'softmax' }));
    model.compile({ optimizer: 'adam', loss: 'categoricalCrossentropy' });
    return model;
  }

  async createUserBehaviorModel() {
    const model = tf.sequential();
    model.add(tf.layers.dense({ units: 32, activation: 'relu', inputShape: [9] }));
    model.add(tf.layers.dense({ units: 16, activation: 'relu' }));
    model.add(tf.layers.dense({ units: 3, activation: 'softmax' }));
    model.compile({ optimizer: 'adam', loss: 'categoricalCrossentropy' });
    return model;
  }

  async createContentPopularityModel() {
    const model = tf.sequential();
    model.add(tf.layers.dense({ units: 32, activation: 'relu', inputShape: [9] }));
    model.add(tf.layers.dense({ units: 16, activation: 'relu' }));
    model.add(tf.layers.dense({ units: 1, activation: 'sigmoid' }));
    model.compile({ optimizer: 'adam', loss: 'binaryCrossentropy' });
    return model;
  }

  async createAnomalyDetectionModel() {
    const model = tf.sequential();
    model.add(tf.layers.dense({ units: 64, activation: 'relu', inputShape: [34] })); // 9 + 16 + 9
    model.add(tf.layers.dense({ units: 32, activation: 'relu' }));
    model.add(tf.layers.dense({ units: 1, activation: 'sigmoid' }));
    model.compile({ optimizer: 'adam', loss: 'binaryCrossentropy' });
    return model;
  }

  async train(data, analysisModule) {
    for (const modelName in this.models) {
      const modelData = data[modelName];
      if (modelData && modelData.x && modelData.y) {
        const { x, y } = modelData;
        const xTensor = tf.tensor2d(x);
        const yTensor = tf.tensor2d(y);
        
        await this.models[modelName].fit(xTensor, yTensor, {
          epochs: 10,
          validationSplit: 0.2,
          callbacks: {
            onEpochEnd: (epoch, logs) => {
              logger.info(`Training ${modelName} - Epoch ${epoch}: loss = ${logs.loss}`);
              if (analysisModule) {
                analysisModule.recordTraining(modelName, epoch, logs.loss);
              }
            }
          }
        });

        await saveModel(this.models[modelName], modelName);
        logger.info(`Model ${modelName} trained and saved successfully`);
      }
    }
  }
}

module.exports = MLModels;