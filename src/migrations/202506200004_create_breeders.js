exports.up = function (knex) {
  return knex.schema.createTable('breeders', (table) => {
    table.increments('id').primary();
    table.string('name', 100).notNullable();
    table.string('country_code', 2).references('code').inTable('countries');
  });
};

exports.down = function (knex) {
  return knex.schema.dropTable('breeders');
};
