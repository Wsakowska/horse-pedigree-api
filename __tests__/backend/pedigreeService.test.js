const { calculateBreed, generatePedigreeHtml } = require('../../src/services/pedigreeService');

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

  it('zwraca null dla brakujących rodziców', async () => {
    const breed = await calculateBreed(global.testKnex, null, null);
    expect(breed).toBe(null);
  });

  it('zwraca null dla nieistniejących rodziców', async () => {
    const breed = await calculateBreed(global.testKnex, 999, 998);
    expect(breed).toBe(null);
  });

  it('zwraca xo dla nieznanych kombinacji', async () => {
    // Dodaj niestandardową rasę (ale tylko te dozwolone przez walidację)
    await global.testKnex('horses').insert([
      { id: 1, name: 'Ojciec', breed_id: 4, gender: 'ogier' }, // xxoo
      { id: 2, name: 'Matka', breed_id: 3, gender: 'klacz' }   // xo
    ]);
    const breed = await calculateBreed(global.testKnex, 1, 2);
    expect(breed).toBe('xxoo'); // ta kombinacja jest zdefiniowana
  });

  it('generuje HTML dla rodowodu', async () => {
    await global.testKnex('horses').insert([
      { id: 1, name: 'Bucefał', breed_id: 1, gender: 'ogier' }
    ]);
    const html = await generatePedigreeHtml(global.testKnex, 1, 0);
    expect(html).toContain('Bucefał');
    expect(html).toContain('data-horse-id="1"');
    expect(html).toContain('(ogier, oo)');
  });

  it('generuje HTML dla nieistniejącego konia', async () => {
    const html = await generatePedigreeHtml(global.testKnex, 999, 0);
    expect(html).toContain('Koń nie znaleziony');
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
  });
});