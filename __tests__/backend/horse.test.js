const request = require('supertest');
const express = require('express');
const horseRoutes = require('../../src/routes/horseRoutes');
const app = express();

app.use(express.json());
app.use('/api/horses', horseRoutes);

describe('Horse API', () => {
  beforeEach(async () => {
    // Przygotuj dane testowe
    await global.testKnex('countries').insert({ code: 'PL', name: 'Polska' });
    await global.testKnex('breeds').insert({ id: 1, name: 'oo' });
    await global.testKnex('colors').insert({ id: 1, name: 'Gniada' });
    await global.testKnex('breeders').insert({ id: 1, name: 'Hodowla XYZ', country_code: 'PL' });
  });

  it('pobiera wszystkie konie', async () => {
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

  it('dodaje nowego konia', async () => {
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

  it('zwraca błąd dla nieprawidłowej płci', async () => {
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

  it('pobiera rodowód konia', async () => {
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

  it('pobiera potomstwo konia', async () => {
    await global.testKnex('horses').insert([
      { id: 1, name: 'Ojciec', breed_id: 1, gender: 'ogier', color_id: 1, breeder_id: 1 },
      { id: 2, name: 'Dziecko', breed_id: 1, gender: 'klacz', color_id: 1, breeder_id: 1, sire_id: 1 }
    ]);
    const res = await request(app).get('/api/horses/1/offspring');
    expect(res.status).toBe(200);
    expect(res.body).toHaveLength(1);
    expect(res.body[0].name).toBe('Dziecko');
  });
});