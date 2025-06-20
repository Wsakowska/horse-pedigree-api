exports.up = function (knex) {
  return knex.schema.createTable('horses', (table) => {
    table.increments('id').primary();
    table.string('name', 100).notNullable();
    table.integer('breed_id').references('id').inTable('breeds');
    table.date('birth_date');
    table.string('gender', 10).notNullable().checkIn(['klacz', 'ogier', 'wałach']);
    table.integer('sire_id').references('id').inTable('horses');
    table.integer('dam_id').references('id').inTable('horses');
    table.integer('color_id').references('id').inTable('colors');
    table.integer('breeder_id').references('id').inTable('breeders');
    
    // Poprawne check constraints
    table.check('sire_id != dam_id', [], 'horses_different_parents_check');
  });
};

exports.down = function (knex) {
  return knex.schema.dropTable('horses');
};