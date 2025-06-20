const { calculateBreed, generatePedigreeHtml } = require('../../src/services/pedigreeService');

   describe('Pedigree Service', () => {
     it('oblicza rasę oo + xx -> xxoo', async () => {
       await global.testKnex('breeds').insert([
         { id: 1, name: 'oo' },
         { id: 2, name: 'xx' },
         { id: 3, name: 'xo' },
         { id: 4, name: 'xxoo' }
       ]);
       await global.testKnex('horses').insert([
         { id: 1, name: 'Ojciec', breed_id: 1, gender: 'ogier' },
         { id: 2, name: 'Matka', breed_id: 2, gender: 'klacz' }
       ]);
       const breed = await calculateBreed(global.testKnex, 1, 2);
       expect(breed).toBe('xxoo');
     });

     it('zwraca null dla brakujących rodziców', async () => {
       const breed = await calculateBreed(global.testKnex, null, null);
       expect(breed).toBe(null);
     });

     it('generuje HTML dla rodowodu', async () => {
       await global.testKnex('breeds').insert({ id: 1, name: 'oo' });
       await global.testKnex('horses').insert([
         { id: 1, name: 'Bucefał', breed_id: 1, gender: 'ogier' }
       ]);
       const html = await generatePedigreeHtml(global.testKnex, 1, 0);
       expect(html).toContain('Bucefał');
       expect(html).toContain('data-horse-id="1"');
     });
   });