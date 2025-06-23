// __tests__/backend/breed.test.js
const request = require('supertest');
const app = require('../../src/app');

describe('Breeds API', () => {
  describe('GET /api/breeds', () => {
    it('should return all breeds', async () => {
      const response = await request(app)
        .get('/api/breeds')
        .expect(200);

      expect(Array.isArray(response.body)).toBe(true);
      
      if (response.body.length > 0) {
        const breed = response.body[0];
        expect(breed).toHaveProperty('id');
        expect(breed).toHaveProperty('name');
        expect(['oo', 'xx', 'xo', 'xxoo']).toContain(breed.name);
      }
    });

    it('should return standard horse breeds', async () => {
      const response = await request(app)
        .get('/api/breeds')
        .expect(200);

      const breedNames = response.body.map(b => b.name);
      
      // Sprawdź czy zawiera standardowe rasy
      expect(breedNames).toContain('oo');
      expect(breedNames).toContain('xx');
      expect(breedNames).toContain('xo');
      expect(breedNames).toContain('xxoo');
    });
  });

  describe('POST /api/breeds', () => {
    it('should create breed "oo"', async () => {
      const newBreed = { name: 'oo' };

      const response = await request(app)
        .post('/api/breeds')
        .send(newBreed)
        .expect(201);

      expect(response.body).toHaveProperty('id');
      expect(response.body).toHaveProperty('name', 'oo');
    });

    it('should create breed "xx"', async () => {
      const newBreed = { name: 'xx' };

      const response = await request(app)
        .post('/api/breeds')
        .send(newBreed)
        .expect(201);

      expect(response.body).toHaveProperty('name', 'xx');
    });

    it('should create breed "xo"', async () => {
      const newBreed = { name: 'xo' };

      const response = await request(app)
        .post('/api/breeds')
        .send(newBreed)
        .expect(201);

      expect(response.body).toHaveProperty('name', 'xo');
    });

    it('should create breed "xxoo"', async () => {
      const newBreed = { name: 'xxoo' };

      const response = await request(app)
        .post('/api/breeds')
        .send(newBreed)
        .expect(201);

      expect(response.body).toHaveProperty('name', 'xxoo');
    });

    it('should reject invalid breed names', async () => {
      const invalidBreeds = [
        { name: 'invalid' },
        { name: 'ooo' },
        { name: 'xxx' },
        { name: 'ox' },
        { name: 'xox' },
        { name: 'ooxx' },
        { name: 'xxooo' },
        { name: 'xy' },
        { name: '12' },
        { name: 'ab' }
      ];

      for (const breed of invalidBreeds) {
        await request(app)
          .post('/api/breeds')
          .send(breed)
          .expect(400);
      }
    });

    it('should reject missing breed name', async () => {
      const incompleteBreed = {};

      await request(app)
        .post('/api/breeds')
        .send(incompleteBreed)
        .expect(400);
    });

    it('should reject empty breed name', async () => {
      const emptyBreed = { name: '' };

      await request(app)
        .post('/api/breeds')
        .send(emptyBreed)
        .expect(400);
    });

    it('should reject null breed name', async () => {
      const nullBreed = { name: null };

      await request(app)
        .post('/api/breeds')
        .send(nullBreed)
        .expect(400);
    });

    it('should reject duplicate breed names', async () => {
      const breed = { name: 'oo' };

      // Dodaj pierwszy raz
      await request(app)
        .post('/api/breeds')
        .send(breed)
        .expect(201);

      // Próbuj dodać ponownie
      await request(app)
        .post('/api/breeds')
        .send(breed)
        .expect(409);
    });

    it('should handle case sensitivity', async () => {
      const breeds = [
        { name: 'oo' },
        { name: 'OO' },
        { name: 'Oo' },
        { name: 'oO' }
      ];

      // Dodaj pierwszą rasę
      await request(app)
        .post('/api/breeds')
        .send(breeds[0])
        .expect(201);

      // Sprawdź czy różne wielkości liter są odrzucane
      for (let i = 1; i < breeds.length; i++) {
        const response = await request(app)
          .post('/api/breeds')
          .send(breeds[i]);
        
        // Powinno być odrzucone jako nieprawidłowa nazwa lub duplikat
        expect([400, 409]).toContain(response.status);
      }
    });
  });

  describe('PUT /api/breeds/:id', () => {
    it('should update existing breed', async () => {
      const breed = await createTestBreed({ name: 'oo' });

      const updateData = { name: 'xx' };

      const response = await request(app)
        .put(`/api/breeds/${breed.id}`)
        .send(updateData)
        .expect(200);

      expect(response.body).toHaveProperty('name', 'xx');
    });

    it('should return 404 for non-existent breed', async () => {
      const updateData = { name: 'oo' };

      await request(app)
        .put('/api/breeds/9999')
        .send(updateData)
        .expect(404);
    });

    it('should reject update with invalid breed name', async () => {
      const breed = await createTestBreed({ name: 'oo' });

      const invalidUpdate = { name: 'invalid' };

      await request(app)
        .put(`/api/breeds/${breed.id}`)
        .send(invalidUpdate)
        .expect(400);
    });

    it('should reject update to duplicate name', async () => {
      const breed1 = await createTestBreed({ name: 'oo' });
      const breed2 = await createTestBreed({ name: 'xx' });

      const duplicateUpdate = { name: 'oo' };

      await request(app)
        .put(`/api/breeds/${breed2.id}`)
        .send(duplicateUpdate)
        .expect(409);
    });

    it('should allow updating to same name', async () => {
      const breed = await createTestBreed({ name: 'oo' });

      const sameNameUpdate = { name: 'oo' };

      const response = await request(app)
        .put(`/api/breeds/${breed.id}`)
        .send(sameNameUpdate)
        .expect(200);

      expect(response.body.name).toBe('oo');
    });
  });

  describe('DELETE /api/breeds/:id', () => {
    it('should delete breed without horses', async () => {
      const breed = await createTestBreed({ name: 'oo' });

      await request(app)
        .delete(`/api/breeds/${breed.id}`)
        .expect(204);

      // Sprawdź czy został usunięty
      const response = await request(app).get('/api/breeds');
      const deletedBreed = response.body.find(b => b.id === breed.id);
      expect(deletedBreed).toBeUndefined();
    });

    it('should return 404 for non-existent breed', async () => {
      await request(app)
        .delete('/api/breeds/9999')
        .expect(404);
    });

    it('should reject deletion of breed with horses', async () => {
      const breed = await createTestBreed({ name: 'oo' });
      await createTestHorse({ breed_id: breed.id });

      await request(app)
        .delete(`/api/breeds/${breed.id}`)
        .expect(400);
    });
  });

  describe('Breed validation and constraints', () => {
    it('should enforce strict breed name validation', async () => {
      const invalidNames = [
        'o',       // za krótkie
        'x',       // za krótkie  
        'oox',     // nieprawidłowy format
        'xxo',     // nieprawidłowy format
        'xoo',     // nieprawidłowy format
        'oxx',     // nieprawidłowy format
        'xxxo',    // za długie
        'ooox',    // za długie
        'xxooo',   // za długie
        'ooxxo',   // za długie
        'xy',      // nieprawidłowe znaki
        'ab',      // nieprawidłowe znaki
        '12',      // cyfry
        'o12',     // mieszane
        'xx ',     // ze spacją
        ' oo',     // ze spacją na początku
        'x\no',    // z newline
        'o\to',    // z tab
      ];

      for (const name of invalidNames) {
        await request(app)
          .post('/api/breeds')
          .send({ name })
          .expect(400);
      }
    });

    it('should enforce unique constraint on breed names', async () => {
      const breedName = 'xo';

      await request(app)
        .post('/api/breeds')
        .send({ name: breedName })
        .expect(201);

      await request(app)
        .post('/api/breeds')
        .send({ name: breedName })
        .expect(409);
    });

    it('should handle all valid breed combinations', async () => {
      const validBreeds = ['oo', 'xx', 'xo', 'xxoo'];

      for (const breedName of validBreeds) {
        const response = await request(app)
          .post('/api/breeds')
          .send({ name: breedName })
          .expect(201);

        expect(response.body.name).toBe(breedName);
      }

      // Sprawdź czy wszystkie zostały utworzone
      const allBreeds = await request(app)
        .get('/api/breeds')
        .expect(200);

      const createdBreeds = allBreeds.body.filter(b => 
        validBreeds.includes(b.name)
      );

      expect(createdBreeds).toHaveLength(validBreeds.length);
    });
  });

  describe('Business logic and breed rules', () => {
    it('should support breed inheritance rules validation', async () => {
      // Utwórz wszystkie rasy
      const breeds = {
        oo: await createTestBreed({ name: 'oo' }),
        xx: await createTestBreed({ name: 'xx' }),
        xo: await createTestBreed({ name: 'xo' }),
        xxoo: await createTestBreed({ name: 'xxoo' })
      };

      // Test czy rasy zostały utworzone prawidłowo
      expect(breeds.oo.name).toBe('oo');
      expect(breeds.xx.name).toBe('xx');
      expect(breeds.xo.name).toBe('xo');
      expect(breeds.xxoo.name).toBe('xxoo');
    });

    it('should maintain referential integrity with horses', async () => {
      const breed = await createTestBreed({ name: 'oo' });
      const horse = await createTestHorse({ breed_id: breed.id });

      // Próbuj usunąć rasę z istniejącym koniem
      await request(app)
        .delete(`/api/breeds/${breed.id}`)
        .expect(400);

      // Usuń konia
      await request(app)
        .delete(`/api/horses/${horse.id}`)
        .expect(204);

      // Teraz usuń rasę - powinno się udać
      await request(app)
        .delete(`/api/breeds/${breed.id}`)
        .expect(204);
    });

    it('should handle breed statistics correctly', async () => {
      // Utwórz rasy i konie
      const breedOO = await createTestBreed({ name: 'oo' });
      const breedXX = await createTestBreed({ name: 'xx' });

      // Utwórz konie różnych ras
      await createTestHorse({ 
        name: 'OO Horse 1',
        breed_id: breedOO.id 
      });
      await createTestHorse({ 
        name: 'OO Horse 2',
        breed_id: breedOO.id 
      });
      await createTestHorse({ 
        name: 'XX Horse 1',
        breed_id: breedXX.id 
      });

      // Sprawdź wszystkich koni
      const allHorses = await request(app)
        .get('/api/horses')
        .expect(200);

      const ooHorses = allHorses.body.filter(h => h.breed_id === breedOO.id);
      const xxHorses = allHorses.body.filter(h => h.breed_id === breedXX.id);

      expect(ooHorses).toHaveLength(2);
      expect(xxHorses).toHaveLength(1);
    });

    it('should validate breed name format strictly', async () => {
      // Test że akceptuje tylko dokładnie określone formaty
      const testCases = [
        { name: 'oo', shouldPass: true },
        { name: 'xx', shouldPass: true },
        { name: 'xo', shouldPass: true },
        { name: 'xxoo', shouldPass: true },
        { name: 'ooo', shouldPass: false },
        { name: 'xxx', shouldPass: false },
        { name: 'xxooo', shouldPass: false },
        { name: 'ooxx', shouldPass: false }
      ];

      for (const testCase of testCases) {
        const response = await request(app)
          .post('/api/breeds')
          .send({ name: testCase.name });

        if (testCase.shouldPass) {
          expect(response.status).toBe(201);
          expect(response.body.name).toBe(testCase.name);
        } else {
          expect(response.status).toBe(400);
        }
      }
    });
  });

  describe('Database operations', () => {
    it('should handle concurrent breed creation', async () => {
      const breeds = ['oo', 'xx', 'xo', 'xxoo'];
      
      // Wyślij równocześnie wszystkie rasy
      const promises = breeds.map(name => 
        request(app)
          .post('/api/breeds')
          .send({ name })
      );

      const results = await Promise.allSettled(promises);
      
      const successes = results.filter(r => 
        r.status === 'fulfilled' && r.value.status === 201
      );

      // Wszystkie powinny się udać (różne nazwy)
      expect(successes).toHaveLength(4);
    });

    it('should maintain consistent response format', async () => {
      const breed = await createTestBreed({ name: 'oo' });

      // GET response
      const getResponse = await request(app)
        .get('/api/breeds')
        .expect(200);

      expect(Array.isArray(getResponse.body)).toBe(true);
      if (getResponse.body.length > 0) {
        const firstBreed = getResponse.body[0];
        expect(firstBreed).toHaveProperty('id');
        expect(firstBreed).toHaveProperty('name');
      }

      // POST response
      const postResponse = await request(app)
        .post('/api/breeds')
        .send({ name: 'xx' })
        .expect(201);

      expect(postResponse.body).toHaveProperty('id');
      expect(postResponse.body).toHaveProperty('name');

      // PUT response
      const putResponse = await request(app)
        .put(`/api/breeds/${breed.id}`)
        .send({ name: 'xo' })
        .expect(200);

      expect(putResponse.body).toHaveProperty('id');
      expect(putResponse.body).toHaveProperty('name');
    });

    it('should handle rapid breed operations', async () => {
      const startTime = Date.now();

      // Utwórz wszystkie rasy
      const breeds = ['oo', 'xx', 'xo', 'xxoo'];
      const createdBreeds = [];

      for (const name of breeds) {
        const response = await request(app)
          .post('/api/breeds')
          .send({ name })
          .expect(201);
        
        createdBreeds.push(response.body);
      }

      // Zaktualizuj wszystkie rasy
      for (let i = 0; i < createdBreeds.length; i++) {
        const newName = breeds[(i + 1) % breeds.length]; // Rotate names
        await request(app)
          .put(`/api/breeds/${createdBreeds[i].id}`)
          .send({ name: newName })
          .expect(200);
      }

      const operationTime = Date.now() - startTime;
      console.log(`Breed operations completed in ${operationTime}ms`);

      expect(operationTime).toBeLessThan(5000); // Powinno być szybsze niż 5s
    });
  });

  describe('Error handling', () => {
    it('should handle database constraint violations', async () => {
      const breed = await createTestBreed({ name: 'oo' });

      // Próbuj dodać duplikat
      const duplicateResponse = await request(app)
        .post('/api/breeds')
        .send({ name: 'oo' });

      expect([409, 500]).toContain(duplicateResponse.status);
      expect(duplicateResponse.body).toHaveProperty('error');
    });

    it('should handle malformed request data', async () => {
      const malformedRequests = [
        {},                           // pusty obiekt
        { name: undefined },          // undefined name
        { name: {} },                 // obiekt jako nazwa
        { name: [] },                 // array jako nazwa
        { name: 123 },                // liczba jako nazwa
        { name: true },               // boolean jako nazwa
        { invalidField: 'oo' }        // niewłaściwe pole
      ];

      for (const requestData of malformedRequests) {
        await request(app)
          .post('/api/breeds')
          .send(requestData)
          .expect(400);
      }
    });

    it('should handle very long request processing', async () => {
      // Test timeout handling - symulacja długiej operacji
      const promises = [];
      
      for (let i = 0; i < 50; i++) {
        promises.push(
          request(app)
            .get('/api/breeds')
            .timeout(5000) // 5 sekund timeout
        );
      }

      const results = await Promise.allSettled(promises);
      
      const successes = results.filter(r => 
        r.status === 'fulfilled' && r.value.status === 200
      );

      // Większość powinna się udać
      expect(successes.length).toBeGreaterThan(40);
    });
  });

  describe('Integration with horse breeding rules', () => {
    it('should support complete breeding workflow', async () => {
      // Utwórz wszystkie potrzebne rasy
      const breedOO = await createTestBreed({ name: 'oo' });
      const breedXX = await createTestBreed({ name: 'xx' });
      const breedXXOO = await createTestBreed({ name: 'xxoo' });

      // Utwórz konie rodzice
      const sire = await createTestHorse({
        name: 'OO Sire',
        gender: 'ogier',
        breed_id: breedOO.id
      });

      const dam = await createTestHorse({
        name: 'XX Dam',
        gender: 'klacz',
        breed_id: breedXX.id
      });

      // Sprawdź możliwość krzyżowania
      const breedingCheck = await request(app)
        .get(`/api/horses/breeding/check?sire_id=${sire.id}&dam_id=${dam.id}`)
        .expect(200);

      expect(breedingCheck.body.predicted_breed).toBe('xxoo');

      // Utwórz potomka - rasa powinna być automatycznie obliczona
      const offspring = await createTestHorse({
        name: 'XXOO Offspring',
        gender: 'klacz',
        sire_id: sire.id,
        dam_id: dam.id
      });

      expect(offspring.breed_id).toBe(breedXXOO.id);
    });

    it('should validate all possible breed combinations', async () => {
      // Utwórz wszystkie rasy
      const breeds = {
        oo: await createTestBreed({ name: 'oo' }),
        xx: await createTestBreed({ name: 'xx' }),
        xo: await createTestBreed({ name: 'xo' }),
        xxoo: await createTestBreed({ name: 'xxoo' })
      };

      // Test wszystkich kombinacji zgodnie z regułami
      const breedingRules = [
        { sire: 'oo', dam: 'oo', expected: 'oo' },
        { sire: 'oo', dam: 'xo', expected: 'xo' },
        { sire: 'oo', dam: 'xx', expected: 'xxoo' },
        { sire: 'xx', dam: 'xx', expected: 'xx' },
        { sire: 'xx', dam: 'xo', expected: 'xo' },
        { sire: 'xx', dam: 'xxoo', expected: 'xxoo' },
        { sire: 'oo', dam: 'xxoo', expected: 'xxoo' }
      ];

      for (const rule of breedingRules) {
        const sire = await createTestHorse({
          gender: 'ogier',
          breed_id: breeds[rule.sire].id
        });

        const dam = await createTestHorse({
          gender: 'klacz',
          breed_id: breeds[rule.dam].id
        });

        const breedingCheck = await request(app)
          .get(`/api/horses/breeding/check?sire_id=${sire.id}&dam_id=${dam.id}`)
          .expect(200);

        expect(breedingCheck.body.predicted_breed).toBe(rule.expected);
      }
    });
  });
});