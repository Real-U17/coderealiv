const db = require("../config");
const tf = require('@tensorflow/tfjs'); 
const { format } = require('date-fns');

const trainModel = async () => {
  try {
    // ดึงข้อมูลประวัติจากฐานข้อมูล
    const historicalData = await db("sensor_readings")
      .select('power', 'timestamp')
      .where('power', '>', 0)
      .orderBy("timestamp", "asc");

    // เตรียมข้อมูลสำหรับการฝึก
    const inputs = historicalData.map(item => {
      const date = new Date(item.timestamp);
      return [
        date.getHours(), // ชั่วโมง
        date.getDay(),   // วันในสัปดาห์
        date.getMonth(), // เดือน
        date.getFullYear() // ปี
      ];
    });

    const outputs = historicalData.map(item => item.power);

    // สร้าง TensorFlow.js tensors
    const xs = tf.tensor2d(inputs);
    const ys = tf.tensor2d(outputs, [outputs.length, 1]);

    // สร้างโมเดล
    const model = tf.sequential();
    model.add(tf.layers.dense({ units: 1, inputShape: [4] }));

    // คอมไพล์โมเดล
    model.compile({ loss: 'meanSquaredError', optimizer: 'sgd' });

    // ฝึกโมเดล
    await model.fit(xs, ys, { epochs: 100 });

    console.log("Model trained successfully!");

    return model;
  } catch (error) {
    console.error("Error training model:", error);
  }
};

const predictEnergyConsumption = async (req, res) => {
  try {
    const historicalData = await db("sensor_readings")
      .select('power', 'timestamp')
      .where('power', '>', 0)
      .orderBy("timestamp", "asc");

    // จัดกลุ่มข้อมูลตามวัน
    const dailyPower = {};
    historicalData.forEach(reading => {
      const day = format(new Date(reading.timestamp), 'yyyy-MM-dd');
      if (!dailyPower[day]) {
        dailyPower[day] = [];
      }
      dailyPower[day].push(reading.power);
    });

    // คำนวณพลังงานเฉลี่ยต่อวัน
    const dailyEnergies = Object.values(dailyPower).map(powers => {
      return powers.reduce((sum, power) => sum + (power / 60), 0) / 1000; // แปลงเป็น kWh
    });

    const avgDailyEnergy = dailyEnergies.reduce((sum, energy) => sum + energy, 0) / dailyEnergies.length;
    const predictedEnergy = avgDailyEnergy * 30; // คำนวณพลังงานต่อเดือน

    const predictedCost = calculateMonthlyCost(predictedEnergy);

    console.log('Predicted Energy:', predictedEnergy);
    console.log('Predicted Cost:', predictedCost);

    res.json({ 
      energy: Number(predictedEnergy.toFixed(2)),
      cost: Number(predictedCost.toFixed(2))
    });
  } catch (error) {
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
  // const { limit = 1000, start, end } = req.query;

  try {
    let query = db("sensor_readings")
      // .where('power', '>', 0)
      // .orderBy("timestamp", "asc"); // เปลี่ยนเป็น asc เพื่อเรียงตามเวลาจากน้อยไปมาก

    // if (start && end) {
    //   query = query.whereBetween("timestamp", [new Date(start), new Date(end)]);
    // }

    // if (limit) {
    //   query = query.limit(Number(limit));
    // }

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