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

/*
CREATE TABLE breeders (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  country_code VARCHAR(2) REFERENCES countries(code)
);
*/