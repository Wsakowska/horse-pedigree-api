exports.seed = async function (knex) {
  await knex('countries').del();
  await knex('countries').insert([
    { code: 'PL', name: 'Polska' },
    { code: 'DE', name: 'Niemcy' },
    { code: 'US', name: 'Stany Zjednoczone' },
  ]);
};
