exports.seed = async function (knex) {
  // Nie usuwaj innych tabel tutaj - tylko breeders
  await knex('breeders').del();
  
  await knex('breeders').insert([
    { id: 1, name: 'Hodowla Krakowska', country_code: 'PL' },
    { id: 2, name: 'Stud Niemcy', country_code: 'DE' },
    { id: 3, name: 'American Ranch', country_code: 'US' },
    { id: 4, name: 'Hodowla Mazowiecka', country_code: 'PL' },
    { id: 5, name: 'British Stables', country_code: 'GB' },
  ]);
};