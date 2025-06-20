exports.seed = async function (knex) {
  // Usuń w odpowiedniej kolejności (najpierw dzieci, potem rodziców)
  await knex('horses').del();
  await knex('breeders').del();
  await knex('countries').del();
  
  await knex('countries').insert([
    { code: 'PL', name: 'Polska' },
    { code: 'DE', name: 'Niemcy' },
    { code: 'US', name: 'Stany Zjednoczone' },
    { code: 'FR', name: 'Francja' },
    { code: 'GB', name: 'Wielka Brytania' },
  ]);
};