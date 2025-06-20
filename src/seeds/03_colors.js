exports.seed = async function (knex) {
  await knex('colors').del();
  await knex('colors').insert([
    { name: 'Gniada' },
    { name: 'Kara' },
    { name: 'Siwa' },
  ]);
};
