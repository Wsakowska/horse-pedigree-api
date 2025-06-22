// __tests__/backend/country.test.js
const request = require('supertest');
const app = require('../../src/app');

describe('Countries API', () => {
  describe('GET /api/countries', () => {
    it('should return all countries', async () => {
      const response = await request(app)
        .get('/api/countries')
        .expect(200);

      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body.length).toBeGreaterThan(0);
      
      // Sprawdź strukturę pierwszego kraju
      const country = response.body[0];
      expect(country).toHaveProperty('code');
      expect(country).toHaveProperty('name');
      expect(country.code).toMatch(/^[A-Z]{2}$/);
    });
  });

  describe('POST /api/countries', () => {
    it('should create a new country with valid data', async () => {
      const newCountry = {
        code: 'AU',
        name: 'Australia'
      };

      const response = await request(app)
        .post('/api/countries')
        .send(newCountry)
        .expect(201);

      expect(response.body).toHaveProperty('code', 'AU');
      expect(response.body).toHaveProperty('name', 'Australia');
    });

    it('should reject country with invalid code length', async () => {
      const invalidCountry = {
        code: 'USA', // 3 znaki zamiast 2
        name: 'United States'
      };

      await request(app)
        .post('/api/countries')
        .send(invalidCountry)
        .expect(400);
    });

    it('should reject country with missing required fields', async () => {
      const incompleteCountry = {
        code: 'BR'
        // brak name
      };

      await request(app)
        .post('/api/countries')
        .send(incompleteCountry)
        .expect(400);
    });

    it('should reject duplicate country code', async () => {
      const country = {
        code: 'CA',
        name: 'Canada'
      };

      // Dodaj pierwszy raz
      await request(app)
        .post('/api/countries')
        .send(country)
        .expect(201);

      // Próbuj dodać ponownie
      await request(app)
        .post('/api/countries')
        .send(country)
        .expect(409);
    });

    it('should reject country with empty strings', async () => {
      const emptyCountry = {
        code: '',
        name: ''
      };

      await request(app)
        .post('/api/countries')
        .send(emptyCountry)
        .expect(400);
    });
  });

  describe('PUT /api/countries/:code', () => {
    it('should update existing country', async () => {
      // Najpierw utwórz kraj
      const newCountry = {
        code: 'NZ',
        name: 'New Zealand'
      };

      await request(app)
        .post('/api/countries')
        .send(newCountry)
        .expect(201);

      // Następnie zaktualizuj
      const updatedCountry = {
        code: 'NZ',
        name: 'Nowa Zelandia'
      };

      const response = await request(app)
        .put('/api/countries/NZ')
        .send(updatedCountry)
        .expect(200);

      expect(response.body).toHaveProperty('name', 'Nowa Zelandia');
    });

    it('should return 404 for non-existent country', async () => {
      const updatedCountry = {
        code: 'XX',
        name: 'Non-existent Country'
      };

      await request(app)
        .put('/api/countries/XX')
        .send(updatedCountry)
        .expect(404);
    });

    it('should reject update with invalid data', async () => {
      // Utwórz kraj
      await createTestCountry({ code: 'IN', name: 'India' });

      const invalidUpdate = {
        code: 'INVALID', // nieprawidłowy kod
        name: 'India Updated'
      };

      await request(app)
        .put('/api/countries/IN')
        .send(invalidUpdate)
        .expect(400);
    });
  });

  describe('DELETE /api/countries/:code', () => {
    it('should delete existing country without dependencies', async () => {
      // Utwórz kraj
      const country = await createTestCountry({ code: 'TT', name: 'Test Country' });

      await request(app)
        .delete(`/api/countries/${country.code}`)
        .expect(204);

      // Sprawdź czy został usunięty
      await request(app)
        .get('/api/countries')
        .then(response => {
          const countries = response.body;
          const deletedCountry = countries.find(c => c.code === 'TT');
          expect(deletedCountry).toBeUndefined();
        });
    });

    it('should return 404 for non-existent country', async () => {
      await request(app)
        .delete('/api/countries/XX')
        .expect(404);
    });

    it('should reject deletion of country with dependent breeders', async () => {
      // Utwórz kraj z hodowcą
      const country = await createTestCountry({ code: 'DP', name: 'Dependent Country' });
      await createTestBreeder({ country_code: country.code });

      await request(app)
        .delete(`/api/countries/${country.code}`)
        .expect(400);
    });
  });

  describe('Validation edge cases', () => {
    it('should trim whitespace from inputs', async () => {
      const countryWithSpaces = {
        code: '  MX  ',
        name: '  Mexico  '
      };

      const response = await request(app)
        .post('/api/countries')
        .send(countryWithSpaces)
        .expect(201);

      expect(response.body.code).toBe('MX');
      expect(response.body.name).toBe('Mexico');
    });

    it('should handle special characters in country name', async () => {
      const specialCountry = {
        code: 'CI',
        name: "Côte d'Ivoire"
      };

      const response = await request(app)
        .post('/api/countries')
        .send(specialCountry)
        .expect(201);

      expect(response.body.name).toBe("Côte d'Ivoire");
    });

    it('should reject excessively long country names', async () => {
      const longNameCountry = {
        code: 'LN',
        name: 'A'.repeat(101) // 101 znaków, limit to 100
      };

      await request(app)
        .post('/api/countries')
        .send(longNameCountry)
        .expect(400);
    });
  });

  describe('Database constraints', () => {
    it('should enforce unique constraint on country code', async () => {
      const country1 = { code: 'UK', name: 'United Kingdom' };
      const country2 = { code: 'UK', name: 'Ukraine' };

      await request(app)
        .post('/api/countries')
        .send(country1)
        .expect(201);

      await request(app)
        .post('/api/countries')
        .send(country2)
        .expect(409);
    });

    it('should handle concurrent requests gracefully', async () => {
      const country = { code: 'CC', name: 'Concurrent Country' };

      // Wyślij równocześnie dwa identyczne requesty
      const promises = [
        request(app).post('/api/countries').send(country),
        request(app).post('/api/countries').send(country)
      ];

      const results = await Promise.allSettled(promises);
      
      // Jeden powinien się udać, drugi nie
      const successes = results.filter(r => r.status === 'fulfilled' && r.value.status === 201);
      const failures = results.filter(r => r.status === 'fulfilled' && r.value.status !== 201);
      
      expect(successes.length).toBe(1);
      expect(failures.length).toBe(1);
    });
  });
});