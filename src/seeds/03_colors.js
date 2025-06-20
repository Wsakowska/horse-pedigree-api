exports.seed = async function (knex) {
  // Nie usuwaj innych tabel tutaj - tylko colors
  await knex('colors').del();
  
  await knex('colors').insert([
    { id: 1, name: 'Gniada' },
    { id: 2, name: 'Kara' },
    { id: 3, name: 'Siwa' },
    { id: 4, name: 'Kasztanowata' },
    { id: 5, name: 'Izabelowata' },
  ]);
};