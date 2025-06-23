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
    port: 5433  // Port testowej bazy
  },
  migrations: {
    directory: './src/migrations'
  },
  seeds: {
    directory: './src/seeds'
  },
  pool: {
    min: 1,
    max: 2
  }
};

let testKnex;

// Setup przed wszystkimi testami
beforeAll(async () => {
  console.log('🧪 Konfigurowanie testowej bazy danych...');
  
  try {
    // Utwórz połączenie
    testKnex = knex(testDbConfig);
    
    // Zapisz jako globalną zmienną
    global.testKnex = testKnex;
    
    // Test połączenia
    await testKnex.raw('SELECT 1');
    console.log('✅ Połączenie z bazą testową OK');
    
    // Uruchom migracje
    await testKnex.migrate.latest();
    console.log('✅ Migracje wykonane pomyślnie');
    
    // Uruchom seedy
    await testKnex.seed.run();
    console.log('✅ Dane testowe załadowane');
    
  } catch (error) {
    console.error('❌ Błąd podczas konfiguracji bazy:', error.message);
    
    if (error.message.includes('does not exist')) {
      console.log('💡 Uruchom bazę testową: docker-compose -f docker-compose.test.yml up -d');
    }
    
    if (error.message.includes('ECONNREFUSED')) {
      console.log('💡 Sprawdź czy PostgreSQL działa na porcie 5433');
    }
    
    throw error;
  }
}, 60000); // 60 sekund timeout

// Cleanup po każdym teście
afterEach(async () => {
  if (testKnex) {
    try {
      // Wyczyść tabele w odpowiedniej kolejności (usuń dzieci przed rodzicami)
      await testKnex('horses').del();
      await testKnex('breeders').del(); 
      await testKnex('colors').del();
      await testKnex('breeds').del();
      await testKnex('countries').del();
      
      // Ponownie załaduj podstawowe seedy
      await testKnex.seed.run();
    } catch (error) {
      console.warn('⚠️ Błąd podczas czyszczenia danych:', error.message);
    }
  }
});

// Cleanup po wszystkich testach
afterAll(async () => {
  if (testKnex) {
    console.log('🧹 Zamykanie połączenia z testową bazą danych...');
    try {
      await testKnex.destroy();
    } catch (error) {
      console.warn('⚠️ Błąd podczas zamykania połączenia:', error.message);
    }
  }
});

// Funkcje pomocnicze dla testów (uproszczone)
global.createTestCountry = async (data = {}) => {
  const defaultData = {
    code: 'TS',
    name: 'Test Country'
  };
  
  try {
    const [country] = await testKnex('countries')
      .insert({ ...defaultData, ...data })
      .returning('*');
    
    return country;
  } catch (error) {
    console.error('Błąd tworzenia test country:', error.message);
    throw error;
  }
};

global.createTestBreed = async (data = {}) => {
  const defaultData = {
    name: 'oo'
  };
  
  try {
    const [breed] = await testKnex('breeds')
      .insert({ ...defaultData, ...data })
      .returning('*');
    
    return breed;
  } catch (error) {
    console.error('Błąd tworzenia test breed:', error.message);
    throw error;
  }
};

global.createTestColor = async (data = {}) => {
  const defaultData = {
    name: 'Test Color'
  };
  
  try {
    const [color] = await testKnex('colors')
      .insert({ ...defaultData, ...data })
      .returning('*');
    
    return color;
  } catch (error) {
    console.error('Błąd tworzenia test color:', error.message);
    throw error;
  }
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
  
  try {
    const [breeder] = await testKnex('breeders')
      .insert({ ...defaultData, ...data })
      .returning('*');
    
    return breeder;
  } catch (error) {
    console.error('Błąd tworzenia test breeder:', error.message);
    throw error;
  }
};

global.createTestHorse = async (data = {}) => {
  // Upewnij się, że zależności istnieją
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
  
  try {
    const [horse] = await testKnex('horses')
      .insert({ ...defaultData, ...data })
      .returning('*');
    
    return horse;
  } catch (error) {
    console.error('Błąd tworzenia test horse:', error.message);
    throw error;
  }
};

// Mock dla console w testach (opcjonalnie)
if (process.env.NODE_ENV === 'test') {
  global.console = {
    ...console,
    log: jest.fn(),
    error: console.error, // Zachowaj error dla debugowania
    warn: console.warn,   // Zachowaj warn dla debugowania
    info: jest.fn()
  };
}