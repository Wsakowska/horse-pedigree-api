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
    
    table.check('sire_id != dam_id', [], 'horses_different_parents_check');
  });
};

exports.down = function (knex) {
  return knex.schema.dropTable('horses');
};

/*
-- Równoważny SQL:
CREATE TABLE horses (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  breed_id INTEGER REFERENCES breeds(id),
  birth_date DATE,
  gender VARCHAR(10) NOT NULL CHECK (gender IN ('klacz', 'ogier', 'wałach')),
  sire_id INTEGER REFERENCES horses(id),    -- SELF REFERENCE!
  dam_id INTEGER REFERENCES horses(id),     -- SELF REFERENCE!
  color_id INTEGER REFERENCES colors(id),
  breeder_id INTEGER REFERENCES breeders(id),
  CONSTRAINT horses_different_parents_check CHECK (sire_id != dam_id)
);
*/