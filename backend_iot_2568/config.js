const dotenv = require('dotenv');
dotenv.config();
console.log("Using DB Config:");
console.log({
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  user: process.env.DB_USER,
  database: process.env.DB_NAME
});

const knex = require('knex')({
  client: 'mysql2', // แนะนำใช้ mysql2
  connection: {
    host: process.env.DB_HOST || "mysql",
    port: process.env.DB_PORT || 3306,
    user: process.env.DB_USER || "root",
    password: process.env.DB_PASSWORD || "rootpassword",
    database: process.env.DB_NAME || "power_sensor",
  },
});

module.exports = knex;

// const knex = require('knex')({
//   client: 'mysql',
//   connection: {
//     host: process.env.DB_HOST || "203.113.123.197",
//     port: process.env.DB_PORT || 3306,
//     user: process.env.DB_USER || "root",
//     password: process.env.DB_PASSWORD || "rootpassword",
//     database: process.env.DB_NAME || "power_sensor",

//   },
// });
// module.exports = knex;