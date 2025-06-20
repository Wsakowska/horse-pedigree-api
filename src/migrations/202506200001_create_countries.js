exports.up = function (knex) {
  return knex.schema.createTable('countries', (table) => {
    table.string('code', 2).primary();
    table.string('name', 100).notNullable();
  });
};

exports.down = function (knex) {
  return knex.schema.dropTable('countries');
};
