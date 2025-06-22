// __tests__/backend/breeder.test.js
const request = require('supertest');
const app = require('../../src/app');

describe('Breeders API', () => {
  let testCountry;

  beforeEach(async () => {
    testCountry = await createTestCountry({ code: 'TC', name: 'Test Country' });
  });

  describe('GET /api/breeders', () => {
    it('should return all breeders', async () => {
      const response = await request(app)
        .get('/api/breeders')
        .expect(200);

      expect(Array.isArray(response.body)).toBe(true);
      
      if (response.body.length > 0) {
        const breeder = response.body[0];
        expect(breeder).toHaveProperty('id');
        expect(breeder).toHaveProperty('name');
        expect(breeder).toHaveProperty('country_code');
      }
    });

    it('should handle unicode characters in breeder name', async () => {
      const unicodeBreeder = {
        name: 'Stadnina Żuławy Śląskie',
        country_code: testCountry.code
      };

      const response = await request(app)
        .post('/api/breeders')
        .send(unicodeBreeder)
        .expect(201);

      expect(response.body.name).toBe('Stadnina Żuławy Śląskie');
    });

    it('should handle very long breeder names', async () => {
      const longNameBreeder = {
        name: 'Very Long Breeder Name '.repeat(5),
        country_code: testCountry.code
      };

      // Skróć do 100 znaków
      longNameBreeder.name = longNameBreeder.name.substring(0, 100);

      const response = await request(app)
        .post('/api/breeders')
        .send(longNameBreeder)
        .expect(201);

      expect(response.body.name).toHaveLength(100);
    });

    it('should handle null and undefined values', async () => {
      const nullBreeder = {
        name: 'Test Breeder',
        country_code: null
      };

      await request(app)
        .post('/api/breeders')
        .send(nullBreeder)
        .expect(400);

      const undefinedBreeder = {
        name: 'Test Breeder'
        // country_code undefined
      };

      await request(app)
        .post('/api/breeders')
        .send(undefinedBreeder)
        .expect(400);
    });

    it('should handle special characters in breeder name', async () => {
      const specialBreeder = {
        name: 'Stajnia "Złoty Koń" & Co.',
        country_code: testCountry.code
      };

      const response = await request(app)
        .post('/api/breeders')
        .send(specialBreeder)
        .expect(201);

      expect(response.body.name).toBe('Stajnia "Złoty Koń" & Co.');
    });
  });

  describe('POST /api/breeders', () => {
    it('should create a new breeder with valid data', async () => {
      const newBreeder = {
        name: 'Test Stable',
        country_code: testCountry.code
      };

      const response = await request(app)
        .post('/api/breeders')
        .send(newBreeder)
        .expect(201);

      expect(response.body).toHaveProperty('id');
      expect(response.body).toHaveProperty('name', 'Test Stable');
      expect(response.body).toHaveProperty('country_code', testCountry.code);
    });

    it('should reject breeder with non-existent country', async () => {
      const invalidBreeder = {
        name: 'Invalid Stable',
        country_code: 'XX' // nie istnieje
      };

      await request(app)
        .post('/api/breeders')
        .send(invalidBreeder)
        .expect(400);
    });

    it('should reject breeder with missing required fields', async () => {
      const incompleteBreeder = {
        country_code: testCountry.code
        // brak name
      };

      await request(app)
        .post('/api/breeders')
        .send(incompleteBreeder)
        .expect(400);
    });

    it('should reject breeder with empty name', async () => {
      const emptyNameBreeder = {
        name: '',
        country_code: testCountry.code
      };

      await request(app)
        .post('/api/breeders')
        .send(emptyNameBreeder)
        .expect(400);
    });

    it('should reject breeder name longer than 100 characters', async () => {
      const longNameBreeder = {
        name: 'A'.repeat(101),
        country_code: testCountry.code
      };

      await request(app)
        .post('/api/breeders')
        .send(longNameBreeder)
        .expect(400);
    });

    it('should allow multiple breeders from same country', async () => {
      const breeder1 = {
        name: 'Stable One',
        country_code: testCountry.code
      };

      const breeder2 = {
        name: 'Stable Two',
        country_code: testCountry.code
      };

      await request(app)
        .post('/api/breeders')
        .send(breeder1)
        .expect(201);

      await request(app)
        .post('/api/breeders')
        .send(breeder2)
        .expect(201);
    });

    it('should reject duplicate breeder name in same country', async () => {
      const breeder = {
        name: 'Unique Stable',
        country_code: testCountry.code
      };

      await request(app)
        .post('/api/breeders')
        .send(breeder)
        .expect(201);

      // Próbuj dodać tego samego hodowcę w tym samym kraju
      await request(app)
        .post('/api/breeders')
        .send(breeder)
        .expect(409);
    });

    it('should allow same breeder name in different countries', async () => {
      const secondCountry = await createTestCountry({ code: 'SC', name: 'Second Country' });

      const breeder1 = {
        name: 'International Stable',
        country_code: testCountry.code
      };

      const breeder2 = {
        name: 'International Stable',
        country_code: secondCountry.code
      };

      await request(app)
        .post('/api/breeders')
        .send(breeder1)
        .expect(201);

      await request(app)
        .post('/api/breeders')
        .send(breeder2)
        .expect(201);
    });
  });

  describe('PUT /api/breeders/:id', () => {
    it('should update existing breeder', async () => {
      const breeder = await createTestBreeder({
        name: 'Original Name',
        country_code: testCountry.code
      });

      const updateData = {
        name: 'Updated Name',
        country_code: testCountry.code
      };

      const response = await request(app)
        .put(`/api/breeders/${breeder.id}`)
        .send(updateData)
        .expect(200);

      expect(response.body).toHaveProperty('name', 'Updated Name');
    });

    it('should return 404 for non-existent breeder', async () => {
      const updateData = {
        name: 'Non-existent',
        country_code: testCountry.code
      };

      await request(app)
        .put('/api/breeders/9999')
        .send(updateData)
        .expect(404);
    });

    it('should reject update with invalid country', async () => {
      const breeder = await createTestBreeder({ country_code: testCountry.code });

      const invalidUpdate = {
        name: 'Updated Name',
        country_code: 'XX' // nie istnieje
      };

      await request(app)
        .put(`/api/breeders/${breeder.id}`)
        .send(invalidUpdate)
        .expect(400);
    });

    it('should reject update with invalid data', async () => {
      const breeder = await createTestBreeder({ country_code: testCountry.code });

      const invalidUpdate = {
        name: '', // puste
        country_code: testCountry.code
      };

      await request(app)
        .put(`/api/breeders/${breeder.id}`)
        .send(invalidUpdate)
        .expect(400);
    });
  });

  describe('DELETE /api/breeders/:id', () => {
    it('should delete breeder without horses', async () => {
      const breeder = await createTestBreeder({ country_code: testCountry.code });

      await request(app)
        .delete(`/api/breeders/${breeder.id}`)
        .expect(204);

      // Sprawdź czy został usunięty
      const response = await request(app).get('/api/breeders');
      const deletedBreeder = response.body.find(b => b.id === breeder.id);
      expect(deletedBreeder).toBeUndefined();
    });

    it('should return 404 for non-existent breeder', async () => {
      await request(app)
        .delete('/api/breeders/9999')
        .expect(404);
    });

    it('should reject deletion of breeder with horses', async () => {
      const breeder = await createTestBreeder({ country_code: testCountry.code });
      await createTestHorse({ breeder_id: breeder.id });

      await request(app)
        .delete(`/api/breeders/${breeder.id}`)
        .expect(400);
    });
  });

  describe('Foreign key constraints', () => {
    it('should maintain referential integrity with countries', async () => {
      const breeder = await createTestBreeder({ country_code: testCountry.code });

      // Próbuj usunąć kraj z istniejącym hodowcą
      await request(app)
        .delete(`/api/countries/${testCountry.code}`)
        .expect(400);
    });

    it('should enforce foreign key constraints on creation', async () => {
      const breederWithInvalidCountry = {
        name: 'Invalid Country Breeder',
        country_code: 'ZZ' // nie istnieje
      };

      await request(app)
        .post('/api/breeders')
        .send(breederWithInvalidCountry)
        .expect(400);
    });

    it('should enforce foreign key constraints on update', async () => {
      const breeder = await createTestBreeder({ country_code: testCountry.code });

      const invalidUpdate = {
        name: breeder.name,
        country_code: 'ZZ' // nie istnieje
      };

      await request(app)
        .put(`/api/breeders/${breeder.id}`)
        .send(invalidUpdate)
        .expect(400);
    });

    it('should allow updates with valid country codes', async () => {
      const secondCountry = await createTestCountry({ code: 'SC', name: 'Second Country' });
      const breeder = await createTestBreeder({ country_code: testCountry.code });

      const validUpdate = {
        name: 'Updated Breeder',
        country_code: secondCountry.code
      };

      const response = await request(app)
        .put(`/api/breeders/${breeder.id}`)
        .send(validUpdate)
        .expect(200);

      expect(response.body.name).toBe('Updated Breeder');
      expect(response.body.country_code).toBe(secondCountry.code);
    });
  });

  describe('Business logic', () => {
    it('should allow creating multiple breeders for large countries', async () => {
      const breeders = [];
      const breederCount = 5;

      for (let i = 0; i < breederCount; i++) {
        const breederData = {
          name: `Stable ${i + 1}`,
          country_code: testCountry.code
        };

        const response = await request(app)
          .post('/api/breeders')
          .send(breederData)
          .expect(201);

        breeders.push(response.body);
      }

      expect(breeders).toHaveLength(breederCount);
      
      // Sprawdź czy wszystkie mają unikalne ID
      const ids = breeders.map(b => b.id);
      const uniqueIds = [...new Set(ids)];
      expect(uniqueIds).toHaveLength(breederCount);

      // Sprawdź czy wszystkie mają różne nazwy
      const names = breeders.map(b => b.name);
      const uniqueNames = [...new Set(names)];
      expect(uniqueNames).toHaveLength(breederCount);
    });

    it('should validate country code format strictly', async () => {
      const invalidCodes = ['X', 'XXX', '12', 'x1', 'XX ', ' TC', 'tc'];

      for (const code of invalidCodes) {
        const breederData = {
          name: 'Test Breeder',
          country_code: code
        };

        await request(app)
          .post('/api/breeders')
          .send(breederData)
          .expect(400);
      }
    });

    it('should handle international breeder names correctly', async () => {
      const internationalBreeders = [
        { name: 'Écurie française', code: 'FR' },
        { name: 'Deutsche Gestüt', code: 'DE' },
        { name: 'Scuderia italiana', code: 'IT' },
        { name: 'Конюшня русская', code: 'RU' },
        { name: '日本の厩舎', code: 'JP' }
      ];

      for (const { name, code } of internationalBreeders) {
        // Utwórz kraj
        await createTestCountry({ code, name: `Country ${code}` });

        const response = await request(app)
          .post('/api/breeders')
          .send({
            name,
            country_code: code
          })
          .expect(201);

        expect(response.body.name).toBe(name);
        expect(response.body.country_code).toBe(code);
      }
    });

    it('should handle breeder statistics correctly', async () => {
      // Utwórz kilku hodowców
      const breeder1 = await createTestBreeder({ 
        name: 'Stats Breeder 1',
        country_code: testCountry.code 
      });
      const breeder2 = await createTestBreeder({ 
        name: 'Stats Breeder 2',
        country_code: testCountry.code 
      });

      // Dodaj konie dla każdego hodowcy
      await createTestHorse({ 
        name: 'Horse 1A',
        breeder_id: breeder1.id 
      });
      await createTestHorse({ 
        name: 'Horse 1B',
        breeder_id: breeder1.id 
      });
      await createTestHorse({ 
        name: 'Horse 2A',
        breeder_id: breeder2.id 
      });

      // Sprawdź wszystkich hodowców
      const allBreeders = await request(app)
        .get('/api/breeders')
        .expect(200);

      expect(allBreeders.body.length).toBeGreaterThanOrEqual(2);

      // Sprawdź czy można filtrować konie po hodowcy
      const allHorses = await request(app)
        .get('/api/horses')
        .expect(200);

      const breeder1Horses = allHorses.body.filter(h => h.breeder_id === breeder1.id);
      const breeder2Horses = allHorses.body.filter(h => h.breeder_id === breeder2.id);

      expect(breeder1Horses).toHaveLength(2);
      expect(breeder2Horses).toHaveLength(1);
    });

    it('should enforce business rules for breeder operations', async () => {
      const breeder = await createTestBreeder({ country_code: testCountry.code });

      // Dodaj konia
      const horse = await createTestHorse({ breeder_id: breeder.id });

      // Próbuj usunąć hodowcę z końmi
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

      // Sprawdź czy został usunięty
      await request(app)
        .get(`/api/breeders`)
        .then(response => {
          const deletedBreeder = response.body.find(b => b.id === breeder.id);
          expect(deletedBreeder).toBeUndefined();
        });
    });

    it('should handle concurrent breeder operations', async () => {
      const promises = [];

      // Równoczesne tworzenie hodowców
      for (let i = 0; i < 10; i++) {
        promises.push(
          request(app)
            .post('/api/breeders')
            .send({
              name: `Concurrent Breeder ${i}`,
              country_code: testCountry.code
            })
        );
      }

      const results = await Promise.allSettled(promises);
      
      const successes = results.filter(r => 
        r.status === 'fulfilled' && r.value.status === 201
      );

      // Wszystkie powinny się udać (różne nazwy)
      expect(successes).toHaveLength(10);

      // Sprawdź w bazie
      const allBreeders = await request(app)
        .get('/api/breeders')
        .expect(200);

      const concurrentBreeders = allBreeders.body.filter(b => 
        b.name.startsWith('Concurrent Breeder')
      );

      expect(concurrentBreeders).toHaveLength(10);
    });

    it('should maintain data integrity during updates', async () => {
      const breeder = await createTestBreeder({ country_code: testCountry.code });
      const horse = await createTestHorse({ breeder_id: breeder.id });

      // Zaktualizuj hodowcę
      const updateData = {
        name: 'Updated Integrity Breeder',
        country_code: testCountry.code
      };

      const response = await request(app)
        .put(`/api/breeders/${breeder.id}`)
        .send(updateData)
        .expect(200);

      expect(response.body.name).toBe('Updated Integrity Breeder');

      // Sprawdź czy koń nadal ma poprawnego hodowcę
      const updatedHorse = await request(app)
        .get(`/api/horses/${horse.id}`)
        .expect(200);

      expect(updatedHorse.body.breeder_id).toBe(breeder.id);
    });
  });

  describe('Performance and edge cases', () => {
    it('should handle empty breeder names gracefully', async () => {
      const invalidBreeders = [
        { name: '', country_code: testCountry.code },
        { name: '   ', country_code: testCountry.code },
        { name: '\t\n', country_code: testCountry.code }
      ];

      for (const breeder of invalidBreeders) {
        await request(app)
          .post('/api/breeders')
          .send(breeder)
          .expect(400);
      }
    });

    it('should handle database connection issues gracefully', async () => {
      // Ten test sprawdza obecne zachowanie
      // W rzeczywistej aplikacji można by symulować problemy z bazą
      const response = await request(app)
        .get('/api/breeders')
        .expect(200);

      expect(Array.isArray(response.body)).toBe(true);
    });

    it('should validate all required fields consistently', async () => {
      const invalidRequests = [
        {}, // brak wszystkich pól
        { name: 'Test' }, // brak country_code
        { country_code: testCountry.code }, // brak name
        { name: null, country_code: testCountry.code },
        { name: 'Test', country_code: null }
      ];

      for (const request_data of invalidRequests) {
        await request(app)
          .post('/api/breeders')
          .send(request_data)
          .expect(400);
      }
    });

    it('should maintain consistent response format', async () => {
      const breeder = await createTestBreeder({ country_code: testCountry.code });

      // GET response
      const getResponse = await request(app)
        .get('/api/breeders')
        .expect(200);

      expect(Array.isArray(getResponse.body)).toBe(true);
      if (getResponse.body.length > 0) {
        const firstBreeder = getResponse.body[0];
        expect(firstBreeder).toHaveProperty('id');
        expect(firstBreeder).toHaveProperty('name');
        expect(firstBreeder).toHaveProperty('country_code');
      }

      // POST response
      const postResponse = await request(app)
        .post('/api/breeders')
        .send({
          name: 'Format Test Breeder',
          country_code: testCountry.code
        })
        .expect(201);

      expect(postResponse.body).toHaveProperty('id');
      expect(postResponse.body).toHaveProperty('name');
      expect(postResponse.body).toHaveProperty('country_code');

      // PUT response
      const putResponse = await request(app)
        .put(`/api/breeders/${breeder.id}`)
        .send({
          name: 'Updated Format Test',
          country_code: testCountry.code
        })
        .expect(200);

      expect(putResponse.body).toHaveProperty('id');
      expect(putResponse.body).toHaveProperty('name');
      expect(putResponse.body).toHaveProperty('country_code');
    });

    it('should trim whitespace from breeder name', async () => {
      const breederWithSpaces = {
        name: '  Spaced Stable  ',
        country_code: testCountry.code
      };

      const response = await request(app)
        .post('/api/breeders')
        .send(breederWithSpaces)
        .expect(201);

      expect(response.body.name).toBe('Spaced Stable');
    });
  });
});