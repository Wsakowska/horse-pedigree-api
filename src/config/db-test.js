// src/config/db-test.js
const knex = require('knex');

// Dla testów używaj globalnego testKnex jeśli jest dostępny
const knexInstance = global.testKnex || knex({
  client: 'pg',
  connection: {
    host: 'localhost',
    user: 'user',
    password: 'password',
    database: 'horse_pedigree',
    port: 5432
  },
  debug: false
});

module.exports = knexInstance;