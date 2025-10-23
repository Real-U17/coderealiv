const knex = require('knex')({
  client: 'mysql',
  connection: {
    host: "172.31.8.142",
    port: 3306,
    user: "root",
    password: "",
    database: "power_sensor",

  },
});

module.exports = knex;