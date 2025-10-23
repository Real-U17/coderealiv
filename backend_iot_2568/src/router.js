// routes.js
const { Router } = require('express');
const getUser = require('./controllers/getUser');
const getEmail = require('./controllers/getOneUser');
const {   
  getLatestSensorData,   
  getHistoricalData,
  getAvailableDates,
  predictEnergyConsumption
} = require('./controllers/getSensorHistory');

// เพิ่ม import สำหรับ trainModel และ predictPower
const { trainModel, predictPower } = require('./controllers/power-predict');

const router = Router();

router.get('/', (req, res) => {    
  res.send('Hello World');
});

router.get('/get-users', getUser);
router.get('/get-email', getEmail);
router.get('/get-sensor-history', getHistoricalData);
router.get('/get-latest-sensor-data', getLatestSensorData);
router.get('/get-available-dates', getAvailableDates);

// เพิ่ม routes สำหรับ trainModel และ predictPower
router.post('/train-model', trainModel);
router.get('/predict-power', predictPower);
router.post('/predict-power', predictEnergyConsumption);

module.exports = router;