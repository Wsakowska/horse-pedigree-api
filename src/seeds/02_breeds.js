exports.seed = async function (knex) {
  // Usuń istniejące dane
  await knex('breeds').del();
  
  // Wstaw nowe dane BEZ podawania ID - pozwól auto-increment działać
  await knex('breeds').insert([
    { name: 'oo' },
    { name: 'xx' },
    { name: 'xo' },
    { name: 'xxoo' },
  ]);
  
  console.log('Breeds seeded successfully');
};