const db = require("../config");
const tf = require('@tensorflow/tfjs'); 
const { format } = require('date-fns');



const predictEnergyConsumption = async (req, res) => {
  try {
    // ดึงข้อมูลประวัติจากฐานข้อมูล
    const historicalData = await db("sensor_readings")
      .select('power')
      .where('power', '>', 0)
      .orderBy("timestamp", "asc");

    // ตรวจสอบว่ามีข้อมูลหรือไม่
    if (historicalData.length === 0) {
      return res.status(404).json({ error: "No historical data available for prediction." });
    }

    // แยกค่าพลังงานออก
    const powerValues = historicalData.map(item => item.power);

    // คำนวณพลังงานรวมในเดือนล่าสุด
    const totalPower = powerValues.reduce((acc, value) => acc + value, 0);
    const averagePower = totalPower / powerValues.length; // คำนวณค่าเฉลี่ย

    // ปรับปรุงการคำนวณพลังงานในเดือนถัดไป
    const predictedEnergy = averagePower * 30; // ใช้ค่าเฉลี่ยเป็นตัวตั้งต้น
    const predictedCost = calculateMonthlyCost(predictedEnergy / 1000); // แปลงเป็น kWh

    console.log('Predicted Energy:', predictedEnergy);
    console.log('Predicted Cost:', predictedCost);

    res.json({ energy: predictedEnergy, cost: predictedCost });
  } catch (error) {
    console.error("Error in predicting energy consumption:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};


// ฟังก์ชันคำนวณค่าไฟฟ้ารายเดือน
function calculateMonthlyCost(energy) {
  let cost = 0;

  // คำนวณค่าใช้จ่ายตามอัตรา
  if (energy <= 15) {
    cost = energy * 2.3488;
  } else if (energy <= 25) {
    cost = (15 * 2.3488) + ((energy - 15) * 2.9882);
  } else if (energy <= 35) {
    cost = (15 * 2.3488) + (10 * 2.9882) + ((energy - 25) * 3.2405);
  } else if (energy <= 100) {
    cost = (15 * 2.3488) + (10 * 2.9882) + (10 * 3.2405) + ((energy - 35) * 3.6237);
  } else if (energy <= 150) {
    cost = (15 * 2.3488) + (10 * 2.9882) + (10 * 3.2405) + (65 * 3.6237) + ((energy - 100) * 3.7171);
  } else if (energy <= 400) {
    cost = (15 * 2.3488) + (10 * 2.9882) + (10 * 3.2405) + (65 * 3.6237) + (50 * 3.7171) + ((energy - 150) * 4.2218);
  } else {
    cost = (15 * 2.3488) + (10 * 2.9882) + (10 * 3.2405) + (65 * 3.6237) + (50 * 3.7171) + (250 * 4.2218) + ((energy - 400) * 4.4217);
  }

  return Number(cost.toFixed(4)); // คืนค่าที่คำนวณได้ในรูปแบบที่มีทศนิยม 4 ตำแหน่ง
}

const getAvailableDates = async (req, res) => {
  try {
    const data = await db("sensor_readings")
      .select(db.raw('DATE(timestamp) as date'))
      .where('power', '>', 0)
      .groupBy(db.raw('DATE(timestamp)'))
      .orderBy('date', 'desc');

    const availableDates = data.map(item => {
      const date = new Date(item.date);
      return format(date, 'yyyy-MM-dd');
    });

    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Methods", "GET, OPTIONS");
    res.header("Access-Control-Allow-Headers", "Content-Type, Authorization");

    res.json(availableDates);
  } catch (error) {
    console.error("Error fetching available dates:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

const getLatestSensorData = async (req, res) => {
  try {
    const [data] = await db("sensor_readings")
      .where('power', '>', 0)
      .orderBy("timestamp", "desc")
      .limit(1);

    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Methods", "GET, OPTIONS");
    res.header("Access-Control-Allow-Headers", "Content-Type, Authorization");

    if (!data) {
      return res.status(404).json({ message: "No data found" });
    }

    res.json(data);
  } catch (error) {
    console.error("Error fetching latest sensor data:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

const getHistoricalData = async (req, res) => {
  const { limit = 1000, start, end } = req.query;

  try {
    let query = db("sensor_readings")
      .where('power', '>', 0)
      .orderBy("timestamp", "asc"); // เปลี่ยนเป็น asc เพื่อเรียงตามเวลาจากน้อยไปมาก

    if (start && end) {
      query = query.whereBetween("timestamp", [new Date(start), new Date(end)]);
    }

    if (limit) {
      query = query.limit(Number(limit));
    }

    const data = await query;

    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Methods", "GET, OPTIONS");
    res.header("Access-Control-Allow-Headers", "Content-Type, Authorization");

    if (!data.length) {
      return res.status(404).json({ message: "No data found" });
    }

    res.json(data);
  } catch (error) {
    console.error("Error fetching historical data:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

module.exports = {
  getLatestSensorData,
  getHistoricalData,
  getAvailableDates,
  predictEnergyConsumption,
};