const request = require('supertest');
const express = require('express');
const breedRoutes = require('../../src/routes/breedRoutes');
const app = express();

app.use(express.json());
app.use('/api/breeds', breedRoutes);

describe('Breed API', () => {
  it('pobiera wszystkie rasy', async () => {
    await global.testKnex('breeds').insert({ id: 1, name: 'oo' });
    const res = await request(app).get('/api/breeds');
    expect(res.status).toBe(200);
    expect(res.body).toEqual([{ id: 1, name: 'oo' }]);
  });

  it('dodaje nową rasę', async () => {
    const res = await request(app)
      .post('/api/breeds')
      .send({ name: 'xx' });
    expect(res.status).toBe(201);
    expect(res.body.name).toBe('xx');
  });

  it('zwraca błąd dla nieprawidłowej rasy', async () => {
    const res = await request(app)
      .post('/api/breeds')
      .send({ name: 'niepoprawna' });
    expect(res.status).toBe(400);
    expect(res.body.error).toContain('must be one of [oo, xx, xo, xxoo]');
  });
});
