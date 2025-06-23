const knex = require('knex');
const config = require('../../knexfile');

const knexInstance = knex({
  ...config.development,
  debug: true 
});

module.exports = knexInstance;