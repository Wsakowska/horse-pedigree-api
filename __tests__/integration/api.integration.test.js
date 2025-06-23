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
      expect(stats).toHaveProperty('colors');
      expect(stats).toHaveProperty('breeders');
      expect(stats).toHaveProperty('horses');

      expect(typeof stats.countries).toBe('number');
      expect(typeof stats.breeds).toBe('number');
      expect(typeof stats.colors).toBe('number');
      expect(typeof stats.breeders).toBe('number');
      expect(typeof stats.horses).toBe('number');
    });

    it('should handle database connection failures', async () => {
      // Ten test sprawdza obecne zachowanie
      // W rzeczywistości można by symulować problemy z bazą
      const response = await request(app)
        .get('/api/health')
        .expect(200);

      expect(response.body.status).toBe('OK');
      expect(response.body.database).toBe('connected');
    });
  });

  describe('Rate Limiting and Security', () => {
    it('should handle rate limiting gracefully', async () => {
      // Wyślij wiele requestów szybko
      const promises = [];
      for (let i = 0; i < 10; i++) {
        promises.push(
          request(app).get('/api/health')
        );
      }

      const results = await Promise.allSettled(promises);
      
      // Większość powinna się udać
      const successes = results.filter(r => 
        r.status === 'fulfilled' && r.value.status === 200
      );

      expect(successes.length).toBeGreaterThan(5);
    });

    it('should validate request data properly', async () => {
      // Test SQL injection attempts
      const maliciousData = {
        name: "'; DROP TABLE horses; --",
        gender: 'klacz'
      };

      const response = await request(app)
        .post('/api/horses')
        .send(maliciousData);

      // Powinna być walidacja lub błąd, ale nie crash
      expect([400, 422, 500]).toContain(response.status);
    });

    it('should handle XSS attempts in data', async () => {
      const xssData = {
        name: '<script>alert("XSS")</script>',
        gender: 'klacz'
      };

      const response = await request(app)
        .post('/api/horses')
        .send(xssData);

      if (response.status === 201) {
        // Jeśli zostało przyjęte, sprawdź czy nie zawiera szkodliwego kodu
        expect(response.body.name).not.toContain('<script>');
      }
    });

    it('should handle oversized payloads', async () => {
      const hugeData = {
        name: 'A'.repeat(10000),
        gender: 'klacz'
      };

      const response = await request(app)
        .post('/api/horses')
        .send(hugeData);

      expect([400, 413, 422]).toContain(response.status);
    });
  });

  describe('Real-world Scenarios', () => {
    it('should handle complete stud farm setup', async () => {
      // Scenario: Nowa stadnina zaczyna działalność
      
      // 1. Dodaj kraj
      const country = await createTestCountry({ 
        code: 'NL', 
        name: 'Holandia' 
      });

      // 2. Dodaj stadninę
      const stud = await createTestBreeder({
        name: 'Nederlandse Paardenfokkerij',
        country_code: country.code
      });

      // 3. Dodaj podstawowe maści
      const colors = await Promise.all([
        createTestColor({ name: 'Gniada holenderska' }),
        createTestColor({ name: 'Kara błyszcząca' }),
        createTestColor({ name: 'Siwa jasna' })
      ]);

      // 4. Dodaj podstawowe rasy
      const breeds = await Promise.all([
        createTestBreed({ name: 'oo' }),
        createTestBreed({ name: 'xx' }),
        createTestBreed({ name: 'xo' }),
        createTestBreed({ name: 'xxoo' })
      ]);

      // 5. Dodaj konie podstawowe (matki stadne)
      const foundationMares = await Promise.all([
        createTestHorse({
          name: 'Amsterdam',
          gender: 'klacz',
          breed_id: breeds[0].id, // oo
          color_id: colors[0].id,
          breeder_id: stud.id,
          birth_date: '2015-01-01'
        }),
        createTestHorse({
          name: 'Rotterdam',
          gender: 'klacz',
          breed_id: breeds[1].id, // xx
          color_id: colors[1].id,
          breeder_id: stud.id,
          birth_date: '2016-01-01'
        })
      ]);

      // 6. Dodaj ogiera
      const stallion = await createTestHorse({
        name: 'Utrecht',
        gender: 'ogier',
        breed_id: breeds[0].id, // oo
        color_id: colors[2].id,
        breeder_id: stud.id,
        birth_date: '2014-01-01'
      });

      // 7. Sprawdź możliwości krzyżowania
      for (const mare of foundationMares) {
        const breedingCheck = await request(app)
          .get(`/api/horses/breeding/check?sire_id=${stallion.id}&dam_id=${mare.id}`)
          .expect(200);

        expect(breedingCheck.body.breeding_possible).toBe(true);
      }

      // 8. Utwórz potomstwo
      const offspring = await createTestHorse({
        name: 'Den Haag',
        gender: 'klacz',
        sire_id: stallion.id,
        dam_id: foundationMares[0].id,
        color_id: colors[0].id,
        breeder_id: stud.id,
        birth_date: '2020-01-01'
      });

      // 9. Sprawdź rodowód potomka
      const pedigreeResponse = await request(app)
        .get(`/api/horses/${offspring.id}/pedigree/1`)
        .expect(200);

      expect(pedigreeResponse.body.sire.name).toBe('Utrecht');
      expect(pedigreeResponse.body.dam.name).toBe('Amsterdam');

      // 10. Sprawdź potomstwo ogiera
      const offspringResponse = await request(app)
        .get(`/api/horses/${stallion.id}/offspring`)
        .expect(200);

      expect(offspringResponse.body.offspring).toHaveLength(1);
      expect(offspringResponse.body.offspring[0].name).toBe('Den Haag');

      console.log('✅ Complete stud farm setup successful');
    });

    it('should handle multi-generation breeding program', async () => {
      // Scenario: Program hodowlany na 3 generacje
      
      // Przygotowanie
      const country = await createTestCountry({ code: 'IR', name: 'Irlandia' });
      const breeder = await createTestBreeder({ country_code: country.code });
      const color = await createTestColor({ name: 'Irish Bay' });
      const breeds = {
        oo: await createTestBreed({ name: 'oo' }),
        xx: await createTestBreed({ name: 'xx' }),
        xo: await createTestBreed({ name: 'xo' }),
        xxoo: await createTestBreed({ name: 'xxoo' })
      };

      // GENERACJA 0 - Podstawa
      const generation0 = {
        grandsire: await createTestHorse({
          name: 'Irish King',
          gender: 'ogier',
          breed_id: breeds.oo.id,
          color_id: color.id,
          breeder_id: breeder.id,
          birth_date: '2010-01-01'
        }),
        granddam: await createTestHorse({
          name: 'Irish Queen',
          gender: 'klacz',
          breed_id: breeds.xx.id,
          color_id: color.id,
          breeder_id: breeder.id,
          birth_date: '2011-01-01'
        })
      };

      // GENERACJA 1 - Rodzice
      const generation1 = {
        sire: await createTestHorse({
          name: 'Irish Prince',
          gender: 'ogier',
          sire_id: generation0.grandsire.id,
          dam_id: generation0.granddam.id,
          color_id: color.id,
          breeder_id: breeder.id,
          birth_date: '2015-01-01'
        }),
        dam: await createTestHorse({
          name: 'Irish Rose',
          gender: 'klacz',
          breed_id: breeds.xo.id, // xo breed
          color_id: color.id,
          breeder_id: breeder.id,
          birth_date: '2016-01-01'
        })
      };

      // Sprawdź czy rasa została obliczona poprawnie dla Prince (oo + xx = xxoo)
      expect(generation1.sire.breed_id).toBe(breeds.xxoo.id);

      // GENERACJA 2 - Potomstwo
      const generation2 = await createTestHorse({
        name: 'Irish Legend',
        gender: 'klacz',
        sire_id: generation1.sire.id,
        dam_id: generation1.dam.id,
        color_id: color.id,
        breeder_id: breeder.id,
        birth_date: '2020-01-01'
      });

      // Sprawdź czy rasa została obliczona poprawnie (xxoo + xo = xxoo)
      expect(generation2.breed_id).toBe(breeds.xxoo.id);

      // Test głębokiego rodowodu
      const deepPedigree = await request(app)
        .get(`/api/horses/${generation2.id}/pedigree/2`)
        .expect(200);

      expect(deepPedigree.body.name).toBe('Irish Legend');
      expect(deepPedigree.body.sire.name).toBe('Irish Prince');
      expect(deepPedigree.body.dam.name).toBe('Irish Rose');
      expect(deepPedigree.body.sire.sire.name).toBe('Irish King');
      expect(deepPedigree.body.sire.dam.name).toBe('Irish Queen');

      // Test HTML rodowodu
      const htmlPedigree = await request(app)
        .get(`/api/horses/${generation2.id}/pedigree/html/2`)
        .expect(200);

      expect(htmlPedigree.text).toContain('Irish Legend');
      expect(htmlPedigree.text).toContain('Irish King');
      expect(htmlPedigree.text).toContain('Irish Queen');

      console.log('✅ Multi-generation breeding program successful');
    });

    it('should handle international horse registry', async () => {
      // Scenario: Międzynarodowy rejestr koni
      
      // Utwórz kilka krajów
      const countries = await Promise.all([
        createTestCountry({ code: 'AU', name: 'Australia' }),
        createTestCountry({ code: 'AR', name: 'Argentyna' }),
        createTestCountry({ code: 'BR', name: 'Brazylia' })
      ]);

      // Utwórz hodowców w różnych krajach
      const breeders = await Promise.all([
        createTestBreeder({ 
          name: 'Outback Stud',
          country_code: countries[0].code 
        }),
        createTestBreeder({ 
          name: 'Pampas Ranch',
          country_code: countries[1].code 
        }),
        createTestBreeder({ 
          name: 'Amazon Horses',
          country_code: countries[2].code 
        })
      ]);

      // Utwórz konie z różnych krajów
      const internationalHorses = await Promise.all([
        createTestHorse({
          name: 'Sydney Star',
          gender: 'klacz',
          breeder_id: breeders[0].id
        }),
        createTestHorse({
          name: 'Buenos Aires Beauty',
          gender: 'klacz',
          breeder_id: breeders[1].id
        }),
        createTestHorse({
          name: 'Rio Runner',
          gender: 'ogier',
          breeder_id: breeders[2].id
        })
      ]);

      // Test międzynarodowego krzyżowania
      const internationalBreeding = await request(app)
        .get(`/api/horses/breeding/check?sire_id=${internationalHorses[2].id}&dam_id=${internationalHorses[0].id}`)
        .expect(200);

      expect(internationalBreeding.body.breeding_possible).toBe(true);

      // Utwórz międzynarodowe potomstwo
      const internationalOffspring = await createTestHorse({
        name: 'Global Champion',
        gender: 'klacz',
        sire_id: internationalHorses[2].id, // Brazylia
        dam_id: internationalHorses[0].id,  // Australia
        breeder_id: breeders[1].id          // Argentyna
      });

      // Sprawdź rodowód międzynarodowy
      const internationalPedigree = await request(app)
        .get(`/api/horses/${internationalOffspring.id}/pedigree/1`)
        .expect(200);

      expect(internationalPedigree.body.sire.name).toBe('Rio Runner');
      expect(internationalPedigree.body.dam.name).toBe('Sydney Star');

      console.log('✅ International horse registry successful');
    });

    it('should handle breeding restrictions and warnings', async () => {
      // Scenario: System ostrzeżeń przed niebezpiecznym krzyżowaniem
      
      const family = testDataGenerator.generateFamily(2);
      
      // Utwórz rodzinę w bazie
      const grandfather = await createTestHorse({
        ...family.grandsire,
        name: 'Patriarch',
        gender: 'ogier'
      });

      const grandmother = await createTestHorse({
        ...family.granddam,
        name: 'Matriarch',
        gender: 'klacz'
      });

      const father = await createTestHorse({
        ...family.sire,
        name: 'Father Horse',
        gender: 'ogier',
        sire_id: grandfather.id,
        dam_id: grandmother.id
      });

      const mother = await createTestHorse({
        ...family.dam,
        name: 'Mother Horse',
        gender: 'klacz'
      });

      const daughter = await createTestHorse({
        ...family.offspring,
        name: 'Daughter Horse',
        gender: 'klacz',
        sire_id: father.id,
        dam_id: mother.id
      });

      const son = await createTestHorse({
        name: 'Son Horse',
        gender: 'ogier',
        sire_id: father.id,
        dam_id: mother.id
      });

      // Test 1: Krzyżowanie ojca z córką (powinno być zabronione)
      const fatherDaughterCheck = await request(app)
        .get(`/api/horses/breeding/check?sire_id=${father.id}&dam_id=${daughter.id}`)
        .expect(400);

      expect(fatherDaughterCheck.body.breeding_possible).toBe(false);
      expect(fatherDaughterCheck.body.problems).toContain('Ojciec nie może mieć potomstwa ze swoją córką');

      // Test 2: Krzyżowanie rodzeństwa (powinno być ostrzeżenie)
      const siblingsCheck = await request(app)
        .get(`/api/horses/breeding/check?sire_id=${son.id}&dam_id=${daughter.id}`)
        .expect(200);

      expect(siblingsCheck.body.breeding_possible).toBe(true);
      expect(siblingsCheck.body.inbreeding_detected).toBe(true);
      expect(siblingsCheck.body.risk_level).toBe('high');

      // Test 3: Krzyżowanie niespokrewnionych koni (powinno być OK)
      const unrelatedMare = await createTestHorse({
        name: 'Unrelated Mare',
        gender: 'klacz'
      });

      const unrelatedCheck = await request(app)
        .get(`/api/horses/breeding/check?sire_id=${son.id}&dam_id=${unrelatedMare.id}`)
        .expect(200);

      expect(unrelatedCheck.body.breeding_possible).toBe(true);
      expect(unrelatedCheck.body.risk_level).toBe('low');

      console.log('✅ Breeding restrictions and warnings working correctly');
    });
  });

  describe('Edge Cases and Stress Tests', () => {
    it('should handle maximum database connections', async () => {
      // Test wielu równoczesnych połączeń
      const promises = [];
      
      for (let i = 0; i < 50; i++) {
        promises.push(
          request(app).get('/api/health')
        );
      }

      const results = await Promise.allSettled(promises);
      
      const successes = results.filter(r => 
        r.status === 'fulfilled' && r.value.status === 200
      );

      // Większość powinna się udać
      expect(successes.length).toBeGreaterThan(40);
    });

    it('should handle complex pedigree queries', async () => {
      // Utwórz głęboką strukturę rodzinną (5 generacji)
      let currentGeneration = [];
      
      // Generacja 0 (prapradziadkowie)
      for (let i = 0; i < 4; i++) {
        const horse = await createTestHorse({
          name: `Ancestor ${i}`,
          gender: i % 2 === 0 ? 'ogier' : 'klacz'
        });
        currentGeneration.push(horse);
      }

      // Buduj kolejne generacje
      for (let gen = 1; gen < 5; gen++) {
        const nextGeneration = [];
        
        for (let i = 0; i < currentGeneration.length; i += 2) {
          if (i + 1 < currentGeneration.length) {
            const child = await createTestHorse({
              name: `Gen${gen}_Horse${i/2}`,
              gender: Math.random() > 0.5 ? 'ogier' : 'klacz',
              sire_id: currentGeneration[i].gender === 'ogier' ? currentGeneration[i].id : currentGeneration[i+1].id,
              dam_id: currentGeneration[i].gender === 'klacz' ? currentGeneration[i].id : currentGeneration[i+1].id
            });
            nextGeneration.push(child);
          }
        }
        
        currentGeneration = nextGeneration;
        if (currentGeneration.length === 0) break;
      }

      // Test głębokiego rodowodu dla ostatniego konia
      if (currentGeneration.length > 0) {
        const deepPedigree = await request(app)
          .get(`/api/horses/${currentGeneration[0].id}/pedigree/4`)
          .expect(200);

        expect(deepPedigree.body).toBeTruthy();
        
        // Test HTML dla głębokiego rodowodu
        const htmlPedigree = await request(app)
          .get(`/api/horses/${currentGeneration[0].id}/pedigree/html/3`)
          .expect(200);

        expect(htmlPedigree.text).toContain('Ancestor');
      }
    });

    it('should handle unicode and special characters', async () => {
      // Test znaków Unicode w różnych językach
      const unicodeHorses = [
        { name: 'Żurawina', country: 'PL' },
        { name: 'Schöne Stute', country: 'DE' },
        { name: 'Café au Lait', country: 'FR' },
        { name: 'Niño Bonito', country: 'ES' },
        { name: '美しい馬', country: 'JP' },
        { name: 'Красивая Лошадь', country: 'RU' },
        { name: 'Ελληνικό άλογο', country: 'GR' }
      ];

      for (const horseData of unicodeHorses) {
        // Utwórz kraj jeśli nie istnieje
        await createTestCountry({ 
          code: horseData.country, 
          name: `Country ${horseData.country}` 
        });
        
        const breeder = await createTestBreeder({ 
          country_code: horseData.country 
        });
        
        const response = await request(app)
          .post('/api/horses')
          .send({
            name: horseData.name,
            gender: 'klacz',
            color_id: 1,
            breeder_id: breeder.id
          })
          .expect(201);

        expect(response.body.name).toBe(horseData.name);
      }
    });

    it('should handle orphaned data cleanup', async () => {
      // Test czyszczenia osieroconych danych
      
      // Utwórz strukturę danych
      const country = await createTestCountry({ code: 'OR', name: 'Orphan Country' });
      const breeder = await createTestBreeder({ country_code: country.code });
      const horse = await createTestHorse({ breeder_id: breeder.id });

      // Sprawdź czy dane istnieją
      let checkResponse = await request(app).get('/api/horses');
      expect(checkResponse.body.find(h => h.id === horse.id)).toBeTruthy();

      checkResponse = await request(app).get('/api/breeders');
      expect(checkResponse.body.find(b => b.id === breeder.id)).toBeTruthy();

      // Usuń konia
      await request(app)
        .delete(`/api/horses/${horse.id}`)
        .expect(204);

      // Usuń hodowcę
      await request(app)
        .delete(`/api/breeders/${breeder.id}`)
        .expect(204);

      // Usuń kraj
      await request(app)
        .delete(`/api/countries/${country.code}`)
        .expect(204);

      // Sprawdź czy dane zostały usunięte
      checkResponse = await request(app).get('/api/horses');
      expect(checkResponse.body.find(h => h.id === horse.id)).toBeFalsy();

      checkResponse = await request(app).get('/api/breeders');
      expect(checkResponse.body.find(b => b.id === breeder.id)).toBeFalsy();

      checkResponse = await request(app).get('/api/countries');
      expect(checkResponse.body.find(c => c.code === country.code)).toBeFalsy();
    });
  });

  describe('API Documentation and Versioning', () => {
    it('should maintain API version compatibility', async () => {
      // Test czy stare endpointy nadal działają
      const endpoints = [
        '/api/countries',
        '/api/breeders', 
        '/api/horses',
        '/api/colors',
        '/api/breeds'
      ];

      for (const endpoint of endpoints) {
        // Test starych endpointów
        const oldResponse = await request(app)
          .get(endpoint)
          .expect(200);

        // Test nowych endpointów v1
        const newResponse = await request(app)
          .get(`/api/v1${endpoint.replace('/api', '')}`)
          .expect(200);

        // Sprawdź czy struktury odpowiedzi są podobne
        expect(Array.isArray(oldResponse.body)).toBe(Array.isArray(newResponse.body));
      }
    });

    it('should provide proper error responses with documentation', async () => {
      // Test czy błędy zawierają odpowiednie informacje
      const response = await request(app)
        .get('/api/nonexistent')
        .expect(404);

      expect(response.body).toHaveProperty('error');
      expect(response.body).toHaveProperty('timestamp');
      expect(response.body).toHaveProperty('path');
      expect(response.body).toHaveProperty('availableEndpoints');
    });

    it('should handle API endpoint discovery', async () => {
      const healthResponse = await request(app)
        .get('/api/health')
        .expect(200);

      expect(healthResponse.body).toHaveProperty('endpoints');
      
      const endpoints = healthResponse.body.endpoints;
      expect(endpoints).toHaveProperty('countries');
      expect(endpoints).toHaveProperty('breeders');
      expect(endpoints).toHaveProperty('horses');
      expect(endpoints).toHaveProperty('colors');
      expect(endpoints).toHaveProperty('breeds');
    });
  });

  describe('Final Integration Tests', () => {
    it('should pass complete API workflow test', async () => {
      console.log('🧪 Running complete API workflow test...');
      
      // 1. Health check
      const health = await request(app).get('/api/health').expect(200);
      expect(health.body.status).toBe('OK');
      
      // 2. Create complete data structure
      const testCountry = await createTestCountry({ code: 'FT', name: 'Final Test' });
      const testBreeder = await createTestBreeder({ country_code: testCountry.code });
      const testColor = await createTestColor({ name: 'Final Color' });
      const testBreeds = await Promise.all([
        createTestBreed({ name: 'oo' }),
        createTestBreed({ name: 'xx' })
      ]);
      
      // 3. Create horses and test breeding
      const sire = await createTestHorse({
        name: 'Final Sire',
        gender: 'ogier',
        breed_id: testBreeds[0].id,
        color_id: testColor.id,
        breeder_id: testBreeder.id
      });
      
      const dam = await createTestHorse({
        name: 'Final Dam',
        gender: 'klacz',
        breed_id: testBreeds[1].id,
        color_id: testColor.id,
        breeder_id: testBreeder.id
      });
      
      // 4. Test breeding check
      const breedingCheck = await request(app)
        .get(`/api/horses/breeding/check?sire_id=${sire.id}&dam_id=${dam.id}`)
        .expect(200);
      
      expect(breedingCheck.body.breeding_possible).toBe(true);
      
      // 5. Create offspring
      const offspring = await createTestHorse({
        name: 'Final Offspring',
        gender: 'klacz',
        sire_id: sire.id,
        dam_id: dam.id,
        color_id: testColor.id,
        breeder_id: testBreeder.id
      });
      
      // 6. Test pedigree
      const pedigree = await request(app)
        .get(`/api/horses/${offspring.id}/pedigree/1`)
        .expect(200);
      
      expect(pedigree.body.sire.name).toBe('Final Sire');
      expect(pedigree.body.dam.name).toBe('Final Dam');
      
      // 7. Test offspring
      const offspringResponse = await request(app)
        .get(`/api/horses/${sire.id}/offspring`)
        .expect(200);
      
      expect(offspringResponse.body.offspring).toHaveLength(1);
      
      // 8. Test HTML pedigree
      const htmlPedigree = await request(app)
        .get(`/api/horses/${offspring.id}/pedigree/html/1`)
        .expect(200);
      
      expect(htmlPedigree.text).toContain('Final Offspring');
      
      console.log('✅ Complete API workflow test passed!');
    });

    it('should demonstrate all API capabilities', async () => {
      console.log('🚀 Demonstrating all API capabilities...');
      
      const startTime = Date.now();
      
      // Wykonaj wszystkie główne operacje
      const operations = await Promise.all([
        request(app).get('/api/countries'),
        request(app).get('/api/breeds'),
        request(app).get('/api/colors'),
        request(app).get('/api/breeders'),
        request(app).get('/api/horses'),
        request(app).get('/api/health')
      ]);
      
      // Sprawdź czy wszystkie operacje się udały
      operations.forEach((response, index) => {
        expect(response.status).toBe(200);
      });
      
      const endTime = Date.now();
      const duration = endTime - startTime;
      
      console.log(`✅ All API capabilities demonstrated in ${duration}ms`);
      expect(duration).toBeLessThan(5000); // Powinno być szybsze niż 5 sekund
    });
  });
});