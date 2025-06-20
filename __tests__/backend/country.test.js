const request = require('supertest');
const express = require('express');
const countryRoutes = require('../../src/routes/countryRoutes');
const app = express();

app.use(express.json());
app.use('/api/countries', countryRoutes);

describe('Country API', () => {
  it('pobiera wszystkie kraje', async () => {
    await global.testKnex('countries').insert({ code: 'PL', name: 'Polska' });
    const res = await request(app).get('/api/countries');
    expect(res.status).toBe(200);
    expect(res.body).toEqual([{ code: 'PL', name: 'Polska' }]);
  });

  it('dodaje nowy kraj', async () => {
    const res = await request(app)
      .post('/api/countries')
      .send({ code: 'DE', name: 'Niemcy' });
    expect(res.status).toBe(201);
    expect(res.body).toEqual({ code: 'DE', name: 'Niemcy' });

    const countries = await global.testKnex('countries').select('*');
    expect(countries).toHaveLength(1);
    expect(countries[0]).toEqual({ code: 'DE', name: 'Niemcy' });
  });

  it('zwraca błąd dla nieprawidłowego kodu ISO', async () => {
    const res = await request(app)
      .post('/api/countries')
      .send({ code: '123', name: 'Nieprawidłowy' });
    expect(res.status).toBe(400);
    expect(res.body.error).toContain('length must be 2');
  });

  it('aktualizuje kraj', async () => {
    await global.testKnex('countries').insert({ code: 'PL', name: 'Polska' });
    const res = await request(app)
      .put('/api/countries/PL')
      .send({ code: 'PL', name: 'Polska Nowa' });
    expect(res.status).toBe(200);
    expect(res.body).toEqual({ code: 'PL', name: 'Polska Nowa' });
  });

  it('usuwa kraj', async () => {
    await global.testKnex('countries').insert({ code: 'PL', name: 'Polska' });
    const res = await request(app).delete('/api/countries/PL');
    expect(res.status).toBe(204);

    const countries = await global.testKnex('countries').select('*');
    expect(countries).toHaveLength(0);
  });
});
