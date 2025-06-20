exports.seed = async function (knex) {
  // Nie usuwaj innych tabel tutaj - tylko breeds
  await knex('breeds').del();
  
  await knex('breeds').insert([
    { id: 1, name: 'oo' },
    { id: 2, name: 'xx' },
    { id: 3, name: 'xo' },
    { id: 4, name: 'xxoo' },
  ]);
};