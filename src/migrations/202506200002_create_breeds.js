exports.up = function (knex) {
  return knex.schema.createTable('breeds', (table) => {
    table.increments('id').primary();
    table.string('name', 4).notNullable().checkIn(['oo', 'xx', 'xo', 'xxoo']);
  });
};

exports.down = function (knex) {
  return knex.schema.dropTable('breeds');
};
