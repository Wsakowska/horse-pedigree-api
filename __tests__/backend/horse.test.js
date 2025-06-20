const request = require('supertest');
const express = require('express');
const horseRoutes = require('../../src/routes/horseRoutes');
const app = express();

app.use(express.json());
app.use('/api/horses', horseRoutes);

describe('Horse API', () => {
  // Helper function to setup fresh test data FOR EVERY TEST
  async function setupTestData() {
    // ZAWSZE dodawaj wszystkie dane w odpowiedniej kolejności
    // 1. Kraje
    await global.testKnex('countries').insert([
      { code: 'PL', name: 'Polska' },
      { code: 'DE', name: 'Niemcy' }
    ]);
    
    // 2. Rasy
    await global.testKnex('breeds').insert([
      { id: 1, name: 'oo' },
      { id: 2, name: 'xx' },
      { id: 3, name: 'xo' },
      { id: 4, name: 'xxoo' }
    ]);
    
    // 3. Maści
    await global.testKnex('colors').insert([
      { id: 1, name: 'Gniada' },
      { id: 2, name: 'Kara' },
      { id: 3, name: 'Siwa' }
    ]);
    
    // 4. Hodowcy (po krajach!)
    await global.testKnex('breeders').insert([
      { id: 1, name: 'Hodowla XYZ', country_code: 'PL' },
      { id: 2, name: 'Hodowla ABC', country_code: 'DE' }
    ]);
  }

  describe('GET /horses', () => {
    it('pobiera wszystkie konie', async () => {
      await setupTestData();
      await global.testKnex('horses').insert({
        id: 1,
        name: 'Bucefał',
        breed_id: 1,
        gender: 'ogier',
        color_id: 1,
        breeder_id: 1
      });
      
      const res = await request(app).get('/api/horses');
      expect(res.status).toBe(200);
      expect(res.body).toHaveLength(1);
      expect(res.body[0].name).toBe('Bucefał');
    });

    it('filtruje konie po płci', async () => {
      await setupTestData();
      await global.testKnex('horses').insert([
        { id: 1, name: 'Ogier1', breed_id: 1, gender: 'ogier', color_id: 1, breeder_id: 1 },
        { id: 2, name: 'Klacz1', breed_id: 1, gender: 'klacz', color_id: 1, breeder_id: 1 }
      ]);
      
      const res = await request(app).get('/api/horses?gender=ogier');
      expect(res.status).toBe(200);
      expect(res.body).toHaveLength(1);
      expect(res.body[0].name).toBe('Ogier1');
    });

    it('stosuje paginację', async () => {
      await setupTestData();
      // Wstaw 3 konie
      await global.testKnex('horses').insert([
        { id: 1, name: 'Koń1', breed_id: 1, gender: 'ogier', color_id: 1, breeder_id: 1 },
        { id: 2, name: 'Koń2', breed_id: 1, gender: 'klacz', color_id: 1, breeder_id: 1 },
        { id: 3, name: 'Koń3', breed_id: 1, gender: 'wałach', color_id: 1, breeder_id: 1 }
      ]);
      const res = await request(app).get('/api/horses?limit=2&offset=1');
      expect(res.status).toBe(200);
      expect(res.body).toHaveLength(2);
    });
  });

  describe('GET /horses/:id', () => {
    it('pobiera pojedynczego konia', async () => {
      await setupTestData();
      await global.testKnex('horses').insert({
        id: 1,
        name: 'Bucefał',
        breed_id: 1,
        gender: 'ogier',
        color_id: 1,
        breeder_id: 1
      });
      const res = await request(app).get('/api/horses/1');
      expect(res.status).toBe(200);
      expect(res.body.name).toBe('Bucefał');
    });

    it('zwraca 404 dla nieistniejącego konia', async () => {
      const res = await request(app).get('/api/horses/999');
      expect(res.status).toBe(404);
      expect(res.body.error).toBe('Koń nie znaleziony');
    });
  });

  describe('POST /horses', () => {
    it('dodaje nowego konia', async () => {
      await setupTestData();
      const res = await request(app)
        .post('/api/horses')
        .send({
          name: 'Luna',
          breed_id: 1,
          gender: 'klacz',
          color_id: 1,
          breeder_id: 1
        });
      expect(res.status).toBe(201);
      expect(res.body.name).toBe('Luna');
    });

    it('zwraca błąd dla duplikatu nazwy', async () => {
      await setupTestData();
      await global.testKnex('horses').insert({
        id: 1,
        name: 'Bucefał',
        breed_id: 1,
        gender: 'ogier',
        color_id: 1,
        breeder_id: 1
      });
      const res = await request(app)
        .post('/api/horses')
        .send({
          name: 'Bucefał',
          breed_id: 1,
          gender: 'klacz',
          color_id: 1,
          breeder_id: 1
        });
      expect(res.status).toBe(409);
      expect(res.body.error).toBe('Koń o takiej nazwie już istnieje');
    });

    it('zwraca błąd dla nieprawidłowej płci', async () => {
      await setupTestData();
      const res = await request(app)
        .post('/api/horses')
        .send({
          name: 'Luna',
          breed_id: 1,
          gender: 'niepoprawna',
          color_id: 1,
          breeder_id: 1
        });
      expect(res.status).toBe(400);
      expect(res.body.error).toContain('must be one of');
    });

    it('automatycznie oblicza rasę dla potomstwa', async () => {
      await setupTestData();
      // Dodaj rodziców
      await global.testKnex('horses').insert([
        { id: 1, name: 'Ojciec_oo', breed_id: 1, gender: 'ogier', color_id: 1, breeder_id: 1 }, // oo
        { id: 2, name: 'Matka_xx', breed_id: 2, gender: 'klacz', color_id: 1, breeder_id: 1 }   // xx
      ]);
      
      const res = await request(app)
        .post('/api/horses')
        .send({
          name: 'Dziecko',
          breed_id: 3, // xo - będzie zastąpione obliczoną rasą
          gender: 'ogier',
          sire_id: 1,
          dam_id: 2,
          color_id: 1,
          breeder_id: 1
        });
      
      expect(res.status).toBe(201);
      expect(res.body.breed_id).toBe(4); // xxoo (wynik oo + xx)
    });

    it('waliduje płeć rodziców', async () => {
      await setupTestData();
      await global.testKnex('horses').insert([
        { id: 1, name: 'NieOgier', breed_id: 1, gender: 'klacz', color_id: 1, breeder_id: 1 }
      ]);
      
      const res = await request(app)
        .post('/api/horses')
        .send({
          name: 'Dziecko',
          breed_id: 1,
          gender: 'ogier',
          sire_id: 1, // klacz jako ojciec - błąd
          color_id: 1,
          breeder_id: 1
        });
      
      expect(res.status).toBe(400);
      expect(res.body.error).toBe('Ojciec musi być ogierem');
    });

    it('zapobiega identycznym rodzicom', async () => {
      await setupTestData();
      await global.testKnex('horses').insert([
        { id: 1, name: 'Ogier', breed_id: 1, gender: 'ogier', color_id: 1, breeder_id: 1 }
      ]);
      
      const res = await request(app)
        .post('/api/horses')
        .send({
          name: 'Dziecko',
          breed_id: 1,
          gender: 'ogier',
          sire_id: 1,
          dam_id: 1, // ten sam koń jako ojciec i matka
          color_id: 1,
          breeder_id: 1
        });
      
      expect(res.status).toBe(400);
      expect(res.body.error).toBe('Ojciec i matka nie mogą być tym samym koniem');
    });
  });

  describe('PUT /horses/:id', () => {
    it('aktualizuje konia', async () => {
      await setupTestData();
      await global.testKnex('horses').insert({
        id: 1,
        name: 'Stara Nazwa',
        breed_id: 1,
        gender: 'ogier',
        color_id: 1,
        breeder_id: 1
      });
      
      const res = await request(app)
        .put('/api/horses/1')
        .send({
          name: 'Nowa Nazwa',
          breed_id: 1,
          gender: 'ogier',
          color_id: 1,
          breeder_id: 1
        });
      
      expect(res.status).toBe(200);
      expect(res.body.name).toBe('Nowa Nazwa');
    });

    it('zapobiega cyklicznym relacjom', async () => {
      await setupTestData();
      await global.testKnex('horses').insert([
        { id: 1, name: 'Dziadek', breed_id: 1, gender: 'ogier', color_id: 1, breeder_id: 1 },
        { id: 2, name: 'Ojciec', breed_id: 1, gender: 'ogier', color_id: 1, breeder_id: 1, sire_id: 1 },
        { id: 3, name: 'Syn', breed_id: 1, gender: 'ogier', color_id: 1, breeder_id: 1, sire_id: 2 }
      ]);
      
      // Próba ustawienia syna jako ojca dziadka (cykl)
      const res = await request(app)
        .put('/api/horses/1')
        .send({
          name: 'Dziadek',
          breed_id: 1,
          gender: 'ogier',
          sire_id: 3, // syn jako ojciec dziadka
          color_id: 1,
          breeder_id: 1
        });
      
      expect(res.status).toBe(400);
      expect(res.body.error).toContain('cykliczna relacja');
    });

    it('zapobiega samorodztwie', async () => {
      await setupTestData();
      await global.testKnex('horses').insert({
        id: 1,
        name: 'Koń',
        breed_id: 1,
        gender: 'ogier',
        color_id: 1,
        breeder_id: 1
      });
      
      const res = await request(app)
        .put('/api/horses/1')
        .send({
          name: 'Koń',
          breed_id: 1,
          gender: 'ogier',
          sire_id: 1, // sam siebie jako ojciec
          color_id: 1,
          breeder_id: 1
        });
      
      expect(res.status).toBe(400);
      expect(res.body.error).toBe('Koń nie może być swoim własnym ojcem');
    });
  });

  describe('DELETE /horses/:id', () => {
    it('usuwa konia bez potomstwa', async () => {
      await setupTestData();
      await global.testKnex('horses').insert({
        id: 1,
        name: 'Koń',
        breed_id: 1,
        gender: 'ogier',
        color_id: 1,
        breeder_id: 1
      });
      
      const res = await request(app).delete('/api/horses/1');
      expect(res.status).toBe(204);
    });

    it('zapobiega usunięciu konia z potomstwem', async () => {
      await setupTestData();
      await global.testKnex('horses').insert([
        { id: 1, name: 'Ojciec', breed_id: 1, gender: 'ogier', color_id: 1, breeder_id: 1 },
        { id: 2, name: 'Dziecko', breed_id: 1, gender: 'klacz', color_id: 1, breeder_id: 1, sire_id: 1 }
      ]);
      
      const res = await request(app).delete('/api/horses/1');
      expect(res.status).toBe(400);
      expect(res.body.error).toContain('potomstwo');
    });
  });

  describe('GET /horses/:id/pedigree/:depth', () => {
    it('pobiera rodowód konia', async () => {
      await setupTestData();
      await global.testKnex('horses').insert([
        { id: 1, name: 'Ojciec', breed_id: 1, gender: 'ogier', color_id: 1, breeder_id: 1 },
        { id: 2, name: 'Matka', breed_id: 1, gender: 'klacz', color_id: 1, breeder_id: 1 },
        { id: 3, name: 'Dziecko', breed_id: 1, gender: 'ogier', color_id: 1, breeder_id: 1, sire_id: 1, dam_id: 2 }
      ]);
      const res = await request(app).get('/api/horses/3/pedigree/1');
      expect(res.status).toBe(200);
      expect(res.body.name).toBe('Dziecko');
      expect(res.body.sire.name).toBe('Ojciec');
      expect(res.body.dam.name).toBe('Matka');
    });

    it('zwraca błąd dla nieprawidłowej głębokości', async () => {
      const res = await request(app).get('/api/horses/1/pedigree/15');
      expect(res.status).toBe(400);
      expect(res.body.error).toContain('między 0 a 10');
    });
  });

  describe('GET /horses/:id/offspring', () => {
    it('pobiera potomstwo konia', async () => {
      await setupTestData();
      await global.testKnex('horses').insert([
        { id: 1, name: 'Ojciec', breed_id: 1, gender: 'ogier', color_id: 1, breeder_id: 1 },
        { id: 2, name: 'Dziecko', breed_id: 1, gender: 'klacz', color_id: 1, breeder_id: 1, sire_id: 1 }
      ]);
      const res = await request(app).get('/api/horses/1/offspring');
      expect(res.status).toBe(200);
      expect(res.body.offspring).toHaveLength(1);
      expect(res.body.offspring[0].name).toBe('Dziecko');
      expect(res.body.pagination.total).toBe(1);
    });

    it('filtruje potomstwo po płci', async () => {
      await setupTestData();
      await global.testKnex('horses').insert([
        { id: 1, name: 'Ojciec', breed_id: 1, gender: 'ogier', color_id: 1, breeder_id: 1 },
        { id: 2, name: 'Syn', breed_id: 1, gender: 'ogier', color_id: 1, breeder_id: 1, sire_id: 1 },
        { id: 3, name: 'Córka', breed_id: 1, gender: 'klacz', color_id: 1, breeder_id: 1, sire_id: 1 }
      ]);
      const res = await request(app).get('/api/horses/1/offspring?gender=klacz');
      expect(res.status).toBe(200);
      expect(res.body.offspring).toHaveLength(1);
      expect(res.body.offspring[0].name).toBe('Córka');
    });
  });

  describe('GET /horses/:id/pedigree/html/:depth', () => {
    it('generuje HTML rodowodu', async () => {
      await setupTestData();
      await global.testKnex('horses').insert([
        { id: 1, name: 'Bucefał', breed_id: 1, gender: 'ogier', color_id: 1, breeder_id: 1 }
      ]);
      const res = await request(app).get('/api/horses/1/pedigree/html/0');
      expect(res.status).toBe(200);
      expect(res.text).toContain('Bucefał');
      expect(res.text).toContain('data-horse-id="1"');
      expect(res.headers['content-type']).toContain('text/html');
    });

    it('ogranicza głębokość HTML do 5', async () => {
      const res = await request(app).get('/api/horses/1/pedigree/html/10');
      expect(res.status).toBe(400);
      expect(res.body.error).toContain('między 0 a 5');
    });
  });

  describe('GET /horses/breeding/check', () => {
    it('sprawdza możliwość krzyżowania', async () => {
      await setupTestData();
      await global.testKnex('horses').insert([
        { id: 1, name: 'Ogier', breed_id: 1, gender: 'ogier', color_id: 1, breeder_id: 1 },
        { id: 2, name: 'Klacz', breed_id: 2, gender: 'klacz', color_id: 1, breeder_id: 1 }
      ]);
      
      const res = await request(app).get('/api/horses/breeding/check?sire_id=1&dam_id=2');
      expect(res.status).toBe(200);
      expect(res.body.breeding_possible).toBe(true);
      expect(res.body.predicted_breed).toBe('xxoo'); // oo + xx = xxoo
      expect(res.body.inbreeding_detected).toBe(false);
    });

    it('wykrywa nieprawidłowe płcie przy krzyżowaniu', async () => {
      await setupTestData();
      await global.testKnex('horses').insert([
        { id: 1, name: 'Klacz1', breed_id: 1, gender: 'klacz', color_id: 1, breeder_id: 1 },
        { id: 2, name: 'Klacz2', breed_id: 2, gender: 'klacz', color_id: 1, breeder_id: 1 }
      ]);
      
      const res = await request(app).get('/api/horses/breeding/check?sire_id=1&dam_id=2');
      expect(res.status).toBe(400);
      expect(res.body.error).toBe('Ojciec musi być ogierem');
    });

    it('wykrywa pokrewieństwo', async () => {
      await setupTestData();
      await global.testKnex('horses').insert([
        { id: 1, name: 'Dziadek', breed_id: 1, gender: 'ogier', color_id: 1, breeder_id: 1 },
        { id: 2, name: 'Babcia', breed_id: 2, gender: 'klacz', color_id: 1, breeder_id: 1 },
        { id: 3, name: 'Ojciec', breed_id: 3, gender: 'ogier', color_id: 1, breeder_id: 1, sire_id: 1, dam_id: 2 },
        { id: 4, name: 'Matka', breed_id: 3, gender: 'klacz', color_id: 1, breeder_id: 1, sire_id: 1 } // ten sam dziadek
      ]);
      
      const res = await request(app).get('/api/horses/breeding/check?sire_id=3&dam_id=4');
      expect(res.status).toBe(200);
      expect(res.body.breeding_possible).toBe(true);
      expect(res.body.inbreeding_detected).toBe(true);
      expect(res.body.common_ancestors).toContain(1); // wspólny dziadek
      expect(res.body.recommendation).toContain('pokrewieństwo');
    });
  });
});