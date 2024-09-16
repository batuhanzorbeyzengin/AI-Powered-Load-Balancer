const tf = require('@tensorflow/tfjs-node');
const fs = require('fs').promises;
const path = require('path');
const logger = require('./logger');

const MODEL_DIR = path.join(__dirname, '..', 'saved_models');

async function ensureModelDir() {
  try {
    await fs.mkdir(MODEL_DIR, { recursive: true });
  } catch (error) {
    logger.error('Error creating model directory', { error });
    throw error;
  }
}

async function saveModel(model, modelName) {
  try {
    await ensureModelDir();
    const modelPath = path.join(MODEL_DIR, modelName);
    await model.save(`file://${modelPath}`);
    logger.info(`Model ${modelName} saved successfully`);
  } catch (error) {
    logger.error('Error saving model', { modelName, error });
    throw error;
  }
}

async function loadModel(modelName) {
  try {
    const modelPath = path.join(MODEL_DIR, modelName);
    if (await fs.access(modelPath).then(() => true).catch(() => false)) {
      const model = await tf.loadLayersModel(`file://${modelPath}/model.json`);
      logger.info(`Model ${modelName} loaded successfully`);
      return model;
    } else {
      logger.info(`Model ${modelName} not found, will create a new one`);
      return null;
    }
  } catch (error) {
    logger.error('Error loading model', { modelName, error });
    return null;
  }
}

module.exports = {
  saveModel,
  loadModel
};