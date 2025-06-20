exports.seed = async function (knex) {
  await knex('breeders').del();
  await knex('breeders').insert([
    { name: 'Hodowla PL', country_code: 'PL' },
    { name: 'Hodowla DE', country_code: 'DE' },
  ]);
};
