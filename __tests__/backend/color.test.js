const request = require('supertest');
   const express = require('express');
   const colorRoutes = require('../../src/routes/colorRoutes');
   const app = express();

   app.use(express.json());
   app.use('/api/colors', colorRoutes);

   describe('Color API', () => {
     it('pobiera wszystkie maści', async () => {
       await global.testKnex('colors').insert({ id: 1, name: 'Gniada' });
       const res = await request(app).get('/api/colors');
       expect(res.status).toBe(200);
       expect(res.body).toEqual([{ id: 1, name: 'Gniada' }]);
     });

     it('dodaje nową maść', async () => {
       const res = await request(app)
         .post('/api/colors')
         .send({ name: 'Kasztanowata' });
       expect(res.status).toBe(201);
       expect(res.body.name).toBe('Kasztanowata');
     });
   });