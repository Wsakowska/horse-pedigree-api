const request = require('supertest');
const express = require('express');
const breederRoutes = require('../../src/routes/breederRoutes');
const app = express();

app.use(express.json());
app.use('/api/breeders', breederRoutes);

describe('Breeder API', () => {
  beforeEach(async () => {
    // Dodaj kraj do testów
    await global.testKnex('countries').insert({ code: 'PL', name: 'Polska' });
  });

  it('pobiera wszystkich hodowców', async () => {
    await global.testKnex('breeders').insert({ id: 1, name: 'Hodowla XYZ', country_code: 'PL' });
    const res = await request(app).get('/api/breeders');
    expect(res.status).toBe(200);
    expect(res.body).toEqual([{ id: 1, name: 'Hodowla XYZ', country_code: 'PL' }]);
  });

  it('dodaje nowego hodowcę', async () => {
    const res = await request(app)
      .post('/api/breeders')
      .send({ name: 'Hodowla ABC', country_code: 'PL' });
    expect(res.status).toBe(201);
    expect(res.body.name).toBe('Hodowla ABC');
    expect(res.body.country_code).toBe('PL');
  });

  it('zwraca błąd dla nieistniejącego kraju', async () => {
    const res = await request(app)
      .post('/api/breeders')
      .send({ name: 'Hodowla ABC', country_code: 'XX' });
    expect(res.status).toBe(400);
    expect(res.body.error).toContain('must be a valid country code');
  });
});