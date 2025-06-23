// __tests__/backend/color.test.js
const request = require('supertest');
const app = require('../../src/app');

describe('Colors API', () => {
  describe('GET /api/colors', () => {
    it('should return all colors', async () => {
      const response = await request(app)
        .get('/api/colors')
        .expect(200);

      expect(Array.isArray(response.body)).toBe(true);
      
      if (response.body.length > 0) {
        const color = response.body[0];
        expect(color).toHaveProperty('id');
        expect(color).toHaveProperty('name');
        expect(typeof color.name).toBe('string');
      }
    });

    it('should handle unicode characters in color names', async () => {
      const unicodeColor = {
        name: 'Gniada złocista'
      };

      const response = await request(app)
        .post('/api/colors')
        .send(unicodeColor)
        .expect(201);

      expect(response.body.name).toBe('Gniada złocista');
    });

    it('should handle special characters in color names', async () => {
      const specialColor = {
        name: 'Gniada "ciemna" & błyszcząca'
      };

      const response = await request(app)
        .post('/api/colors')
        .send(specialColor)
        .expect(201);

      expect(response.body.name).toBe('Gniada "ciemna" & błyszcząca');
    });
  });

  describe('POST /api/colors', () => {
    it('should create a new color with valid data', async () => {
      const newColor = {
        name: 'Bury'
      };

      const response = await request(app)
        .post('/api/colors')
        .send(newColor)
        .expect(201);

      expect(response.body).toHaveProperty('id');
      expect(response.body).toHaveProperty('name', 'Bury');
    });

    it('should reject color with missing name', async () => {
      const incompleteColor = {};

      await request(app)
        .post('/api/colors')
        .send(incompleteColor)
        .expect(400);
    });

    it('should reject color with empty name', async () => {
      const emptyNameColor = {
        name: ''
      };

      await request(app)
        .post('/api/colors')
        .send(emptyNameColor)
        .expect(400);
    });

    it('should reject color name longer than 50 characters', async () => {
      const longNameColor = {
        name: 'A'.repeat(51)
      };

      await request(app)
        .post('/api/colors')
        .send(longNameColor)
        .expect(400);
    });

    it('should allow color name exactly 50 characters', async () => {
      const maxLengthColor = {
        name: 'A'.repeat(50)
      };

      const response = await request(app)
        .post('/api/colors')
        .send(maxLengthColor)
        .expect(201);

      expect(response.body.name).toHaveLength(50);
    });

    it('should reject duplicate color names', async () => {
      const colorName = 'Unique Color';
      
      const color = {
        name: colorName
      };

      // Dodaj pierwszy raz
      await request(app)
        .post('/api/colors')
        .send(color)
        .expect(201);

      // Próbuj dodać ponownie
      await request(app)
        .post('/api/colors')
        .send(color)
        .expect(409);
    });

    it('should handle whitespace in color names', async () => {
      const colorWithSpaces = {
        name: '  Gniada jasna  '
      };

      const response = await request(app)
        .post('/api/colors')
        .send(colorWithSpaces)
        .expect(201);

      expect(response.body.name).toBe('Gniada jasna');
    });

    it('should allow common horse color names', async () => {
      const commonColors = [
        'Gniada',
        'Kara',
        'Siwa',
        'Kasztanowata',
        'Izabelowata',
        'Bury',
        'Dereszowata',
        'Skórzana',
        'Szampańska',
        'Kremello'
      ];

      for (const colorName of commonColors) {
        const response = await request(app)
          .post('/api/colors')
          .send({ name: colorName })
          .expect(201);

        expect(response.body.name).toBe(colorName);
      }
    });
  });

  describe('PUT /api/colors/:id', () => {
    it('should update existing color', async () => {
      const color = await createTestColor({ name: 'Original Color' });

      const updateData = {
        name: 'Updated Color'
      };

      const response = await request(app)
        .put(`/api/colors/${color.id}`)
        .send(updateData)
        .expect(200);

      expect(response.body).toHaveProperty('name', 'Updated Color');
    });

    it('should return 404 for non-existent color', async () => {
      const updateData = {
        name: 'Non-existent Color'
      };

      await request(app)
        .put('/api/colors/9999')
        .send(updateData)
        .expect(404);
    });

    it('should reject update with invalid data', async () => {
      const color = await createTestColor();

      const invalidUpdate = {
        name: '' // puste
      };

      await request(app)
        .put(`/api/colors/${color.id}`)
        .send(invalidUpdate)
        .expect(400);
    });

    it('should reject update to duplicate name', async () => {
      const color1 = await createTestColor({ name: 'Color One' });
      const color2 = await createTestColor({ name: 'Color Two' });

      const duplicateUpdate = {
        name: 'Color One' // już istnieje
      };

      await request(app)
        .put(`/api/colors/${color2.id}`)
        .send(duplicateUpdate)
        .expect(409);
    });

    it('should allow updating to same name', async () => {
      const color = await createTestColor({ name: 'Same Color' });

      const sameNameUpdate = {
        name: 'Same Color'
      };

      const response = await request(app)
        .put(`/api/colors/${color.id}`)
        .send(sameNameUpdate)
        .expect(200);

      expect(response.body.name).toBe('Same Color');
    });
  });

  describe('DELETE /api/colors/:id', () => {
    it('should delete color without horses', async () => {
      const color = await createTestColor({ name: 'Deletable Color' });

      await request(app)
        .delete(`/api/colors/${color.id}`)
        .expect(204);

      // Sprawdź czy został usunięty
      const response = await request(app).get('/api/colors');
      const deletedColor = response.body.find(c => c.id === color.id);
      expect(deletedColor).toBeUndefined();
    });

    it('should return 404 for non-existent color', async () => {
      await request(app)
        .delete('/api/colors/9999')
        .expect(404);
    });

    it('should reject deletion of color with horses', async () => {
      const color = await createTestColor({ name: 'Color with Horses' });
      await createTestHorse({ color_id: color.id });

      await request(app)
        .delete(`/api/colors/${color.id}`)
        .expect(400);
    });
  });

  describe('Validation edge cases', () => {
    it('should handle null and undefined values', async () => {
      const nullColor = {
        name: null
      };

      await request(app)
        .post('/api/colors')
        .send(nullColor)
        .expect(400);

      const undefinedColor = {
        // name undefined
      };

      await request(app)
        .post('/api/colors')
        .send(undefinedColor)
        .expect(400);
    });

    it('should handle numeric names', async () => {
      const numericColor = {
        name: '123'
      };

      const response = await request(app)
        .post('/api/colors')
        .send(numericColor)
        .expect(201);

      expect(response.body.name).toBe('123');
    });

    it('should handle mixed case names', async () => {
      const mixedCaseColor = {
        name: 'GnIaDa JaSnA'
      };

      const response = await request(app)
        .post('/api/colors')
        .send(mixedCaseColor)
        .expect(201);

      expect(response.body.name).toBe('GnIaDa JaSnA');
    });

    it('should handle names with newlines and tabs', async () => {
      const weirdColor = {
        name: 'Color\nwith\ttabs'
      };

      const response = await request(app)
        .post('/api/colors')
        .send(weirdColor)
        .expect(201);

      expect(response.body.name).toBe('Color\nwith\ttabs');
    });
  });

  describe('Database constraints', () => {
    it('should enforce unique constraint on color name', async () => {
      const color1 = { name: 'Unique Test Color' };
      const color2 = { name: 'Unique Test Color' };

      await request(app)
        .post('/api/colors')
        .send(color1)
        .expect(201);

      await request(app)
        .post('/api/colors')
        .send(color2)
        .expect(409);
    });

    it('should handle case sensitivity correctly', async () => {
      const lowerCase = { name: 'gniada' };
      const upperCase = { name: 'GNIADA' };
      const mixedCase = { name: 'Gniada' };

      await request(app)
        .post('/api/colors')
        .send(lowerCase)
        .expect(201);

      // Czy system rozróżnia wielkość liter?
      const response1 = await request(app)
        .post('/api/colors')
        .send(upperCase);

      const response2 = await request(app)
        .post('/api/colors')
        .send(mixedCase);

      // Sprawdź czy zostały potraktowane jako różne
      expect([response1.status, response2.status]).toContain(201);
    });

    it('should handle concurrent color creation', async () => {
      const colorName = 'Concurrent Color';

      // Wyślij równocześnie dwa identyczne requesty
      const promises = [
        request(app).post('/api/colors').send({ name: colorName }),
        request(app).post('/api/colors').send({ name: colorName })
      ];

      const results = await Promise.allSettled(promises);
      
      // Jeden powinien się udać, drugi nie
      const successes = results.filter(r => r.status === 'fulfilled' && r.value.status === 201);
      const failures = results.filter(r => r.status === 'fulfilled' && r.value.status === 409);
      
      expect(successes.length).toBe(1);
      expect(failures.length).toBe(1);
    });
  });

  describe('Business logic', () => {
    it('should handle international color names', async () => {
      const internationalColors = [
        { name: 'Bay' }, // angielski
        { name: 'Brun' }, // francuski
        { name: 'Braun' }, // niemiecki
        { name: 'Baio' }, // włoski
        { name: 'Гнедая' }, // rosyjski
        { name: '栗毛' } // japoński
      ];

      for (const color of internationalColors) {
        const response = await request(app)
          .post('/api/colors')
          .send(color)
          .expect(201);

        expect(response.body.name).toBe(color.name);
      }
    });

    it('should support descriptive color names', async () => {
      const descriptiveColors = [
        'Gniada ciemna z końskim włosem',
        'Kasztanowata ze srebrzystym odcieniem',
        'Siwa jabłkowita z białymi plamami',
        'Izabelowata kremowa z ciemnymi punktami'
      ];

      for (const colorName of descriptiveColors) {
        const response = await request(app)
          .post('/api/colors')
          .send({ name: colorName })
          .expect(201);

        expect(response.body.name).toBe(colorName);
      }
    });

    it('should maintain referential integrity with horses', async () => {
      const color = await createTestColor({ name: 'Integrity Color' });
      const horse = await createTestHorse({ color_id: color.id });

      // Próbuj usunąć kolor z istniejącym koniem
      await request(app)
        .delete(`/api/colors/${color.id}`)
        .expect(400);

      // Usuń konia
      await request(app)
        .delete(`/api/horses/${horse.id}`)
        .expect(204);

      // Teraz usuń kolor - powinno się udać
      await request(app)
        .delete(`/api/colors/${color.id}`)
        .expect(204);
    });

    it('should handle colors with similar names', async () => {
      const similarColors = [
        'Gniada',
        'Gniada jasna',
        'Gniada ciemna',
        'Gniada złocista',
        'Gniada płowa'
      ];

      for (const colorName of similarColors) {
        const response = await request(app)
          .post('/api/colors')
          .send({ name: colorName })
          .expect(201);

        expect(response.body.name).toBe(colorName);
      }

      // Sprawdź czy wszystkie zostały utworzone
      const allColors = await request(app)
        .get('/api/colors')
        .expect(200);

      const createdColors = allColors.body.filter(c => 
        similarColors.includes(c.name)
      );

      expect(createdColors).toHaveLength(similarColors.length);
    });
  });

  describe('Performance and scalability', () => {
    it('should handle large number of colors', async () => {
      const startTime = Date.now();
      const colors = [];

      // Utwórz 100 maści
      for (let i = 0; i < 100; i++) {
        const color = await createTestColor({ name: `Performance Color ${i}` });
        colors.push(color);
      }

      const creationTime = Date.now() - startTime;
      console.log(`Created 100 colors in ${creationTime}ms`);

      // Sprawdź pobieranie wszystkich
      const fetchStart = Date.now();
      const response = await request(app)
        .get('/api/colors')
        .expect(200);

      const fetchTime = Date.now() - fetchStart;
      console.log(`Fetched ${response.body.length} colors in ${fetchTime}ms`);

      expect(response.body.length).toBeGreaterThanOrEqual(100);
    });

    it('should handle rapid color creation', async () => {
      const promises = [];

      // Równoczesne tworzenie maści
      for (let i = 0; i < 20; i++) {
        promises.push(
          request(app)
            .post('/api/colors')
            .send({ name: `Rapid Color ${i}` })
        );
      }

      const results = await Promise.allSettled(promises);
      
      const successes = results.filter(r => 
        r.status === 'fulfilled' && r.value.status === 201
      );

      // Wszystkie powinny się udać (różne nazwy)
      expect(successes).toHaveLength(20);
    });

    it('should maintain consistent response format', async () => {
      const color = await createTestColor();

      // GET response
      const getResponse = await request(app)
        .get('/api/colors')
        .expect(200);

      expect(Array.isArray(getResponse.body)).toBe(true);
      if (getResponse.body.length > 0) {
        const firstColor = getResponse.body[0];
        expect(firstColor).toHaveProperty('id');
        expect(firstColor).toHaveProperty('name');
      }

      // POST response
      const postResponse = await request(app)
        .post('/api/colors')
        .send({ name: 'Format Test Color' })
        .expect(201);

      expect(postResponse.body).toHaveProperty('id');
      expect(postResponse.body).toHaveProperty('name');

      // PUT response
      const putResponse = await request(app)
        .put(`/api/colors/${color.id}`)
        .send({ name: 'Updated Format Test' })
        .expect(200);

      expect(putResponse.body).toHaveProperty('id');
      expect(putResponse.body).toHaveProperty('name');
    });
  });
});