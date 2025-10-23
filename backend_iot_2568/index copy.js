const express = require('express');
const cors = require('cors');
const mqtt = require('mqtt');
const knex = require('./config');
const router = require('./router');
const dotenv = require('dotenv');
const app = express();
app.use(cors());
app.use(express.json());
app.use(router);
dotenv.config();

// const mqttClient = mqtt.connect('broker.hivemq.com');
const mqttClient = mqtt.connect('mqtt://broker.hivemq.com:1883');
let publishTimer = null;
const DEBOUNCE_DELAY = 1000; // 1 วินาที

let latestData = {
  voltage: 0,
  current: 0,
  power: 0,
  energy: 0,
  frequency: 0,
  pf: 0,
  sw01Status: 0  // เพิ่มสถานะสวิตช์
};

let lastSaveTime = null;

mqttClient.on('connect', () => {
  console.log('Connected to MQTT broker');
  const topics = [
    'sensor/voltage',
    'sensor/current',
    'sensor/power',
    'sensor/energy',
    'sensor/frequency',
    'sensor/pf',
    'esp32/sw01/status'  // เพิ่ม topic สำหรับติดตามสถานะสวิตช์
  ];

  mqttClient.subscribe(topics);
});

mqttClient.on('message', (topic, message) => {
  //จัดการข้อมูลที่ได้รับจาก MQTT
  if (topic === 'esp32/sw01/status') {
    latestData.sw01Status = parseInt(message.toString());
    console.log(`Switch status updated: ${latestData.sw01Status}`);
    return;
  }

  const key = topic.split('/')[1];
  latestData[key] = parseFloat(message.toString());
  console.log(`Received: ${topic} = ${message.toString()}`);

  const currentTime = new Date();
  const currentMinute = Math.floor(currentTime.getTime() / 60000);
  const lastSaveMinute = lastSaveTime ? Math.floor(lastSaveTime.getTime() / 60000) : null;

  if (!lastSaveTime || currentMinute > lastSaveMinute) {
    knex('sensor_readings').insert({
      voltage: latestData.voltage,
      current: latestData.current,
      power: latestData.power,
      energy: latestData.energy,
      frequency: latestData.frequency,
      pf: latestData.pf,
      timestamp: currentTime
    })
      .then(() => {
        console.log('Data saved to sensor_readings table at:', currentTime);
        lastSaveTime = currentTime;
      })
      .catch(err => console.error('Failed to save data to sensor_readings table:', err));
  } else {
    console.log('Skipping save - same minute as last save');
  }
});

// ปรับปรุง API endpoint สำหรับควบคุม ESP32
app.post('/api/control', (req, res) => {
  const { value, device } = req.body;
  console.log("value, deviceทุกๆ 1 =", req.body)

  if (value !== 0 && value !== 1) {
    return res.status(400).json({ error: 'Value must be 0 or 1' });
  }
  // ยกเลิก timer เดิม (ถ้ามี)
  if (publishTimer) {
    clearTimeout(publishTimer);
  }
  // สร้าง timer ใหม่
  publishTimer = setTimeout(() => {
    const topic = 'esp32/sw01/status';
    mqttClient.publish(topic, value.toString(), { qos: 1, retain: true }, (err) => {
      if (err) {
        console.error('Failed to publish control message:', err);
      }
      console.log(`Control message sent: ${topic} = ${value}`);
    });
  }, DEBOUNCE_DELAY);

  // ตอบกลับทันที
  res.json({
    success: true,
    message: `Control value ${value} sent to ESP32 switch`,
    status: value
  });
});

// เพิ่ม endpoint สำหรับดึงสถานะสวิตช์
app.get('/api/switch-status', (req, res) => {
  res.json({ status: latestData.sw01Status });
});

app.get('/api/sensor-data', (req, res) => {
  res.json(latestData);
});

app.listen(4000, '0.0.0.0', () => {
  console.log('API server running on port 4000');
});