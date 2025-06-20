exports.seed = async function (knex) {
  // Nie usuwaj innych tabel tutaj - tylko horses
  await knex('horses').del();
  
  await knex('horses').insert([
    // Konie podstawowe (bez rodziców)
    {
      id: 1,
      name: 'Bucefał',
      breed_id: 1, // oo
      birth_date: '2015-06-01',
      gender: 'ogier',
      color_id: 1, // Gniada
      breeder_id: 1, // Hodowla Krakowska
    },
    {
      id: 2,
      name: 'Luna',
      breed_id: 2, // xx
      birth_date: '2016-07-15',
      gender: 'klacz',
      color_id: 2, // Kara
      breeder_id: 2, // Stud Niemcy
    },
    {
      id: 3,
      name: 'Sparta',
      breed_id: 3, // xo
      birth_date: '2017-03-10',
      gender: 'klacz',
      color_id: 3, // Siwa
      breeder_id: 1, // Hodowla Krakowska
    },
    {
      id: 4,
      name: 'Thor',
      breed_id: 4, // xxoo
      birth_date: '2018-01-20',
      gender: 'ogier',
      color_id: 4, // Kasztanowata
      breeder_id: 3, // American Ranch
    },
    
    // Potomstwo (automatycznie obliczona rasa)
    {
      id: 5,
      name: 'Apollo',
      breed_id: 4, // xxoo (oo + xx)
      birth_date: '2019-05-15',
      gender: 'ogier',
      sire_id: 1, // Bucefał (oo)
      dam_id: 2,  // Luna (xx)
      color_id: 1, // Gniada
      breeder_id: 1, // Hodowla Krakowska
    },
    {
      id: 6,
      name: 'Athena',
      breed_id: 4, // xxoo (xxoo + xo)
      birth_date: '2019-08-20',
      gender: 'klacz',
      sire_id: 4, // Thor (xxoo)
      dam_id: 3,  // Sparta (xo)
      color_id: 2, // Kara
      breeder_id: 2, // Stud Niemcy
    },
    {
      id: 7,
      name: 'Pegasus',
      breed_id: 3, // xo (oo + xo)
      birth_date: '2020-02-10',
      gender: 'wałach',
      sire_id: 1, // Bucefał (oo)
      dam_id: 3,  // Sparta (xo)
      color_id: 3, // Siwa
      breeder_id: 1, // Hodowla Krakowska
    },
    
    // Kolejne pokolenie
    {
      id: 8,
      name: 'Diana',
      breed_id: 4, // xxoo (xxoo + xxoo)
      birth_date: '2021-04-12',
      gender: 'klacz',
      sire_id: 5, // Apollo (xxoo)
      dam_id: 6,  // Athena (xxoo)
      color_id: 5, // Izabelowata
      breeder_id: 4, // Hodowla Mazowiecka
    },
  ]);
};