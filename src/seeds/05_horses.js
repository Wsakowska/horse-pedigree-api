exports.seed = async function (knex) {
  await knex('horses').del();
  
  // ETAP 1: Dodaj konie podstawowe (bez rodziców) BEZ ID
  const foundationHorses = await knex('horses').insert([
    {
      name: 'Bucefał',
      breed_id: 1, // oo - zostanie ustawione przez system
      birth_date: '2015-06-01',
      gender: 'ogier',
      color_id: 1, // Gniada
      breeder_id: 1, // Hodowla Krakowska
    },
    {
      name: 'Luna',
      breed_id: 2, // xx
      birth_date: '2016-07-15',
      gender: 'klacz',
      color_id: 2, // Kara
      breeder_id: 2, // Stud Niemcy
    },
    {
      name: 'Sparta',
      breed_id: 3, // xo
      birth_date: '2017-03-10',
      gender: 'klacz',
      color_id: 3, // Siwa
      breeder_id: 1, // Hodowla Krakowska
    },
    {
      name: 'Thor',
      breed_id: 4, // xxoo
      birth_date: '2018-01-20',
      gender: 'ogier',
      color_id: 4, // Kasztanowata
      breeder_id: 3, // American Ranch
    },
  ]).returning('*');
  
  console.log('Foundation horses added:', foundationHorses.map(h => `${h.name} (ID: ${h.id})`));
  
  // ETAP 2: Pobierz ID foundation horses by name
  const bucefal = await knex('horses').where('name', 'Bucefał').first();
  const luna = await knex('horses').where('name', 'Luna').first();
  const sparta = await knex('horses').where('name', 'Sparta').first();
  const thor = await knex('horses').where('name', 'Thor').first();
  
  // ETAP 3: Dodaj potomstwo z prawidłowymi rodzicami
  const offspring = await knex('horses').insert([
    {
      name: 'Apollo',
      breed_id: 4, // xxoo (zostanie automatycznie obliczone: oo + xx = xxoo)
      birth_date: '2019-05-15',
      gender: 'ogier',
      sire_id: bucefal.id, // Bucefał (oo)
      dam_id: luna.id,     // Luna (xx)
      color_id: 1, // Gniada
      breeder_id: 1, // Hodowla Krakowska
    },
    {
      name: 'Athena',
      breed_id: 4, // xxoo (thor xxoo + sparta xo = xxoo)
      birth_date: '2019-08-20',
      gender: 'klacz',
      sire_id: thor.id,    // Thor (xxoo)
      dam_id: sparta.id,   // Sparta (xo)
      color_id: 2, // Kara
      breeder_id: 2, // Stud Niemcy
    },
    {
      name: 'Pegasus',
      breed_id: 3, // xo (bucefal oo + sparta xo = xo)
      birth_date: '2020-02-10',
      gender: 'wałach',
      sire_id: bucefal.id, // Bucefał (oo)
      dam_id: sparta.id,   // Sparta (xo)
      color_id: 3, // Siwa
      breeder_id: 1, // Hodowla Krakowska
    },
  ]).returning('*');
  
  console.log('Offspring added:', offspring.map(h => `${h.name} (ID: ${h.id})`));
  
  // ETAP 4: Dodaj kolejne pokolenie
  const apollo = await knex('horses').where('name', 'Apollo').first();
  const athena = await knex('horses').where('name', 'Athena').first();
  
  const nextGen = await knex('horses').insert([
    {
      name: 'Diana',
      breed_id: 4, // xxoo (apollo xxoo + athena xxoo = xxoo)
      birth_date: '2021-04-12',
      gender: 'klacz',
      sire_id: apollo.id,  // Apollo (xxoo)
      dam_id: athena.id,   // Athena (xxoo)
      color_id: 5, // Izabelowata
      breeder_id: 4, // Hodowla Mazowiecka
    },
  ]).returning('*');
  
  console.log('Next generation added:', nextGen.map(h => `${h.name} (ID: ${h.id})`));
  console.log('All horses seeded successfully');
};