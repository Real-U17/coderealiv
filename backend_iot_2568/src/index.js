const express = require('express');
const cors = require('cors');
const mqtt = require('mqtt');
const knex = require('./config');
const router = require('./router');

const app = express();
app.use(cors());
app.use(express.json());
app.use(router);

// MQTT client
const mqttClient = mqtt.connect('mqtt://broker.hivemq.com:1883');

// สถานะล่าสุด
let latestData = {
  voltage: 0,
  current: 0,
  power: 0,
  energy: 0,
  frequency: 0,
  pf: 0,
  sw01Status: 0  // สถานะล่าสุดของสวิตช์
};

let lastSaveTime = null;
let publishTimer = null;
const DEBOUNCE_DELAY = 1000; // 1 วินาที

// เมื่อต่อกับ MQTT broker ได้
mqttClient.on('connect', () => {
  console.log('Connected to MQTT broker');

  // Subscribe ทุก topic ที่ต้องการ
  const topics = [
    'sensor/voltage',
    'sensor/current',
    'sensor/power',
    'sensor/energy',
    'sensor/frequency',
    'sensor/pf',
    'esp32/sw01/status',  // command ที่ส่งออก
    'esp32/sw01/state'    //  ค่าจริงที่ ESP32 ตอบกลับ
  ];

  mqttClient.subscribe(topics);
});

// รับข้อความจาก MQTT
mqttClient.on('message', (topic, message) => {
  const msg = message.toString();

  //  รับสถานะจริงจาก ESP32
  if (topic === 'esp32/sw01/state') {
    latestData.sw01Status = parseInt(msg);
    console.log(`Actual switch state updated: ${latestData.sw01Status}`);
    return;
  }

  //  ไม่อัปเดตสถานะจากคำสั่งที่ส่งออก
  if (topic === 'esp32/sw01/status') {
    console.log(`Control command sent: ${msg}`);
    return;
  }

  //  Sensor readings
  const key = topic.split('/')[1];
  latestData[key] = parseFloat(msg);
  console.log(`Received: ${topic} = ${msg}`);

  const currentTime = new Date();
  const currentMinute = Math.floor(currentTime.getTime() / 60000);
  const lastSaveMinute = lastSaveTime ? Math.floor(lastSaveTime.getTime() / 60000) : null;

  // บันทึกทุก 1 นาที
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

//  API: สั่งเปิด/ปิด switch
app.post('/api/control', (req, res) => {
  const { value, device } = req.body;
  console.log("ส่งข้้อมูล:", req.body);
  if (value !== 0 && value !== 1) {
    return res.status(400).json({ error: 'Value must be 0 or 1' });
  }

  // ยกเลิก timer เดิม
  if (publishTimer) {
    clearTimeout(publishTimer);
  }

  // ส่ง MQTT หลัง delay 1 วินาที (กันสั่งซ้ำเร็วเกินไป)
  publishTimer = setTimeout(() => {
    const topic = 'esp32/sw01/status';
    mqttClient.publish(topic, value.toString(), { qos: 1, retain: true }, (err) => {
      if (err) {
        console.error('Failed to publish control message:', err);
      } else {
        console.log(`Control message sent: ${topic} = ${value}`);
      }
    });
  }, DEBOUNCE_DELAY);

  // ส่งตอบทันที
  res.json({
    success: true,
    message: `Control value ${value} sent to ESP32 switch`,
    status: value
  });
});

// API: ดึงสถานะสวิตช์
app.get('/api/switch-status', (req, res) => {
  res.json({ status: latestData.sw01Status });
});

// API: ดึงข้อมูลเซ็นเซอร์ล่าสุด
app.get('/api/sensor-data', (req, res) => {
  res.json(latestData);
});

// เริ่มเซิร์ฟเวอร์
app.listen(4000, '0.0.0.0', () => {
  console.log('API server running on port 4000');
});
