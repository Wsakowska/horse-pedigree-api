exports.seed = async function (knex) {
  await knex('breeders').del();
  
  await knex('breeders').insert([
    { name: 'Hodowla Krakowska', country_code: 'PL' },
    { name: 'Stud Niemcy', country_code: 'DE' },
    { name: 'American Ranch', country_code: 'US' },
    { name: 'Hodowla Mazowiecka', country_code: 'PL' },
    { name: 'British Stables', country_code: 'GB' },
  ]);
  
  console.log('Breeders seeded successfully');
};