// src/config/db-test.js
const knex = require('knex');

const testDbConfig = {
  client: 'pg',
  connection: {
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'user',
    password: process.env.DB_PASSWORD || 'password',
    database: process.env.DB_NAME || 'horse_pedigree_test',
    port: process.env.DB_PORT || 5433
  },
  migrations: {
    directory: './src/migrations'
  },
  seeds: {
    directory: './src/seeds'
  },
  pool: {
    min: 1,
    max: 5
  },
  debug: false
};

// Dla testów używaj globalnego testKnex jeśli jest dostępny, w przeciwnym razie utwórz nowe połączenie
const knexInstance = global.testKnex || knex(testDbConfig);

module.exports = knexInstance;