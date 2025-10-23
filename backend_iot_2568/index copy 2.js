const express = require('express');
const cors = require('cors');
const mqtt = require('mqtt');
const knex = require('./config');
const router = require('./router');
const dotenv = require('dotenv');
const axios = require('axios'); // --- ADDED ---

const app = express();
app.use(cors());
app.use(express.json());
app.use(router);
dotenv.config();

// --- ADDED: Load settings from .env ---
const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const TELEGRAM_CHAT_ID = process.env.TELEGRAM_CHAT_ID;
const WARNING_LIMIT = parseFloat(process.env.POWER_WARNING_LIMIT || 2000);
const CUTOFF_LIMIT = parseFloat(process.env.POWER_CUTOFF_LIMIT || 2300);
const COOLDOWN_PERIOD_MS = 300 * 1000; // 5 นาที (กันแจ้งเตือนรัว)

// --- ADDED: State variables for notifications ---
let warningSentTimestamp = 0;
let cutoffSentTimestamp = 0;

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
  sw01Status: 0 
};

let lastSaveTime = null;

// --- ADDED: Function to send Telegram message ---
async function sendTelegramMessage(message) {
  if (!TELEGRAM_BOT_TOKEN || !TELEGRAM_CHAT_ID) {
    console.warn("Telegram Token/ChatID is not set. Skipping notification.");
    return;
  }
  const url = `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`;
  const payload = {
    chat_id: TELEGRAM_CHAT_ID,
    text: message,
    parse_mode: "Markdown",
  };

  try {
    await axios.post(url, payload);
    console.log("Telegram message sent successfully.");
  } catch (error) {
    console.error("Error sending Telegram message:", error.response ? error.response.data.description : error.message);
  }
}

// --- ADDED: Centralized function for publishing control commands ---
// (ฟังก์ชันนี้จะส่งคำสั่งทันที ไม่ debounce)
function publishControlCommand(value) {
  const topic = 'esp32/sw01/status';
  const command = value.toString();
  
  mqttClient.publish(topic, command, { qos: 1, retain: true }, (err) => {
    if (err) {
      console.error('Failed to publish control message:', err);
    }
    console.log(`Control message sent: ${topic} = ${command}`);
  });
}

// --- ADDED: Logic for checking power and sending alerts ---
function processPowerData(currentWatts) {
  const currentTime = Date.now();

  // 1. ตรวจสอบ "เกินกำหนด" (Cutoff)
  if (currentWatts > CUTOFF_LIMIT) {
    console.log(`Power CRITICAL: ${currentWatts}W`);
    
    // เช็ค Cooldown ว่าเพิ่งส่งข้อความตัดไฟไปหรือยัง
    if (currentTime - cutoffSentTimestamp > COOLDOWN_PERIOD_MS) {
      console.log("Cutoff limit reached. Sending command and notification.");
      
      // 1.1 สั่งตัดไฟ (ส่ง "0" ไปที่ ESP32)
      publishControlCommand(0); // <<< สั่งตัดไฟทันที

      // --- ⬇⬇⬇ *** FIX #1: อัปเดตสถานะเมื่อตัดไฟอัตโนมัติ *** ⬇⬇⬇ ---
      // (คอมเมนต์: เพิ่มบรรทัดนี้เพื่อให้สถานะในเซิร์ฟเวอร์
      //  อัปเดตเป็น "ปิด" (0) เมื่อระบบตัดไฟอัตโนมัติ)
      latestData.sw01Status = 0;
      // --- ⬆⬆⬆ *** END OF FIX #1 *** ⬆⬆⬆ ---
      
      // 1.2 ส่งแจ้งเตือน Telegram
      const message = `🚨 *ตัดการทำงาน!* 🚨\nใช้ไฟเกินกำหนด (${currentWatts.toFixed(2)} W)\nระบบได้ตัดไฟอัตโนมัติแล้ว`;
      sendTelegramMessage(message);
      
      // 1.3 บันทึกเวลาที่ส่ง
      cutoffSentTimestamp = currentTime;
      warningSentTimestamp = currentTime; // รีเซ็ตเวลาเตือนด้วย
    }
  }
  
  // 2. ตรวจสอบ "กำลังจะเกิน" (Warning) (ถ้ายังไม่ถึงขั้นตัดไฟ)
  else if (currentWatts > WARNING_LIMIT) {
    console.log(`Power WARNING: ${currentWatts}W`);
    
    // เช็ค Cooldown ว่าเพิ่งส่งข้อความเตือนไปหรือยัง
    if (currentTime - warningSentTimestamp > COOLDOWN_PERIOD_MS) {
      console.log("Warning limit reached. Sending notification.");
      
      const message = `⚠️ *แจ้งเตือน!* ⚠️\nใช้ไฟใกล้เกินกำหนด (${currentWatts.toFixed(2)} W)\nกรุณาลดการใช้เครื่องใช้ไฟฟ้า`;
      sendTelegramMessage(message);
      
      warningSentTimestamp = currentTime; // บันทึกเวลาที่ส่ง
    }
  }
  
  // 3. สถานะปกติ
  else {
    // (ส่วนนี้ไม่มีการแก้ไข)
    if (warningSentTimestamp > 0) {
        console.log("Power is back to normal (below warning). Resetting warning timestamp.");
        warningSentTimestamp = 0;
    }
    if (cutoffSentTimestamp > 0 && currentWatts < WARNING_LIMIT) {
        console.log("Power is back to normal (below cutoff). Resetting cutoff timestamp.");
        cutoffSentTimestamp = 0; 
    }
  }
}


// --- MQTT Connection ---
mqttClient.on('connect', () => {
  console.log('Connected to MQTT broker');
  const topics = [
    'sensor/voltage',
    'sensor/current',
    'sensor/power',
    'sensor/energy',
    'sensor/frequency',
    'sensor/pf',
    'esp32/sw01/status' 
  ];
  mqttClient.subscribe(topics);
});

// --- MODIFIED: MQTT Message Handler ---
mqttClient.on('message', (topic, message) => {
  // 1. จัดการสถานะสวิตช์
  if (topic === 'esp32/sw01/status') {
    // (คอมเมนต์: เราจะอัปเดตสถานะจาก Arduino โดยตรงด้วย
    // เผื่อว่ามีการเปิด/ปิดไฟจากที่อื่น (เช่น กดปุ่มที่ตัว ESP32 เอง))
    const newStatus = parseInt(message.toString());
    if (latestData.sw01Status !== newStatus) {
        latestData.sw01Status = newStatus;
        console.log(`Switch status updated *from MQTT*: ${latestData.sw01Status}`);
    }
    return; // จบการทำงานสำหรับ message นี้
  }

  // 2. จัดการข้อมูล Sensor
  const key = topic.split('/')[1];
  if (latestData.hasOwnProperty(key)) {
    latestData[key] = parseFloat(message.toString());
    console.log(`Received: ${topic} = ${latestData[key]}`);

    if (key === 'power') {
      processPowerData(latestData.power);
    }
  }

  // 3. จัดการการบันทึกข้อมูลลง DB (ทุก 1 นาที)
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
  }
});

// --- MODIFIED: API endpoint for manual control ---
app.post('/api/control', (req, res) => {
  const { value, device } = req.body; 
  console.log("API /api/control called with value =", value);

  if (value !== 0 && value !== 1) {
    return res.status(400).json({ error: 'Value must be 0 or 1' });
  }

  // --- ⬇⬇⬇ *** FIX #2: อัปเดตสถานะเมื่อสั่งงานด้วยมือ *** ⬇⬇⬇ ---
  // (คอมเมนต์: เพิ่มบรรทัดนี้เพื่ออัปเดตสถานะในเซิร์ฟเวอร์ทันที
  //  ป้องกันปัญหาปุ่มหมุนค้างใน Frontend)
  latestData.sw01Status = value;
  // --- ⬆⬆⬆ *** END OF FIX #2 *** ⬆⬆⬆ ---

  // ยกเลิก timer เดิม (Debounce)
  if (publishTimer) {
    clearTimeout(publishTimer);
  }
  
  // สร้าง timer ใหม่ (Debounce)
  publishTimer = setTimeout(() => {
    // เรียกใช้ฟังก์ชันกลางที่สร้างไว้
    publishControlCommand(value); 
  }, DEBOUNCE_DELAY);

  // ตอบกลับ API ทันที (ไม่ต้องรอ publish)
  res.json({
    success: true,
    message: `Control value ${value} sent to ESP32 switch`,
    status: value
  });
});

// (Endpoint อื่นๆ ไม่เปลี่ยนแปลง)
app.get('/api/switch-status', (req, res) => {
  res.json({ status: latestData.sw01Status });
});

app.get('/api/sensor-data', (req, res) => {
  res.json(latestData);
});

app.listen(4000, '0.0.0.0', () => {
  console.log('API server running on port 4000');
  console.log(`Power limits set: WARN at ${WARNING_LIMIT}W, CUTOFF at ${CUTOFF_LIMIT}W`);
});