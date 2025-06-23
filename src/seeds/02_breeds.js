exports.seed = async function (knex) {
  await knex('breeds').del();
  
  await knex('breeds').insert([
    { name: 'oo' },
    { name: 'xx' },
    { name: 'xo' },
    { name: 'xxoo' },
  ]);
  
  console.log('Breeds seeded successfully');
};