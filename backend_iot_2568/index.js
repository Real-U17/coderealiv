const express = require('express');
const cors = require('cors');
const mqtt = require('mqtt');
const knex = require('./config');
const router = require('./router'); // (หมายเหตุ: ไฟล์นี้ไม่ได้ใช้ในโค้ดตัวอย่าง แต่คุณมี)
const dotenv = require('dotenv');
const axios = require('axios');

const app = express();
app.use(cors());
app.use(express.json());
// app.use(router); // <-- (คุณอาจจะต้องเปิดใช้บรรทัดนี้ ถ้า router.js มี route อื่นๆ)
dotenv.config();

// --- Load settings from .env ---
const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const TELEGRAM_CHAT_ID = process.env.TELEGRAM_CHAT_ID;
const WARNING_LIMIT = parseFloat(process.env.POWER_WARNING_LIMIT || 2000);
const CUTOFF_LIMIT = parseFloat(process.env.POWER_CUTOFF_LIMIT || 2300);
const COOLDOWN_PERIOD_MS = 300 * 1000; // 5 นาที

// --- State variables for notifications ---
let warningSentTimestamp = 0;
let cutoffSentTimestamp = 0;

// --- MQTT Connection ---
const mqttClient = mqtt.connect('mqtt://broker.hivemq.com:1883');
let publishTimer = null;
const DEBOUNCE_DELAY = 1000; // 1 วินาที

// --- Main Data Object ---
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

// --- Function to send Telegram message (for Alerts) ---
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

// --- Function for publishing control commands ---
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

// --- Logic for checking power (Alerts & Cutoff) ---
function processPowerData(currentWatts) {
  const currentTime = Date.now();

  // 1. Cutoff Check
  if (currentWatts > CUTOFF_LIMIT) {
    console.log(`Power CRITICAL: ${currentWatts}W`);
    
    if (currentTime - cutoffSentTimestamp > COOLDOWN_PERIOD_MS) {
      console.log("Cutoff limit reached. Sending command and notification.");
      
      publishControlCommand(0); // สั่งตัดไฟ
      latestData.sw01Status = 0; // (FIX #1) อัปเดตสถานะ
      
      const message = `🚨 *ตัดการทำงาน!* 🚨\nใช้ไฟเกินกำหนด (${currentWatts.toFixed(2)} W)\nระบบได้ตัดไฟอัตโนมัติแล้ว`;
      sendTelegramMessage(message);
      
      cutoffSentTimestamp = currentTime;
      warningSentTimestamp = currentTime;
    }
  }
  
  // 2. Warning Check
  else if (currentWatts > WARNING_LIMIT) {
    console.log(`Power WARNING: ${currentWatts}W`);
    
    if (currentTime - warningSentTimestamp > COOLDOWN_PERIOD_MS) {
      console.log("Warning limit reached. Sending notification.");
      
      const message = `⚠️ *แจ้งเตือน!* ⚠️\nใช้ไฟใกล้เกินกำหนด (${currentWatts.toFixed(2)} W)\nกรุณาลดการใช้เครื่องใช้ไฟฟ้า`;
      sendTelegramMessage(message);
      
      warningSentTimestamp = currentTime;
    }
  }
  
  // 3. Normal State
  else {
    if (warningSentTimestamp > 0) {
        warningSentTimestamp = 0;
    }
    if (cutoffSentTimestamp > 0 && currentWatts < WARNING_LIMIT) {
        cutoffSentTimestamp = 0; 
    }
  }
}


// --- MQTT Connection Events ---
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

// --- MQTT Message Handler (Main Logic) ---
mqttClient.on('message', (topic, message) => {
  // 1. Switch Status Update
  if (topic === 'esp32/sw01/status') {
    const newStatus = parseInt(message.toString());
    if (latestData.sw01Status !== newStatus) {
        latestData.sw01Status = newStatus;
        console.log(`Switch status updated *from MQTT*: ${latestData.sw01Status}`);
    }
    return;
  }

  // 2. Sensor Data Update
  const key = topic.split('/')[1];
  if (latestData.hasOwnProperty(key)) {
    latestData[key] = parseFloat(message.toString());
    console.log(`Received: ${topic} = ${latestData[key]}`);

    if (key === 'power') {
      processPowerData(latestData.power); // ตรวจสอบไฟทุกครั้งที่อัปเดต
    }
  }

  // 3. Database Logging (Every 1 minute)
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

// --- API endpoint for Frontend (Manual control) ---
app.post('/api/control', (req, res) => {
  const { value, device } = req.body; 
  console.log("API /api/control called with value =", value);

  if (value !== 0 && value !== 1) {
    return res.status(400).json({ error: 'Value must be 0 or 1' });
  }

  latestData.sw01Status = value; // (FIX #2) อัปเดตสถานะทันที

  if (publishTimer) {
    clearTimeout(publishTimer);
  }
  
  publishTimer = setTimeout(() => {
    publishControlCommand(value); 
  }, DEBOUNCE_DELAY);

  res.json({
    success: true,
    message: `Control value ${value} sent to ESP32 switch`,
    status: value
  });
});

// --- API endpoints for Frontend (Get Data) ---
app.get('/api/switch-status', (req, res) => {
  res.json({ status: latestData.sw01Status });
});

app.get('/api/sensor-data', (req, res) => {
  res.json(latestData);
});

// -----------------------------------------------------------------
// --- ⬇⬇⬇ นี่คือส่วนที่ขาดไป (AI CHATBOT WEBHOOK) ⬇⬇⬇ ---
// -----------------------------------------------------------------
app.post('/ai-webhook', (req, res) => {
  // ดึงชื่อ "ความตั้งใจ" (Intent) ที่ AI วิเคราะห์ได้
  const intentName = req.body.queryResult.intent.displayName;
  console.log(`[AI Webhook] Received intent: ${intentName}`);

  let responseText = "ขออภัยค่ะ ฉันไม่สามารถตรวจสอบข้อมูลได้ในขณะนี้"; // ค่าเริ่มต้น

  // --- ตรวจสอบว่า AI ต้องการอะไร ---
  if (intentName === 'GetCurrentPower') {
    // (ถ้า AI วิเคราะห์ได้ว่าคนถามค่าไฟ)
    const currentPower = latestData.power; // ดึงข้อมูลจริงจากตัวแปร
    responseText = `ตอนนี้ใช้ไฟอยู่ ${currentPower.toFixed(2)} วัตต์ค่ะ`;
  }
  
  // (ตัวอย่าง: ถ้าคุณสร้าง Intent ชื่อ 'ControlLight' ในอนาคต)
  // if (intentName === 'ControlLight') {
  //   const state = req.body.queryResult.parameters.state; // สมมติว่ามี parameter 'state' (เปิด/ปิด)
  //   if (state === 'เปิด') {
  //     publishControlCommand(1);
  //     latestData.sw01Status = 1;
  //     responseText = "รับทราบค่ะ สั่งเปิดไฟแล้ว";
  //   } else if (state === 'ปิด') {
  //     publishControlCommand(0);
  //     latestData.sw01Status = 0;
  //     responseText = "รับทราบค่ะ สั่งปิดไฟแล้ว";
  //   }
  // }

  // --- ส่งคำตอบ (JSON) กลับไปให้ Dialogflow ---
  res.json({
    fulfillmentText: responseText
  });
});

// --- ⬇⬇⬇ เพิ่ม API นี้เข้าไป ⬇⬇⬇ ---
// (คอมเมนต์: API นี้สำหรับดึงข้อมูลประวัติย้อนหลัง)
app.get('/get-sensor-history', async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 100; // ตั้งค่าเริ่มต้นให้ดึง 100 รายการ

    const data = await knex('sensor_readings')
      .orderBy('timestamp', 'desc') // เรียงจากใหม่ไปเก่า
      .limit(limit);

    res.json(data); // ส่งข้อมูลประวัติกลับไป

  } catch (error) {
    console.error("Error fetching sensor history:", error);
    res.status(500).json({ error: 'Failed to fetch history' });
  }
});

// --- Start Server ---
app.listen(4000, '0.0.0.0', () => {
  console.log('API server running on port 4000');
  console.log(`Power limits set: WARN at ${WARNING_LIMIT}W, CUTOFF at ${CUTOFF_LIMIT}W`);
});