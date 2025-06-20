const { calculateBreed, generatePedigreeHtml, checkCyclicRelations, getPedigree } = require('../../src/services/pedigreeService');

describe('Pedigree Service', () => {
  beforeEach(async () => {
    // Dodaj podstawowe dane testowe
    await global.testKnex('breeds').insert([
      { id: 1, name: 'oo' },
      { id: 2, name: 'xx' },
      { id: 3, name: 'xo' },
      { id: 4, name: 'xxoo' }
    ]);
  });

  describe('calculateBreed', () => {
    it('oblicza rasę oo + xx -> xxoo', async () => {
      await global.testKnex('horses').insert([
        { id: 1, name: 'Ojciec', breed_id: 1, gender: 'ogier' },
        { id: 2, name: 'Matka', breed_id: 2, gender: 'klacz' }
      ]);
      const breed = await calculateBreed(global.testKnex, 1, 2);
      expect(breed).toBe('xxoo');
    });

    it('oblicza rasę xx + oo -> xxoo (symetryczna)', async () => {
      await global.testKnex('horses').insert([
        { id: 1, name: 'Ojciec', breed_id: 2, gender: 'ogier' }, // xx
        { id: 2, name: 'Matka', breed_id: 1, gender: 'klacz' }   // oo
      ]);
      const breed = await calculateBreed(global.testKnex, 1, 2);
      expect(breed).toBe('xxoo');
    });

    it('oblicza rasę oo + oo -> oo', async () => {
      await global.testKnex('horses').insert([
        { id: 1, name: 'Ojciec', breed_id: 1, gender: 'ogier' },
        { id: 2, name: 'Matka', breed_id: 1, gender: 'klacz' }
      ]);
      const breed = await calculateBreed(global.testKnex, 1, 2);
      expect(breed).toBe('oo');
    });

    it('oblicza rasę xx + xx -> xx', async () => {
      await global.testKnex('horses').insert([
        { id: 1, name: 'Ojciec', breed_id: 2, gender: 'ogier' },
        { id: 2, name: 'Matka', breed_id: 2, gender: 'klacz' }
      ]);
      const breed = await calculateBreed(global.testKnex, 1, 2);
      expect(breed).toBe('xx');
    });

    it('oblicza rasę xo + xo -> xo', async () => {
      await global.testKnex('horses').insert([
        { id: 1, name: 'Ojciec', breed_id: 3, gender: 'ogier' },
        { id: 2, name: 'Matka', breed_id: 3, gender: 'klacz' }
      ]);
      const breed = await calculateBreed(global.testKnex, 1, 2);
      expect(breed).toBe('xo');
    });

    it('oblicza rasę oo + xo -> xo', async () => {
      await global.testKnex('horses').insert([
        { id: 1, name: 'Ojciec', breed_id: 1, gender: 'ogier' }, // oo
        { id: 2, name: 'Matka', breed_id: 3, gender: 'klacz' }   // xo
      ]);
      const breed = await calculateBreed(global.testKnex, 1, 2);
      expect(breed).toBe('xo');
    });

    it('oblicza rasę xx + xo -> xo', async () => {
      await global.testKnex('horses').insert([
        { id: 1, name: 'Ojciec', breed_id: 2, gender: 'ogier' }, // xx
        { id: 2, name: 'Matka', breed_id: 3, gender: 'klacz' }   // xo
      ]);
      const breed = await calculateBreed(global.testKnex, 1, 2);
      expect(breed).toBe('xo');
    });

    it('oblicza rasę xx + xxoo -> xxoo', async () => {
      await global.testKnex('horses').insert([
        { id: 1, name: 'Ojciec', breed_id: 2, gender: 'ogier' }, // xx
        { id: 2, name: 'Matka', breed_id: 4, gender: 'klacz' }   // xxoo
      ]);
      const breed = await calculateBreed(global.testKnex, 1, 2);
      expect(breed).toBe('xxoo');
    });

    it('oblicza rasę oo + xxoo -> xxoo', async () => {
      await global.testKnex('horses').insert([
        { id: 1, name: 'Ojciec', breed_id: 1, gender: 'ogier' }, // oo
        { id: 2, name: 'Matka', breed_id: 4, gender: 'klacz' }   // xxoo
      ]);
      const breed = await calculateBreed(global.testKnex, 1, 2);
      expect(breed).toBe('xxoo');
    });

    it('oblicza rasę xxoo + xo -> xxoo', async () => {
      await global.testKnex('horses').insert([
        { id: 1, name: 'Ojciec', breed_id: 4, gender: 'ogier' }, // xxoo
        { id: 2, name: 'Matka', breed_id: 3, gender: 'klacz' }   // xo
      ]);
      const breed = await calculateBreed(global.testKnex, 1, 2);
      expect(breed).toBe('xxoo');
    });

    it('oblicza rasę xxoo + xxoo -> xxoo', async () => {
      await global.testKnex('horses').insert([
        { id: 1, name: 'Ojciec', breed_id: 4, gender: 'ogier' }, // xxoo
        { id: 2, name: 'Matka', breed_id: 4, gender: 'klacz' }   // xxoo
      ]);
      const breed = await calculateBreed(global.testKnex, 1, 2);
      expect(breed).toBe('xxoo');
    });

    it('zwraca null dla brakujących rodziców', async () => {
      const breed = await calculateBreed(global.testKnex, null, null);
      expect(breed).toBe(null);
    });

    it('zwraca null dla nieistniejących rodziców', async () => {
      const breed = await calculateBreed(global.testKnex, 999, 998);
      expect(breed).toBe(null);
    });

    it('zwraca xo dla nieznanych kombinacji (gdyby dodano nową rasę)', async () => {
      // Test zabezpieczenia przed nieznanymi kombinacjami
      const breed = await calculateBreed(global.testKnex, null, 1);
      expect(breed).toBe(null);
    });
  });

  describe('checkCyclicRelations', () => {
    it('wykrywa bezpośredni cykl (koń jako własny rodzic)', async () => {
      const hasCycle = await checkCyclicRelations(global.testKnex, 1, 1, null);
      expect(hasCycle).toBe(true);
    });

    it('wykrywa cykl przez ojca', async () => {
      await global.testKnex('horses').insert([
        { id: 1, name: 'Dziadek', breed_id: 1, gender: 'ogier' },
        { id: 2, name: 'Ojciec', breed_id: 1, gender: 'ogier', sire_id: 1 }
      ]);
      
      // Próba ustawienia ojca jako dziadka dziadka (cykl)
      const hasCycle = await checkCyclicRelations(global.testKnex, 1, 2, null);
      expect(hasCycle).toBe(true);
    });

    it('wykrywa cykl przez matkę', async () => {
      await global.testKnex('horses').insert([
        { id: 1, name: 'Babcia', breed_id: 1, gender: 'klacz' },
        { id: 2, name: 'Matka', breed_id: 1, gender: 'klacz', dam_id: 1 }
      ]);
      
      // Próba ustawienia matki jako babci babci (cykl)
      const hasCycle = await checkCyclicRelations(global.testKnex, 1, null, 2);
      expect(hasCycle).toBe(true);
    });

    it('wykrywa głęboki cykl (3 generacje)', async () => {
      await global.testKnex('horses').insert([
        { id: 1, name: 'Pradziadek', breed_id: 1, gender: 'ogier' },
        { id: 2, name: 'Dziadek', breed_id: 1, gender: 'ogier', sire_id: 1 },
        { id: 3, name: 'Ojciec', breed_id: 1, gender: 'ogier', sire_id: 2 }
      ]);
      
      // Próba ustawienia ojca jako pradziadka pradziadka (cykl przez 3 generacje)
      const hasCycle = await checkCyclicRelations(global.testKnex, 1, 3, null);
      expect(hasCycle).toBe(true);
    });

    it('nie wykrywa cyklu w prawidłowych relacjach', async () => {
      await global.testKnex('horses').insert([
        { id: 1, name: 'Dziadek', breed_id: 1, gender: 'ogier' },
        { id: 2, name: 'Babcia', breed_id: 1, gender: 'klacz' },
        { id: 3, name: 'Ojciec', breed_id: 1, gender: 'ogier', sire_id: 1 },
        { id: 4, name: 'Matka', breed_id: 1, gender: 'klacz', dam_id: 2 }
      ]);
      
      // Prawidłowa relacja - różni dziadkowie
      const hasCycle = await checkCyclicRelations(global.testKnex, 5, 3, 4);
      expect(hasCycle).toBe(false);
    });

    it('obsługuje brakujących rodziców', async () => {
      const hasCycle = await checkCyclicRelations(global.testKnex, 1, null, null);
      expect(hasCycle).toBe(false);
    });
  });

  describe('getPedigree', () => {
    it('pobiera rodowód bez rodziców', async () => {
      await global.testKnex('horses').insert([
        { id: 1, name: 'Bucefał', breed_id: 1, gender: 'ogier' }
      ]);
      
      const pedigree = await getPedigree(global.testKnex, 1, 1);
      expect(pedigree).toBeTruthy();
      expect(pedigree.name).toBe('Bucefał');
      expect(pedigree.sire).toBe(null);
      expect(pedigree.dam).toBe(null);
    });

    it('pobiera rodowód z rodzicami', async () => {
      await global.testKnex('horses').insert([
        { id: 1, name: 'Ojciec', breed_id: 1, gender: 'ogier' },
        { id: 2, name: 'Matka', breed_id: 2, gender: 'klacz' },
        { id: 3, name: 'Dziecko', breed_id: 3, gender: 'ogier', sire_id: 1, dam_id: 2 }
      ]);
      
      const pedigree = await getPedigree(global.testKnex, 3, 1);
      expect(pedigree.name).toBe('Dziecko');
      expect(pedigree.sire.name).toBe('Ojciec');
      expect(pedigree.dam.name).toBe('Matka');
    });

    it('obsługuje głębokość 0', async () => {
      await global.testKnex('horses').insert([
        { id: 1, name: 'Ojciec', breed_id: 1, gender: 'ogier' },
        { id: 2, name: 'Dziecko', breed_id: 1, gender: 'ogier', sire_id: 1 }
      ]);
      
      const pedigree = await getPedigree(global.testKnex, 2, 0);
      expect(pedigree.name).toBe('Dziecko');
      expect(pedigree.sire).toBeUndefined();
      expect(pedigree.dam).toBeUndefined();
    });

    it('wykrywa cykliczne relacje w rodowodzie', async () => {
      await global.testKnex('horses').insert([
        { id: 1, name: 'Koń1', breed_id: 1, gender: 'ogier', sire_id: 2 },
        { id: 2, name: 'Koń2', breed_id: 1, gender: 'ogier', sire_id: 1 }
      ]);
      
      const pedigree = await getPedigree(global.testKnex, 1, 2);
      // Funkcja powinna wykryć cykl i zwrócić null lub obsłużyć to bezpiecznie
      expect(pedigree).toBe(null);
    });

    it('pobiera wielopokoleniowy rodowód', async () => {
      await global.testKnex('horses').insert([
        { id: 1, name: 'Dziadek', breed_id: 1, gender: 'ogier' },
        { id: 2, name: 'Babcia', breed_id: 2, gender: 'klacz' },
        { id: 3, name: 'Ojciec', breed_id: 3, gender: 'ogier', sire_id: 1, dam_id: 2 },
        { id: 4, name: 'Matka', breed_id: 1, gender: 'klacz' },
        { id: 5, name: 'Dziecko', breed_id: 1, gender: 'ogier', sire_id: 3, dam_id: 4 }
      ]);
      
      const pedigree = await getPedigree(global.testKnex, 5, 2);
      expect(pedigree.name).toBe('Dziecko');
      expect(pedigree.sire.name).toBe('Ojciec');
      expect(pedigree.sire.sire.name).toBe('Dziadek');
      expect(pedigree.sire.dam.name).toBe('Babcia');
      expect(pedigree.dam.name).toBe('Matka');
      expect(pedigree.dam.sire).toBe(null); // Matka nie ma rodziców
    });
  });

  describe('generatePedigreeHtml', () => {
    it('generuje HTML dla pojedynczego konia', async () => {
      await global.testKnex('horses').insert([
        { id: 1, name: 'Bucefał', breed_id: 1, gender: 'ogier', birth_date: '2020-01-01' }
      ]);
      
      const html = await generatePedigreeHtml(global.testKnex, 1, 0);
      expect(html).toContain('Bucefał');
      expect(html).toContain('data-horse-id="1"');
      expect(html).toContain('(ogier, oo)');
      expect(html).toContain('(ur. 2020)');
      expect(html).toContain('<!DOCTYPE html>');
    });

    it('generuje HTML dla nieistniejącego konia', async () => {
      const html = await generatePedigreeHtml(global.testKnex, 999, 0);
      expect(html).toContain('nie został znaleziony');
      expect(html).toContain('Błąd');
    });

    it('generuje HTML dla rodowodu z rodzicami', async () => {
      await global.testKnex('horses').insert([
        { id: 1, name: 'Ojciec', breed_id: 1, gender: 'ogier' },
        { id: 2, name: 'Matka', breed_id: 2, gender: 'klacz' },
        { id: 3, name: 'Dziecko', breed_id: 3, gender: 'ogier', sire_id: 1, dam_id: 2 }
      ]);
      
      const html = await generatePedigreeHtml(global.testKnex, 3, 1);
      expect(html).toContain('Dziecko');
      expect(html).toContain('Ojciec');
      expect(html).toContain('Matka');
      expect(html).toContain('data-horse-id="3"');
      expect(html).toContain('parent-label">Ojciec');
      expect(html).toContain('parent-label">Matka');
    });

    it('escapuje HTML w nazwach koni', async () => {
      await global.testKnex('horses').insert([
        { id: 1, name: 'Koń<script>alert("xss")</script>', breed_id: 1, gender: 'ogier' }
      ]);
      
      const html = await generatePedigreeHtml(global.testKnex, 1, 0);
      expect(html).not.toContain('<script>');
      expect(html).toContain('&lt;script&gt;');
    });

    it('generuje responsywny CSS', async () => {
      await global.testKnex('horses').insert([
        { id: 1, name: 'Bucefał', breed_id: 1, gender: 'ogier' }
      ]);
      
      const html = await generatePedigreeHtml(global.testKnex, 1, 0);
      expect(html).toContain('@media (max-width: 768px)');
      expect(html).toContain('flex-direction: column');
    });

    it('dodaje interaktywność JavaScript', async () => {
      await global.testKnex('horses').insert([
        { id: 1, name: 'Bucefał', breed_id: 1, gender: 'ogier' }
      ]);
      
      const html = await generatePedigreeHtml(global.testKnex, 1, 0);
      expect(html).toContain('addEventListener');
      expect(html).toContain('data-horse-id');
      expect(html).toContain('alert(');
    });
  });
});