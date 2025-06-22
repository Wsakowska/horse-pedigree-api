exports.seed = async function (knex) {
  // Usuń istniejące dane
  await knex('colors').del();
  
  // Wstaw nowe dane BEZ podawania ID
  await knex('colors').insert([
    { name: 'Gniada' },
    { name: 'Kara' },
    { name: 'Siwa' },
    { name: 'Kasztanowata' },
    { name: 'Izabelowata' },
  ]);
  
  console.log('Colors seeded successfully');
};
