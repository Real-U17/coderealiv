const tf = require('@tensorflow/tfjs');
const knex = require('../config');
const fs = require('fs').promises;
const path = require('path');

// Enhanced logging function
function log(message, type = 'info') {
  const timestamp = new Date().toISOString();
  const logMessage = `[${timestamp}] [${type.toUpperCase()}] ${message}`;
  console.log(logMessage);
  
  // Optional: Write to log file
  fs.appendFile(path.join(__dirname, '../logs/power-predict.log'), logMessage + '\n')
    .catch(err => console.error('Error writing to log file:', err));
}

async function prepareData() {
  try {
    const data = await knex('sensor_readings')
      .select(
        knex.raw('DATE_FORMAT(timestamp, "%Y-%m") AS month'),
        knex.raw('AVG(power) AS avg_power'),
        knex.raw('SUM(energy) AS total_energy')
      )
      .groupByRaw('DATE_FORMAT(timestamp, "%Y-%m")')
      .orderBy('month', 'asc');

    log(`Prepared data for training: ${data.length} months`);

    const xs = data.map(d => [parseFloat(d.avg_power)]);
    const ys = data.map(d => [parseFloat(d.total_energy)]);

    return [xs, ys];
  } catch (error) {
    log(`Error preparing data: ${error.message}`, 'error');
    throw error;
  }
}

function createModel() {
  const model = tf.sequential();

  model.add(tf.layers.dense({ 
    units: 64, 
    activation: 'relu', 
    inputShape: [1],
    kernelInitializer: 'heNormal'
  }));
  
  model.add(tf.layers.dropout({ rate: 0.2 })); // Add dropout for regularization
  
  model.add(tf.layers.dense({ 
    units: 32, 
    activation: 'relu',
    kernelInitializer: 'heNormal'
  }));
  
  model.add(tf.layers.dense({ units: 1 }));

  model.compile({ 
    optimizer: tf.train.adam(0.001), 
    loss: 'meanSquaredError',
    metrics: ['mae'] 
  });

  return model;
}

module.exports = {
  trainModel: async (req, res) => {
    try {
      log('Starting model training');
      const [xs, ys] = await prepareData();

      const model = createModel();
      const xsTensor = tf.tensor2d(xs);
      const ysTensor = tf.tensor2d(ys);

      const history = await model.fit(xsTensor, ysTensor, {
        epochs: 200,
        batchSize: 8,
        validationSplit: 0.2,
        callbacks: {
          onEpochEnd: async (epoch, logs) => {
            if (epoch % 20 === 0) {
              log(`Epoch ${epoch}: loss = ${logs.loss}, val_loss = ${logs.val_loss}`);
            }
          }
        }
      });

      // Save model with additional metadata
      const modelSavePath = path.join(__dirname, '../model');
      await model.save(`file://${modelSavePath}`);

      log('Model training completed successfully');
      
      res.status(200).json({ 
        message: 'Model trained successfully.',
        trainingStats: {
          finalLoss: history.history.loss[history.history.loss.length - 1],
          finalValLoss: history.history.val_loss[history.history.val_loss.length - 1]
        }
      });
    } catch (error) {
      log(`Model training failed: ${error.message}`, 'error');
      res.status(500).json({ error: error.message });
    }
  },

  predictPower: async (req, res) => {
    try {
      log('Starting power prediction');
      const { power } = req.body;
  
      if (power === undefined || power === null) {
        log('No power value provided', 'warn');
        return res.status(400).json({ error: 'Power value is required' });
      }
  
      // โหลดรุ่นด้วยการจัดการข้อผิดพลาดที่ดีขึ้น
      const modelPath = path.join(__dirname, '../model/model.json');
      let model;
      try {
        model = await tf.loadLayersModel(`file://${modelPath}`);
      } catch (loadError) {
        log(`Model loading failed: ${loadError.message}`, 'error');
        return res.status(500).json({ error: 'Could not load prediction model' });
      }
  
      // ทำนายด้วยการตรวจสอบข้อมูลป้อนเข้า
      const inputTensor = tf.tensor2d([[power]], [1, 1]);
      const prediction = model.predict(inputTensor).dataSync()[0];
  
      if (isNaN(prediction) || prediction < 0) {
        log('Prediction resulted in an invalid value', 'warn');
        return res.status(500).json({ error: 'Prediction failed' });
      }
  
      log(`Power prediction: input=${power}, predicted energy=${prediction}`);
      res.status(200).json({
        energy: prediction,
        confidence: {
          input: power,
          method: 'TensorFlow.js Sequential Model'
        }
      });
    } catch (error) {
      log(`Prediction error: ${error.message}`, 'error');
      res.status(500).json({ error: error.message });
    }
  }
};