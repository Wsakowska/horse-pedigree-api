exports.up = function (knex) {
  return knex.schema.createTable('breeds', (table) => {
    table.increments('id').primary();
    table.string('name', 4).notNullable();
    table.unique('name'); // Zapobiegaj duplikatom
    table.check('name IN (?, ?, ?, ?)', ['oo', 'xx', 'xo', 'xxoo'], 'breeds_name_check');
  });
};

exports.down = function (knex) {
  return knex.schema.dropTable('breeds');
};