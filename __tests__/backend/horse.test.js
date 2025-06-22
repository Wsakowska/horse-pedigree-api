// __tests__/backend/horse.test.js
const request = require('supertest');
const app = require('../../src/app');

describe('Horses API', () => {
  let testCountry, testBreeder, testBreed, testColor;
  let sire, dam; // Konie rodzice do testów

  beforeEach(async () => {
    testCountry = await createTestCountry({ code: 'HC', name: 'Horse Country' });
    testBreeder = await createTestBreeder({ country_code: testCountry.code });
    testBreed = await createTestBreed({ name: 'oo' });
    testColor = await createTestColor({ name: 'Test Color' });

    // Utwórz konie rodzice
    sire = await createTestHorse({
      name: 'Test Sire',
      gender: 'ogier',
      breed_id: testBreed.id,
      color_id: testColor.id,
      breeder_id: testBreeder.id
    });

    dam = await createTestHorse({
      name: 'Test Dam',
      gender: 'klacz',
      breed_id: testBreed.id,
      color_id: testColor.id,
      breeder_id: testBreeder.id
    });
  });

  describe('GET /api/horses', () => {
    it('should return all horses', async () => {
      const response = await request(app)
        .get('/api/horses')
        .expect(200);

      expect(Array.isArray(response.body)).toBe(true);
      
      if (response.body.length > 0) {
        const horse = response.body[0];
        expect(horse).toHaveProperty('id');
        expect(horse).toHaveProperty('name');
        expect(horse).toHaveProperty('gender');
        expect(horse).toHaveProperty('breed_id');
      }
    });

    it('should filter horses by gender', async () => {
      await createTestHorse({ gender: 'klacz' });
      await createTestHorse({ gender: 'ogier' });

      const response = await request(app)
        .get('/api/horses?gender=klacz')
        .expect(200);

      response.body.forEach(horse => {
        expect(horse.gender).toBe('klacz');
      });
    });

    it('should filter horses by breed', async () => {
      const xxBreed = await createTestBreed({ name: 'xx' });
      await createTestHorse({ breed_id: xxBreed.id });

      const response = await request(app)
        .get(`/api/horses?breed_id=${xxBreed.id}`)
        .expect(200);

      response.body.forEach(horse => {
        expect(horse.breed_id).toBe(xxBreed.id);
      });
    });

    it('should support pagination', async () => {
      // Utwórz kilka koni
      for (let i = 0; i < 5; i++) {
        await createTestHorse({ name: `Horse ${i}` });
      }

      const response = await request(app)
        .get('/api/horses?limit=2&offset=1')
        .expect(200);

      expect(response.body.length).toBeLessThanOrEqual(2);
    });
  });

  describe('GET /api/horses/:id', () => {
    it('should return specific horse', async () => {
      const horse = await createTestHorse();

      const response = await request(app)
        .get(`/api/horses/${horse.id}`)
        .expect(200);

      expect(response.body).toHaveProperty('id', horse.id);
      expect(response.body).toHaveProperty('name', horse.name);
    });

    it('should return 404 for non-existent horse', async () => {
      await request(app)
        .get('/api/horses/9999')
        .expect(404);
    });
  });

  describe('POST /api/horses', () => {
    it('should create a new horse with valid data', async () => {
      const newHorse = {
        name: 'New Horse',
        gender: 'klacz',
        birth_date: '2020-01-01',
        color_id: testColor.id,
        breeder_id: testBreeder.id
      };

      const response = await request(app)
        .post('/api/horses')
        .send(newHorse)
        .expect(201);

      expect(response.body).toHaveProperty('name', 'New Horse');
      expect(response.body).toHaveProperty('gender', 'klacz');
      expect(response.body).toHaveProperty('breed_id'); // Should be auto-assigned
    });

    it('should automatically calculate breed from parents', async () => {
      const xxBreed = await createTestBreed({ name: 'xx' });
      const xxooBreed = await createTestBreed({ name: 'xxoo' });

      // Update dam to xx breed
      await testKnex('horses').where('id', dam.id).update({ breed_id: xxBreed.id });

      const newHorse = {
        name: 'Offspring Horse',
        gender: 'klacz',
        sire_id: sire.id, // oo breed
        dam_id: dam.id,   // xx breed
        color_id: testColor.id,
        breeder_id: testBreeder.id
      };

      const response = await request(app)
        .post('/api/horses')
        .send(newHorse)
        .expect(201);

      // oo + xx should = xxoo
      expect(response.body.breed_id).toBe(xxooBreed.id);
    });

    it('should reject horse with invalid gender', async () => {
      const invalidHorse = {
        name: 'Invalid Horse',
        gender: 'invalid',
        color_id: testColor.id,
        breeder_id: testBreeder.id
      };

      await request(app)
        .post('/api/horses')
        .send(invalidHorse)
        .expect(400);
    });

    it('should reject horse with future birth date', async () => {
      const futureDate = new Date();
      futureDate.setFullYear(futureDate.getFullYear() + 1);

      const invalidHorse = {
        name: 'Future Horse',
        gender: 'klacz',
        birth_date: futureDate.toISOString().split('T')[0],
        color_id: testColor.id,
        breeder_id: testBreeder.id
      };

      await request(app)
        .post('/api/horses')
        .send(invalidHorse)
        .expect(400);
    });

    it('should reject horse with non-ogier sire', async () => {
      const walach = await createTestHorse({ gender: 'wałach' });

      const invalidHorse = {
        name: 'Invalid Offspring',
        gender: 'klacz',
        sire_id: walach.id, // wałach nie może być ojcem
        dam_id: dam.id,
        color_id: testColor.id,
        breeder_id: testBreeder.id
      };

      await request(app)
        .post('/api/horses')
        .send(invalidHorse)
        .expect(400);
    });

    it('should reject horse with non-klacz dam', async () => {
      const walach = await createTestHorse({ gender: 'wałach' });

      const invalidHorse = {
        name: 'Invalid Offspring',
        gender: 'klacz',
        sire_id: sire.id,
        dam_id: walach.id, // wałach nie może być matką
        color_id: testColor.id,
        breeder_id: testBreeder.id
      };

      await request(app)
        .post('/api/horses')
        .send(invalidHorse)
        .expect(400);
    });

    it('should reject horse with same parent as both sire and dam', async () => {
      const invalidHorse = {
        name: 'Invalid Offspring',
        gender: 'klacz',
        sire_id: sire.id,
        dam_id: sire.id, // ten sam koń jako ojciec i matka
        color_id: testColor.id,
        breeder_id: testBreeder.id
      };

      await request(app)
        .post('/api/horses')
        .send(invalidHorse)
        .expect(400);
    });

    it('should reject duplicate horse name', async () => {
      const horseName = 'Unique Horse';
      
      await createTestHorse({ name: horseName });

      const duplicateHorse = {
        name: horseName,
        gender: 'klacz',
        color_id: testColor.id,
        breeder_id: testBreeder.id
      };

      await request(app)
        .post('/api/horses')
        .send(duplicateHorse)
        .expect(409);
    });

    it('should reject horse with non-existent parent', async () => {
      const invalidHorse = {
        name: 'Orphan Horse',
        gender: 'klacz',
        sire_id: 9999, // nie istnieje
        color_id: testColor.id,
        breeder_id: testBreeder.id
      };

      await request(app)
        .post('/api/horses')
        .send(invalidHorse)
        .expect(400);
    });
  });

  describe('PUT /api/horses/:id', () => {
    it('should update existing horse', async () => {
      const horse = await createTestHorse();

      const updateData = {
        name: 'Updated Horse',
        gender: horse.gender,
        breed_id: horse.breed_id,
        color_id: horse.color_id,
        breeder_id: horse.breeder_id
      };

      const response = await request(app)
        .put(`/api/horses/${horse.id}`)
        .send(updateData)
        .expect(200);

      expect(response.body).toHaveProperty('name', 'Updated Horse');
    });

    it('should return 404 for non-existent horse', async () => {
      const updateData = {
        name: 'Non-existent',
        gender: 'klacz',
        color_id: testColor.id,
        breeder_id: testBreeder.id
      };

      await request(app)
        .put('/api/horses/9999')
        .send(updateData)
        .expect(404);
    });

    it('should prevent creating cyclic parent relationships', async () => {
      const offspring = await createTestHorse({
        sire_id: sire.id,
        dam_id: dam.id
      });

      // Próbuj ustawić potomka jako rodzica swojego ojca
      const cyclicUpdate = {
        name: sire.name,
        gender: sire.gender,
        sire_id: offspring.id, // cykl!
        color_id: testColor.id,
        breeder_id: testBreeder.id
      };

      await request(app)
        .put(`/api/horses/${sire.id}`)
        .send(cyclicUpdate)
        .expect(400);
    });

    it('should recalculate breed when parents change', async () => {
      const horse = await createTestHorse();
      const xxBreed = await createTestBreed({ name: 'xx' });
      const xxooBreed = await createTestBreed({ name: 'xxoo' });

      // Ustaw ojca na xx
      await testKnex('horses').where('id', sire.id).update({ breed_id: xxBreed.id });

      const updateData = {
        name: horse.name,
        gender: horse.gender,
        sire_id: sire.id, // xx
        dam_id: dam.id,   // oo
        color_id: horse.color_id,
        breeder_id: horse.breeder_id
      };

      const response = await request(app)
        .put(`/api/horses/${horse.id}`)
        .send(updateData)
        .expect(200);

      // xx + oo should = xxoo
      expect(response.body.breed_id).toBe(xxooBreed.id);
    });
  });

  describe('DELETE /api/horses/:id', () => {
    it('should delete horse without offspring', async () => {
      const horse = await createTestHorse();

      await request(app)
        .delete(`/api/horses/${horse.id}`)
        .expect(204);

      // Sprawdź czy został usunięty
      await request(app)
        .get(`/api/horses/${horse.id}`)
        .expect(404);
    });

    it('should return 404 for non-existent horse', async () => {
      await request(app)
        .delete('/api/horses/9999')
        .expect(404);
    });

    it('should reject deletion of horse with offspring', async () => {
      const offspring = await createTestHorse({
        sire_id: sire.id,
        dam_id: dam.id
      });

      // Próbuj usunąć ojca
      await request(app)
        .delete(`/api/horses/${sire.id}`)
        .expect(400);

      // Próbuj usunąć matkę
      await request(app)
        .delete(`/api/horses/${dam.id}`)
        .expect(400);
    });
  });

  describe('GET /api/horses/:id/pedigree/:depth', () => {
    it('should return horse pedigree with depth 0', async () => {
      const response = await request(app)
        .get(`/api/horses/${sire.id}/pedigree/0`)
        .expect(200);

      expect(response.body).toHaveProperty('id', sire.id);
      expect(response.body).toHaveProperty('name', sire.name);
      expect(response.body).not.toHaveProperty('sire');
      expect(response.body).not.toHaveProperty('dam');
    });

    it('should return horse pedigree with depth 1', async () => {
      const offspring = await createTestHorse({
        sire_id: sire.id,
        dam_id: dam.id
      });

      const response = await request(app)
        .get(`/api/horses/${offspring.id}/pedigree/1`)
        .expect(200);

      expect(response.body).toHaveProperty('id', offspring.id);
      expect(response.body).toHaveProperty('sire');
      expect(response.body).toHaveProperty('dam');
      expect(response.body.sire).toHaveProperty('id', sire.id);
      expect(response.body.dam).toHaveProperty('id', dam.id);
    });

    it('should return 404 for non-existent horse', async () => {
      await request(app)
        .get('/api/horses/9999/pedigree/1')
        .expect(404);
    });

    it('should reject invalid depth', async () => {
      await request(app)
        .get(`/api/horses/${sire.id}/pedigree/15`)
        .expect(400);

      await request(app)
        .get(`/api/horses/${sire.id}/pedigree/-1`)
        .expect(400);
    });
  });

  describe('GET /api/horses/:id/offspring', () => {
    it('should return all offspring of a horse', async () => {
      const offspring1 = await createTestHorse({
        sire_id: sire.id,
        dam_id: dam.id
      });

      const offspring2 = await createTestHorse({
        sire_id: sire.id,
        dam_id: dam.id
      });

      const response = await request(app)
        .get(`/api/horses/${sire.id}/offspring`)
        .expect(200);

      expect(response.body).toHaveProperty('offspring');
      expect(response.body.offspring).toHaveLength(2);
      
      const offspringIds = response.body.offspring.map(o => o.id);
      expect(offspringIds).toContain(offspring1.id);
      expect(offspringIds).toContain(offspring2.id);
    });

    it('should filter offspring by gender', async () => {
      await createTestHorse({
        sire_id: sire.id,
        dam_id: dam.id,
        gender: 'klacz'
      });

      await createTestHorse({
        sire_id: sire.id,
        dam_id: dam.id,
        gender: 'ogier'
      });

      const response = await request(app)
        .get(`/api/horses/${sire.id}/offspring?gender=klacz`)
        .expect(200);

      response.body.offspring.forEach(horse => {
        expect(horse.gender).toBe('klacz');
      });
    });

    it('should filter offspring by breeder', async () => {
      const secondBreeder = await createTestBreeder({ 
        name: 'Second Breeder',
        country_code: testCountry.code 
      });

      await createTestHorse({
        sire_id: sire.id,
        dam_id: dam.id,
        breeder_id: testBreeder.id
      });

      await createTestHorse({
        sire_id: sire.id,
        dam_id: dam.id,
        breeder_id: secondBreeder.id
      });

      const response = await request(app)
        .get(`/api/horses/${sire.id}/offspring?breeder_id=${testBreeder.id}`)
        .expect(200);

      response.body.offspring.forEach(horse => {
        expect(horse.breeder_id).toBe(testBreeder.id);
      });
    });

    it('should support pagination for offspring', async () => {
      // Utwórz więcej potomstwa
      for (let i = 0; i < 5; i++) {
        await createTestHorse({
          sire_id: sire.id,
          dam_id: dam.id,
          name: `Offspring ${i}`
        });
      }

      const response = await request(app)
        .get(`/api/horses/${sire.id}/offspring?limit=2&offset=1`)
        .expect(200);

      expect(response.body.offspring.length).toBeLessThanOrEqual(2);
      expect(response.body).toHaveProperty('pagination');
      expect(response.body.pagination).toHaveProperty('total');
      expect(response.body.pagination).toHaveProperty('limit', 2);
      expect(response.body.pagination).toHaveProperty('offset', 1);
    });

    it('should return empty array for horse without offspring', async () => {
      const childlessHorse = await createTestHorse();

      const response = await request(app)
        .get(`/api/horses/${childlessHorse.id}/offspring`)
        .expect(200);

      expect(response.body.offspring).toHaveLength(0);
    });
  });

  describe('GET /api/horses/:id/pedigree/html/:depth', () => {
    it('should return HTML pedigree', async () => {
      const response = await request(app)
        .get(`/api/horses/${sire.id}/pedigree/html/1`)
        .expect(200);

      expect(response.headers['content-type']).toMatch(/text\/html/);
      expect(response.text).toContain('<html');
      expect(response.text).toContain(sire.name);
    });

    it('should reject invalid HTML depth', async () => {
      await request(app)
        .get(`/api/horses/${sire.id}/pedigree/html/10`)
        .expect(400);
    });
  });

  describe('GET /api/horses/breeding/check', () => {
    it('should check compatible breeding', async () => {
      const response = await request(app)
        .get(`/api/horses/breeding/check?sire_id=${sire.id}&dam_id=${dam.id}`)
        .expect(200);

      expect(response.body).toHaveProperty('breeding_possible', true);
      expect(response.body).toHaveProperty('predicted_breed');
      expect(response.body).toHaveProperty('risk_level');
    });

    it('should reject breeding with same horse as both parents', async () => {
      await request(app)
        .get(`/api/horses/breeding/check?sire_id=${sire.id}&dam_id=${sire.id}`)
        .expect(400);
    });

    it('should reject breeding with non-ogier sire', async () => {
      const klacz = await createTestHorse({ gender: 'klacz' });

      await request(app)
        .get(`/api/horses/breeding/check?sire_id=${klacz.id}&dam_id=${dam.id}`)
        .expect(400);
    });

    it('should detect parent-child breeding attempts', async () => {
      const offspring = await createTestHorse({
        sire_id: sire.id,
        dam_id: dam.id,
        gender: 'klacz'
      });

      // Próba krzyżowania ojca z córką
      await request(app)
        .get(`/api/horses/breeding/check?sire_id=${sire.id}&dam_id=${offspring.id}`)
        .expect(400);
    });

    it('should detect inbreeding between siblings', async () => {
      const brother = await createTestHorse({
        sire_id: sire.id,
        dam_id: dam.id,
        gender: 'ogier'
      });

      const sister = await createTestHorse({
        sire_id: sire.id,
        dam_id: dam.id,
        gender: 'klacz'
      });

      const response = await request(app)
        .get(`/api/horses/breeding/check?sire_id=${brother.id}&dam_id=${sister.id}`)
        .expect(200);

      expect(response.body.inbreeding_detected).toBe(true);
      expect(response.body.risk_level).toBe('high');
    });
  });

  describe('Breed calculation logic', () => {
    it('should calculate all breeding combinations correctly', async () => {
      const breeds = {
        oo: await createTestBreed({ name: 'oo' }),
        xx: await createTestBreed({ name: 'xx' }),
        xo: await createTestBreed({ name: 'xo' }),
        xxoo: await createTestBreed({ name: 'xxoo' })
      };

      const combinations = [
        { sire: 'oo', dam: 'oo', expected: 'oo' },
        { sire: 'oo', dam: 'xo', expected: 'xo' },
        { sire: 'oo', dam: 'xx', expected: 'xxoo' },
        { sire: 'xx', dam: 'xx', expected: 'xx' },
        { sire: 'xx', dam: 'xo', expected: 'xo' },
        { sire: 'xx', dam: 'xxoo', expected: 'xxoo' },
        { sire: 'oo', dam: 'xxoo', expected: 'xxoo' }
      ];

      for (const combo of combinations) {
        const testSire = await createTestHorse({
          gender: 'ogier',
          breed_id: breeds[combo.sire].id
        });

        const testDam = await createTestHorse({
          gender: 'klacz',
          breed_id: breeds[combo.dam].id
        });

        const offspring = await createTestHorse({
          sire_id: testSire.id,
          dam_id: testDam.id
        });

        expect(offspring.breed_id).toBe(breeds[combo.expected].id);
      }
    });
  });
});