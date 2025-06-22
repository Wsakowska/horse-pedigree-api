// src/migrations/202506200006_add_unique_constraints.js
exports.up = function (knex) {
  return knex.schema
    .table('colors', (table) => {
      table.unique('name');
    })
    .table('breeders', (table) => {
      table.unique(['name', 'country_code']);
    })
    .table('horses', (table) => {
      table.unique('name');
    });
};

exports.down = function (knex) {
  return knex.schema
    .table('horses', (table) => {
      table.dropUnique('name');
    })
    .table('breeders', (table) => {
      table.dropUnique(['name', 'country_code']);
    })
    .table('colors', (table) => {
      table.dropUnique('name');
    });
};