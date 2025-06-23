exports.up = function (knex) {
  return knex.schema.createTable('breeds', (table) => {
    table.increments('id').primary();
    table.string('name', 4).notNullable();
    table.unique('name'); // Zapobiega duplikatom
    table.check('name IN (?, ?, ?, ?)', ['oo', 'xx', 'xo', 'xxoo'], 'breeds_name_check');
  });
};

exports.down = function (knex) {
  return knex.schema.dropTable('breeds');
};

/*
CREATE TABLE breeds (
  id SERIAL PRIMARY KEY,
  name VARCHAR(4) NOT NULL UNIQUE,
  CONSTRAINT breeds_name_check CHECK (name IN ('oo', 'xx', 'xo', 'xxoo'))
);
*/