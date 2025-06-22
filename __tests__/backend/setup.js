// __tests__/backend/setup.js
const knex = require('knex');

// Konfiguracja testowej bazy danych
const testDbConfig = {
  client: 'pg',
  connection: {
    host: 'localhost',
    database: 'horse_pedigree_test',
    user: 'user',
    password: 'password',
    port: 5432
  },
  migrations: {
    directory: './src/migrations'
  },
  seeds: {
    directory: './src/seeds'
  },
  debug: false
};

let testKnex;

// Setup przed wszystkimi testami
beforeAll(async () => {
  console.log('🧪 Konfigurowanie testowej bazy danych...');
  
  // Utwórz połączenie
  testKnex = knex(testDbConfig);
  
  // Zapisz jako globalną zmienną
  global.testKnex = testKnex;
  
  try {
    // Uruchom migracje
    await testKnex.migrate.latest();
    console.log('✅ Migracje wykonane pomyślnie');
    
    // Uruchom seedy
    await testKnex.seed.run();
    console.log('✅ Dane testowe załadowane');
    
  } catch (error) {
    console.error('❌ Błąd podczas konfiguracji bazy:', error);
    throw error;
  }
});

// Cleanup po każdym teście
afterEach(async () => {
  if (testKnex) {
    // Wyczyść tabele w odpowiedniej kolejności
    await testKnex('horses').del();
    await testKnex('breeders').del(); 
    await testKnex('colors').del();
    await testKnex('breeds').del();
    await testKnex('countries').del();
    
    // Ponownie załaduj seedy
    await testKnex.seed.run();
  }
});

// Cleanup po wszystkich testach
afterAll(async () => {
  if (testKnex) {
    console.log('🧹 Zamykanie połączenia z testową bazą danych...');
    await testKnex.destroy();
  }
});

// Funkcje pomocnicze dla testów
global.createTestCountry = async (data = {}) => {
  const defaultData = {
    code: 'TS',
    name: 'Test Country'
  };
  
  const [country] = await testKnex('countries')
    .insert({ ...defaultData, ...data })
    .returning('*');
  
  return country;
};

global.createTestBreed = async (data = {}) => {
  const defaultData = {
    name: 'oo'
  };
  
  const [breed] = await testKnex('breeds')
    .insert({ ...defaultData, ...data })
    .returning('*');
  
  return breed;
};

global.createTestColor = async (data = {}) => {
  const defaultData = {
    name: 'Test Color'
  };
  
  const [color] = await testKnex('colors')
    .insert({ ...defaultData, ...data })
    .returning('*');
  
  return color;
};

global.createTestBreeder = async (data = {}) => {
  // Upewnij się, że kraj istnieje
  let countryCode = data.country_code;
  if (!countryCode) {
    const country = await createTestCountry();
    countryCode = country.code;
  }
  
  const defaultData = {
    name: 'Test Breeder',
    country_code: countryCode
  };
  
  const [breeder] = await testKnex('breeders')
    .insert({ ...defaultData, ...data })
    .returning('*');
  
  return breeder;
};

global.createTestHorse = async (data = {}) => {
  // Upewnij się, że breed, color i breeder istnieją
  let breedId = data.breed_id;
  if (!breedId) {
    const breed = await createTestBreed();
    breedId = breed.id;
  }
  
  let colorId = data.color_id;
  if (!colorId) {
    const color = await createTestColor();
    colorId = color.id;
  }
  
  let breederId = data.breeder_id;
  if (!breederId) {
    const breeder = await createTestBreeder();
    breederId = breeder.id;
  }
  
  const defaultData = {
    name: 'Test Horse',
    breed_id: breedId,
    gender: 'klacz',
    birth_date: '2020-01-01',
    color_id: colorId,
    breeder_id: breederId
  };
  
  const [horse] = await testKnex('horses')
    .insert({ ...defaultData, ...data })
    .returning('*');
  
  return horse;
};

// Mock dla console w testach
global.console = {
  ...console,
  log: jest.fn(),
  error: jest.fn(),
  warn: jest.fn(),
  info: jest.fn()
};