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
      migrations: {
      directory: './src/migrations'
    },
    seeds: {
      directory: './src/seeds'
    },
  debug: false
});

module.exports = knexInstance;