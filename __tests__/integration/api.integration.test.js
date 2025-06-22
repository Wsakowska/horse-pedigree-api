// __tests__/integration/api.integration.test.js
const request = require('supertest');
const app = require('../../src/app');
const { testDataGenerator } = require('../utils/testUtils');

describe('API Integration Tests', () => {
  beforeEach(() => {
    testDataGenerator.reset();
  });

  describe('Complete Horse Registration Workflow', () => {
    it('should complete full workflow from country to horse', async () => {
      // 1. Dodaj kraj
      const countryData = testDataGenerator.generateCountry({
        code: 'IT',
        name: 'Włochy'
      });

      const countryResponse = await request(app)
        .post('/api/countries')
        .send(countryData)
        .expect(201);

      expect(countryResponse.body.code).toBe('IT');

      // 2. Dodaj hodowcę
      const breederData = testDataGenerator.generateBreeder({
        name: 'Italian Stables',
        country_code: 'IT'
      });

      const breederResponse = await request(app)
        .post('/api/breeders')
        .send(breederData)
        .expect(201);

      expect(breederResponse.body.country_code).toBe('IT');

      // 3. Dodaj maść
      const colorData = testDataGenerator.generateColor({
        name: 'Bułana'
      });

      const colorResponse = await request(app)
        .post('/api/colors')
        .send(colorData)
        .expect(201);

      // 4. Dodaj rasę
      const breedData = testDataGenerator.generateBreed({
        name: 'oo'
      });

      const breedResponse = await request(app)
        .post('/api/breeds')
        .send(breedData)
        .expect(201);

      // 5. Dodaj konia podstawowego (bez rodziców)
      const horseData = testDataGenerator.generateHorse({
        name: 'Bella Italia',
        gender: 'klacz',
        breed_id: breedResponse.body.id,
        color_id: colorResponse.body.id,
        breeder_id: breederResponse.body.id,
        birth_date: '2020-05-15'
      });

      const horseResponse = await request(app)
        .post('/api/horses')
        .send(horseData)
        .expect(201);

      expect(horseResponse.body.name).toBe('Bella Italia');
      expect(horseResponse.body.breeder_id).toBe(breederResponse.body.id);

      // 6. Sprawdź czy wszystkie dane są powiązane
      const allHorsesResponse = await request(app)
        .get('/api/horses')
        .expect(200);

      const createdHorse = allHorsesResponse.body.find(h => h.name === 'Bella Italia');
      expect(createdHorse).toBeTruthy();
    });

    it('should handle complete breeding workflow', async () => {
      // Przygotuj dane testowe
      const country = await createTestCountry({ code: 'FR', name: 'Francja' });
      const breeder = await createTestBreeder({ country_code: country.code });
      const color = await createTestColor();
      const breedOO = await createTestBreed({ name: 'oo' });
      const breedXX = await createTestBreed({ name: 'xx' });
      const breedXXOO = await createTestBreed({ name: 'xxoo' });

      // 1. Utwórz rodziców
      const sire = await createTestHorse({
        name: 'French Stallion',
        gender: 'ogier',
        breed_id: breedOO.id,
        color_id: color.id,
        breeder_id: breeder.id
      });

      const dam = await createTestHorse({
        name: 'French Mare',
        gender: 'klacz',
        breed_id: breedXX.id,
        color_id: color.id,
        breeder_id: breeder.id
      });

      // 2. Sprawdź możliwość krzyżowania
      const breedingCheckResponse = await request(app)
        .get(`/api/horses/breeding/check?sire_id=${sire.id}&dam_id=${dam.id}`)
        .expect(200);

      expect(breedingCheckResponse.body.breeding_possible).toBe(true);
      expect(breedingCheckResponse.body.predicted_breed).toBe('xxoo');

      // 3. Utwórz potomka
      const offspringData = {
        name: 'French Prince',
        gender: 'ogier',
        sire_id: sire.id,
        dam_id: dam.id,
        color_id: color.id,
        breeder_id: breeder.id,
        birth_date: '2021-06-01'
      };

      const offspringResponse = await request(app)
        .post('/api/horses')
        .send(offspringData)
        .expect(201);

      // Sprawdź czy rasa została automatycznie obliczona
      expect(offspringResponse.body.breed_id).toBe(breedXXOO.id);

      // 4. Sprawdź rodowód
      const pedigreeResponse = await request(app)
        .get(`/api/horses/${offspringResponse.body.id}/pedigree/1`)
        .expect(200);

      expect(pedigreeResponse.body.sire.name).toBe('French Stallion');
      expect(pedigreeResponse.body.dam.name).toBe('French Mare');

      // 5. Sprawdź potomstwo ojca
      const offspringOfSireResponse = await request(app)
        .get(`/api/horses/${sire.id}/offspring`)
        .expect(200);

      expect(offspringOfSireResponse.body.offspring).toHaveLength(1);
      expect(offspringOfSireResponse.body.offspring[0].name).toBe('French Prince');
    });
  });

  describe('Error Handling and Edge Cases', () => {
    it('should handle cascade deletion constraints', async () => {
      // Utwórz kraj z hodowcą i koniem
      const country = await createTestCountry({ code: 'ES', name: 'Hiszpania' });
      const breeder = await createTestBreeder({ country_code: country.code });
      const horse = await createTestHorse({ breeder_id: breeder.id });

      // Próbuj usunąć kraj - powinno się nie udać
      await request(app)
        .delete(`/api/countries/${country.code}`)
        .expect(400);

      // Próbuj usunąć hodowcę - powinno się nie udać
      await request(app)
        .delete(`/api/breeders/${breeder.id}`)
        .expect(400);

      // Usuń konia
      await request(app)
        .delete(`/api/horses/${horse.id}`)
        .expect(204);

      // Teraz usuń hodowcę - powinno się udać
      await request(app)
        .delete(`/api/breeders/${breeder.id}`)
        .expect(204);

      // I kraj
      await request(app)
        .delete(`/api/countries/${country.code}`)
        .expect(204);
    });

    it('should handle complex family relationships', async () => {
      const family = testDataGenerator.generateFamily(3);
      
      // Utwórz rodzinę w bazie
      const grandsire = await createTestHorse({
        ...family.grandsire,
        gender: 'ogier'
      });

      const granddam = await createTestHorse({
        ...family.granddam,
        gender: 'klacz'
      });

      const sire = await createTestHorse({
        ...family.sire,
        gender: 'ogier',
        sire_id: grandsire.id,
        dam_id: granddam.id
      });

      const dam = await createTestHorse({
        ...family.dam,
        gender: 'klacz'
      });

      const offspring = await createTestHorse({
        ...family.offspring,
        gender: 'klacz',
        sire_id: sire.id,
        dam_id: dam.id
      });

      // Test głębokiego rodowodu
      const deepPedigreeResponse = await request(app)
        .get(`/api/horses/${offspring.id}/pedigree/2`)
        .expect(200);

      expect(deepPedigreeResponse.body.sire.sire.name).toBe(grandsire.name);
      expect(deepPedigreeResponse.body.sire.dam.name).toBe(granddam.name);

      // Test potomstwa dziadka
      const grandsireOffspringResponse = await request(app)
        .get(`/api/horses/${grandsire.id}/offspring`)
        .expect(200);

      expect(grandsireOffspringResponse.body.offspring).toHaveLength(1);
      expect(grandsireOffspringResponse.body.offspring[0].name).toBe(sire.name);

      // Test próby utworzenia cyklicznej relacji
      const cyclicUpdate = {
        name: grandsire.name,
        gender: grandsire.gender,
        sire_id: offspring.id, // Cykl!
        color_id: grandsire.color_id,
        breeder_id: grandsire.breeder_id
      };

      await request(app)
        .put(`/api/horses/${grandsire.id}`)
        .send(cyclicUpdate)
        .expect(400);
    });

    it('should handle data validation across entities', async () => {
      // Test walidacji kodów krajów
      await request(app)
        .post('/api/countries')
        .send({ code: 'INVALID', name: 'Invalid Country' })
        .expect(400);

      // Test walidacji ras
      await request(app)
        .post('/api/breeds')
        .send({ name: 'invalid_breed' })
        .expect(400);

      // Test walidacji płci koni
      const country = await createTestCountry();
      const breeder = await createTestBreeder({ country_code: country.code });
      const color = await createTestColor();

      await request(app)
        .post('/api/horses')
        .send({
          name: 'Invalid Gender Horse',
          gender: 'invalid_gender',
          color_id: color.id,
          breeder_id: breeder.id
        })
        .expect(400);

      // Test przyszłej daty urodzenia
      const futureDate = new Date();
      futureDate.setFullYear(futureDate.getFullYear() + 1);

      await request(app)
        .post('/api/horses')
        .send({
          name: 'Future Horse',
          gender: 'klacz',
          birth_date: futureDate.toISOString().split('T')[0],
          color_id: color.id,
          breeder_id: breeder.id
        })
        .expect(400);
    });
  });

  describe('Performance and Scalability', () => {
    it('should handle large datasets efficiently', async () => {
      const startTime = Date.now();

      // Utwórz dużą ilość danych
      const country = await createTestCountry({ code: 'XL', name: 'Large Country' });
      const breeder = await createTestBreeder({ country_code: country.code });
      const color = await createTestColor();
      const breed = await createTestBreed();

      // Utwórz 100 koni
      const horses = [];
      for (let i = 0; i < 100; i++) {
        const horse = await createTestHorse({
          name: `Horse ${i}`,
          breed_id: breed.id,
          color_id: color.id,
          breeder_id: breeder.id
        });
        horses.push(horse);
      }

      const creationTime = Date.now() - startTime;
      console.log(`Created 100 horses in ${creationTime}ms`);

      // Test pobierania dużej ilości danych
      const fetchStart = Date.now();
      const response = await request(app)
        .get('/api/horses')
        .expect(200);

      const fetchTime = Date.now() - fetchStart;
      console.log(`Fetched ${response.body.length} horses in ${fetchTime}ms`);

      expect(response.body.length).toBeGreaterThanOrEqual(100);
      expect(fetchTime).toBeLessThan(1000); // Powinno być szybsze niż 1s
    });

    it('should handle pagination correctly', async () => {
      // Utwórz dane testowe
      const country = await createTestCountry();
      const breeder = await createTestBreeder({ country_code: country.code });

      const horses = [];
      for (let i = 0; i < 25; i++) {
        const horse = await createTestHorse({
          name: `Paginated Horse ${i}`,
          breeder_id: breeder.id
        });
        horses.push(horse);
      }

      // Test pierwszej strony
      const page1 = await request(app)
        .get('/api/horses?limit=10&offset=0')
        .expect(200);

      expect(page1.body.length).toBe(10);

      // Test drugiej strony
      const page2 = await request(app)
        .get('/api/horses?limit=10&offset=10')
        .expect(200);

      expect(page2.body.length).toBe(10);

      // Test trzeciej strony
      const page3 = await request(app)
        .get('/api/horses?limit=10&offset=20')
        .expect(200);

      expect(page3.body.length).toBeGreaterThan(0);

      // Sprawdź czy strony zawierają różne konie
      const page1Names = page1.body.map(h => h.name);
      const page2Names = page2.body.map(h => h.name);
      
      const overlap = page1Names.filter(name => page2Names.includes(name));
      expect(overlap).toHaveLength(0);
    });

    it('should handle concurrent requests safely', async () => {
      const country = await createTestCountry({ code: 'CC', name: 'Concurrent Country' });
      const breeder = await createTestBreeder({ country_code: country.code });

      // Wysyłaj równocześnie wiele requestów
      const promises = [];
      for (let i = 0; i < 10; i++) {
        const horseData = testDataGenerator.generateHorse({
          name: `Concurrent Horse ${i}`,
          breeder_id: breeder.id
        });

        promises.push(
          request(app)
            .post('/api/horses')
            .send(horseData)
        );
      }

      const results = await Promise.allSettled(promises);
      
      // Sprawdź wyniki
      const successes = results.filter(r => 
        r.status === 'fulfilled' && r.value.status === 201
      );
      
      const failures = results.filter(r => 
        r.status === 'rejected' || r.value.status !== 201
      );

      console.log(`Concurrent requests: ${successes.length} succeeded, ${failures.length} failed`);
      
      // Większość powinna się udać
      expect(successes.length).toBeGreaterThan(5);
    });
  });

  describe('API Versioning', () => {
    it('should support v1 API endpoints', async () => {
      // Test v1 endpoints
      await request(app)
        .get('/api/v1/countries')
        .expect(200);

      await request(app)
        .get('/api/v1/horses')
        .expect(200);

      await request(app)
        .get('/api/v1/health')
        .expect(200);
    });

    it('should maintain backward compatibility', async () => {
      const country = await createTestCountry({ code: 'BC', name: 'Backward Compatible' });

      // Test starych endpointów
      const oldResponse = await request(app)
        .get('/api/countries')
        .expect(200);

      // Test nowych endpointów
      const newResponse = await request(app)
        .get('/api/v1/countries')
        .expect(200);

      // Powinny zwracać te same dane
      expect(oldResponse.body).toEqual(newResponse.body);
    });
  });

  describe('Health and Monitoring', () => {
    it('should provide detailed health information', async () => {
      const response = await request(app)
        .get('/api/health')
        .expect(200);

      expect(response.body).toHaveProperty('status', 'OK');
      expect(response.body).toHaveProperty('timestamp');
      expect(response.body).toHaveProperty('database', 'connected');
      expect(response.body).toHaveProperty('version');
      expect(response.body).toHaveProperty('database_stats');
      expect(response.body).toHaveProperty('endpoints');

      // Sprawdź statystyki bazy
      const stats = response.body.database_stats;
      expect(stats).toHaveProperty('countries');
      expect(stats).toHaveProperty('breeds');
      expect(stats).to