exports.seed = async function (knex) {
  await knex('horses').del();
  await knex('horses').insert([
    {
      name: 'Bucefał',
      breed_id: 1,
      birth_date: '2015-06-01',
      gender: 'ogier',
      color_id: 1,
      breeder_id: 1,
    },
    {
      name: 'Luna',
      breed_id: 2,
      birth_date: '2016-07-15',
      gender: 'klacz',
      color_id: 2,
      breeder_id: 2,
    },
    {
      name: 'Apollo',
      breed_id: 3,
      birth_date: '2018-03-10',
      gender: 'wałach',
      sire_id: 1,
      dam_id: 2,
      color_id: 3,
      breeder_id: 1,
    },
  ]);
};
