// __tests__/backend/pedigreeService.test.js
const {
  calculateBreed,
  getPedigree,
  getOffspring,
  generatePedigreeHtml,
  checkCyclicRelations
} = require('../../src/services/pedigreeService');

describe('PedigreeService', () => {
  let breeds, horses, testBreeder, testColor;

  beforeEach(async () => {
    const testCountry = await createTestCountry();
    testBreeder = await createTestBreeder({ country_code: testCountry.code });
    testColor = await createTestColor();

    // Utwórz wszystkie rasy
    breeds = {
      oo: await createTestBreed({ name: 'oo' }),
      xx: await createTestBreed({ name: 'xx' }),
      xo: await createTestBreed({ name: 'xo' }),
      xxoo: await createTestBreed({ name: 'xxoo' })
    };

    // Utwórz konie testowe
    horses = {
      sireOO: await createTestHorse({
        name: 'Sire OO',
        gender: 'ogier',
        breed_id: breeds.oo.id,
        color_id: testColor.id,
        breeder_id: testBreeder.id
      }),
      damXX: await createTestHorse({
        name: 'Dam XX',
        gender: 'klacz',
        breed_id: breeds.xx.id,
        color_id: testColor.id,
        breeder_id: testBreeder.id
      }),
      damXO: await createTestHorse({
        name: 'Dam XO',
        gender: 'klacz',
        breed_id: breeds.xo.id,
        color_id: testColor.id,
        breeder_id: testBreeder.id
      })
    };
  });

  describe('calculateBreed', () => {
    it('should calculate oo + xx = xxoo', async () => {
      const result = await calculateBreed(testKnex, horses.sireOO.id, horses.damXX.id);
      expect(result).toBe('xxoo');
    });

    it('should calculate oo + xo = xo', async () => {
      const result = await calculateBreed(testKnex, horses.sireOO.id, horses.damXO.id);
      expect(result).toBe('xo');
    });

    it('should handle symmetric combinations (xx + oo = xxoo)', async () => {
      const sireXX = await createTestHorse({
        gender: 'ogier',
        breed_id: breeds.xx.id
      });

      const damOO = await createTestHorse({
        gender: 'klacz',
        breed_id: breeds.oo.id
      });

      const result = await calculateBreed(testKnex, sireXX.id, damOO.id);
      expect(result).toBe('xxoo');
    });

    it('should return null for missing parents', async () => {
      const result1 = await calculateBreed(testKnex, null, horses.damXX.id);
      expect(result1).toBeNull();

      const result2 = await calculateBreed(testKnex, horses.sireOO.id, null);
      expect(result2).toBeNull();

      const result3 = await calculateBreed(testKnex, null, null);
      expect(result3).toBeNull();
    });

    it('should return null for non-existent parents', async () => {
      const result = await calculateBreed(testKnex, 9999, 9998);
      expect(result).toBeNull();
    });

    it('should handle all valid breed combinations', async () => {
      const combinations = [
        { sire: 'oo', dam: 'oo', expected: 'oo' },
        { sire: 'oo', dam: 'xo', expected: 'xo' },
        { sire: 'oo', dam: 'xx', expected: 'xxoo' },
        { sire: 'xx', dam: 'xx', expected: 'xx' },
        { sire: 'xx', dam: 'xo', expected: 'xo' },
        { sire: 'xx', dam: 'xxoo', expected: 'xxoo' },
        { sire: 'oo', dam: 'xxoo', expected: 'xxoo' },
        { sire: 'xo', dam: 'xo', expected: 'xo' },
        { sire: 'xxoo', dam: 'xo', expected: 'xxoo' },
        { sire: 'xxoo', dam: 'xxoo', expected: 'xxoo' }
      ];

      for (const combo of combinations) {
        const testSire = await createTestHorse({
          gender: 'ogier',
          breed_id: breeds[combo.sire].id
        });

        const testDam = await createTestHorse({
          gender: 'klacz',
          breed_id: breeds[combo.dam].id
        });

        const result = await calculateBreed(testKnex, testSire.id, testDam.id);
        expect(result).toBe(combo.expected);
      }
    });

    it('should handle database errors gracefully', async () => {
      // Symuluj błąd bazy danych przez podanie nieprawidłowego ID
      const result = await calculateBreed(testKnex, -1, -1);
      expect(result).toBe('xo'); // domyślna rasa w przypadku błędu
    });
  });

  describe('checkCyclicRelations', () => {
    it('should detect direct self-reference', async () => {
      const result = await checkCyclicRelations(testKnex, 1, 1, null);
      expect(result).toBe(true);

      const result2 = await checkCyclicRelations(testKnex, 1, null, 1);
      expect(result2).toBe(true);
    });

    it('should detect cyclic relations in family tree', async () => {
      // Utwórz rodzinę: Dziadek -> Ojciec -> Syn
      const grandfather = await createTestHorse({ gender: 'ogier' });
      const father = await createTestHorse({ 
        gender: 'ogier',
        sire_id: grandfather.id 
      });
      const son = await createTestHorse({ 
        gender: 'ogier',
        sire_id: father.id 
      });

      // Próbuj ustawić syna jako ojca dziadka (cykl!)
      const hasCycle = await checkCyclicRelations(testKnex, grandfather.id, son.id, null);
      expect(hasCycle).toBe(true);
    });

    it('should allow valid parent relationships', async () => {
      const validParent = await createTestHorse({ gender: 'ogier' });
      const child = await createTestHorse({ gender: 'klacz' });

      const hasCycle = await checkCyclicRelations(testKnex, child.id, validParent.id, null);
      expect(hasCycle).toBe(false);
    });

    it('should handle deep family trees', async () => {
      // Utwórz głębokie drzewo genealogiczne
      let currentHorse = await createTestHorse({ gender: 'ogier' });
      
      for (let i = 0; i < 5; i++) {
        currentHorse = await createTestHorse({
          gender: 'ogier',
          sire_id: currentHorse.id
        });
      }

      // Sprawdź czy nie ma cyklu w normalnej relacji
      const newChild = await createTestHorse({ gender: 'klacz' });
      const hasCycle = await checkCyclicRelations(testKnex, newChild.id, currentHorse.id, null);
      expect(hasCycle).toBe(false);
    });

    it('should handle empty family tree', async () => {
      const orphan = await createTestHorse();
      const parent = await createTestHorse({ gender: 'ogier' });

      const hasCycle = await checkCyclicRelations(testKnex, orphan.id, parent.id, null);
      expect(hasCycle).toBe(false);
    });
  });

  describe('getPedigree', () => {
    it('should return horse with depth 0', async () => {
      const pedigree = await getPedigree(testKnex, horses.sireOO.id, 0);
      
      expect(pedigree).toHaveProperty('id', horses.sireOO.id);
      expect(pedigree).toHaveProperty('name', horses.sireOO.name);
      expect(pedigree).toHaveProperty('breed', 'oo');
      expect(pedigree).not.toHaveProperty('sire');
      expect(pedigree).not.toHaveProperty('dam');
    });

    it('should return horse with parents at depth 1', async () => {
      const offspring = await createTestHorse({
        sire_id: horses.sireOO.id,
        dam_id: horses.damXX.id
      });

      const pedigree = await getPedigree(testKnex, offspring.id, 1);
      
      expect(pedigree).toHaveProperty('id', offspring.id);
      expect(pedigree).toHaveProperty('sire');
      expect(pedigree).toHaveProperty('dam');
      expect(pedigree.sire).toHaveProperty('id', horses.sireOO.id);
      expect(pedigree.dam).toHaveProperty('id', horses.damXX.id);
    });

    it('should return deep pedigree at depth 2', async () => {
      // Utwórz dziadków
      const grandsire = await createTestHorse({ gender: 'ogier' });
      const granddam = await createTestHorse({ gender: 'klacz' });

      // Utwórz rodziców z dziadkami
      const father = await createTestHorse({
        gender: 'ogier',
        sire_id: grandsire.id,
        dam_id: granddam.id
      });

      const mother = await createTestHorse({ gender: 'klacz' });

      // Utwórz potomka
      const child = await createTestHorse({
        sire_id: father.id,
        dam_id: mother.id
      });

      const pedigree = await getPedigree(testKnex, child.id, 2);
      
      expect(pedigree).toHaveProperty('sire');
      expect(pedigree.sire).toHaveProperty('sire');
      expect(pedigree.sire).toHaveProperty('dam');
      expect(pedigree.sire.sire).toHaveProperty('id', grandsire.id);
      expect(pedigree.sire.dam).toHaveProperty('id', granddam.id);
    });

    it('should handle horses without parents', async () => {
      const orphan = await createTestHorse();

      const pedigree = await getPedigree(testKnex, orphan.id, 1);
      
      expect(pedigree).toHaveProperty('id', orphan.id);
      expect(pedigree.sire).toBeNull();
      expect(pedigree.dam).toBeNull();
    });

    it('should prevent infinite loops in cyclic relationships', async () => {
      const horse1 = await createTestHorse({ gender: 'ogier' });
      const horse2 = await createTestHorse({ gender: 'klacz' });

      // Ręcznie utwórz cykl w bazie (to jest błąd danych, ale test sprawdza odporność)
      await testKnex('horses').where('id', horse1.id).update({ sire_id: horse2.id });
      await testKnex('horses').where('id', horse2.id).update({ sire_id: horse1.id });

      const pedigree = await getPedigree(testKnex, horse1.id, 3);
      
      // Funkcja powinna zwrócić null gdy wykryje cykl
      expect(pedigree).toBeNull();
    });

    it('should return null for non-existent horse', async () => {
      const pedigree = await getPedigree(testKnex, 9999, 1);
      expect(pedigree).toBeNull();
    });

    it('should handle negative depth gracefully', async () => {
      const pedigree = await getPedigree(testKnex, horses.sireOO.id, -1);
      expect(pedigree).toBeNull();
    });
  });

  describe('getOffspring', () => {
    it('should return all offspring of a horse', async () => {
      const child1 = await createTestHorse({
        sire_id: horses.sireOO.id,
        dam_id: horses.damXX.id
      });

      const child2 = await createTestHorse({
        sire_id: horses.sireOO.id,
        dam_id: horses.damXO.id
      });

      const offspring = await getOffspring(testKnex, horses.sireOO.id);
      
      expect(offspring).toHaveLength(2);
      const offspringIds = offspring.map(o => o.id);
      expect(offspringIds).toContain(child1.id);
      expect(offspringIds).toContain(child2.id);
    });

    it('should filter offspring by gender', async () => {
      await createTestHorse({
        sire_id: horses.sireOO.id,
        dam_id: horses.damXX.id,
        gender: 'klacz'
      });

      await createTestHorse({
        sire_id: horses.sireOO.id,
        dam_id: horses.damXO.id,
        gender: 'ogier'
      });

      const femaleOffspring = await getOffspring(testKnex, horses.sireOO.id, { gender: 'klacz' });
      expect(femaleOffspring).toHaveLength(1);
      expect(femaleOffspring[0].gender).toBe('klacz');

      const maleOffspring = await getOffspring(testKnex, horses.sireOO.id, { gender: 'ogier' });
      expect(maleOffspring).toHaveLength(1);
      expect(maleOffspring[0].gender).toBe('ogier');
    });

    it('should filter offspring by breeder', async () => {
      const secondBreeder = await createTestBreeder({
        name: 'Second Breeder',
        country_code: 'TC'
      });

      await createTestHorse({
        sire_id: horses.sireOO.id,
        dam_id: horses.damXX.id,
        breeder_id: testBreeder.id
      });

      await createTestHorse({
        sire_id: horses.sireOO.id,
        dam_id: horses.damXO.id,
        breeder_id: secondBreeder.id
      });

      const firstBreederOffspring = await getOffspring(testKnex, horses.sireOO.id, { 
        breeder_id: testBreeder.id 
      });
      expect(firstBreederOffspring).toHaveLength(1);
      expect(firstBreederOffspring[0].breeder_id).toBe(testBreeder.id);
    });

    it('should support pagination', async () => {
      // Utwórz więcej potomstwa
      for (let i = 0; i < 5; i++) {
        await createTestHorse({
          sire_id: horses.sireOO.id,
          dam_id: horses.damXX.id,
          name: `Child ${i}`
        });
      }

      const firstPage = await getOffspring(testKnex, horses.sireOO.id, { 
        limit: 2, 
        offset: 0 
      });
      expect(firstPage).toHaveLength(2);

      const secondPage = await getOffspring(testKnex, horses.sireOO.id, { 
        limit: 2, 
        offset: 2 
      });
      expect(secondPage).toHaveLength(2);

      // Sprawdź czy są różne
      const firstPageIds = firstPage.map(o => o.id);
      const secondPageIds = secondPage.map(o => o.id);
      expect(firstPageIds).not.toEqual(secondPageIds);
    });

    it('should return empty array for horse without offspring', async () => {
      const childless = await createTestHorse();
      const offspring = await getOffspring(testKnex, childless.id);
      expect(offspring).toHaveLength(0);
    });

    it('should include offspring where horse is dam', async () => {
      const child = await createTestHorse({
        sire_id: horses.sireOO.id,
        dam_id: horses.damXX.id
      });

      const offspringAsSire = await getOffspring(testKnex, horses.sireOO.id);
      const offspringAsDam = await getOffspring(testKnex, horses.damXX.id);

      expect(offspringAsSire).toHaveLength(1);
      expect(offspringAsDam).toHaveLength(1);
      expect(offspringAsSire[0].id).toBe(child.id);
      expect(offspringAsDam[0].id).toBe(child.id);
    });

    it('should handle invalid filters gracefully', async () => {
      const offspring1 = await getOffspring(testKnex, horses.sireOO.id, { gender: 'invalid' });
      expect(Array.isArray(offspring1)).toBe(true);

      const offspring2 = await getOffspring(testKnex, horses.sireOO.id, { breeder_id: 'invalid' });
      expect(Array.isArray(offspring2)).toBe(true);
    });

    it('should handle database errors gracefully', async () => {
      const offspring = await getOffspring(testKnex, -1);
      expect(offspring).toEqual([]);
    });
  });

  describe('generatePedigreeHtml', () => {
    it('should generate HTML for horse pedigree', async () => {
      const html = await generatePedigreeHtml(testKnex, horses.sireOO.id, 1);
      
      expect(html).toContain('<!DOCTYPE html>');
      expect(html).toContain('<html');
      expect(html).toContain('</html>');
      expect(html).toContain(horses.sireOO.name);
      expect(html).toContain('Rodowód konia');
    });

    it('should include proper meta tags and styling', async () => {
      const html = await generatePedigreeHtml(testKnex, horses.sireOO.id, 0);
      
      expect(html).toContain('<meta charset="UTF-8">');
      expect(html).toContain('<meta name="viewport"');
      expect(html).toContain('<style>');
      expect(html).toContain('</style>');
    });

    it('should be responsive', async () => {
      const html = await generatePedigreeHtml(testKnex, horses.sireOO.id, 1);
      
      expect(html).toContain('@media (max-width: 768px)');
    });

    it('should include JavaScript for interactivity', async () => {
      const html = await generatePedigreeHtml(testKnex, horses.sireOO.id, 1);
      
      expect(html).toContain('<script>');
      expect(html).toContain('addEventListener');
      expect(html).toContain('</script>');
    });

    it('should handle non-existent horse', async () => {
      const html = await generatePedigreeHtml(testKnex, 9999, 1);
      
      expect(html).toContain('Błąd');
      expect(html).toContain('nie został znaleziony');
    });

    it('should escape HTML in horse names', async () => {
      const dangerousHorse = await createTestHorse({
        name: '<script>alert("XSS")</script>'
      });

      const html = await generatePedigreeHtml(testKnex, dangerousHorse.id, 0);
      
      expect(html).not.toContain('<script>alert("XSS")</script>');
      expect(html).toContain('&lt;script&gt;');
    });

    it('should include depth information in HTML', async () => {
      const html = await generatePedigreeHtml(testKnex, horses.sireOO.id, 2);
      
      expect(html).toContain('Głębokość: 2');
    });

    it('should generate different HTML for different depths', async () => {
      const html0 = await generatePedigreeHtml(testKnex, horses.sireOO.id, 0);
      const html1 = await generatePedigreeHtml(testKnex, horses.sireOO.id, 1);
      
      expect(html0).not.toEqual(html1);
      expect(html0).toContain('Głębokość: 0');
      expect(html1).toContain('Głębokość: 1');
    });

    it('should handle horses with parents in HTML', async () => {
      const child = await createTestHorse({
        sire_id: horses.sireOO.id,
        dam_id: horses.damXX.id
      });

      const html = await generatePedigreeHtml(testKnex, child.id, 1);
      
      expect(html).toContain(child.name);
      expect(html).toContain(horses.sireOO.name);
      expect(html).toContain(horses.damXX.name);
      expect(html).toContain('Ojciec');
      expect(html).toContain('Matka');
    });
  });

  describe('Integration tests', () => {
    it('should handle complete family tree operations', async () => {
      // Utwórz kompleksną strukturę rodzinną
      const grandfather = await createTestHorse({ 
        name: 'Grandfather',
        gender: 'ogier' 
      });
      
      const grandmother = await createTestHorse({ 
        name: 'Grandmother',
        gender: 'klacz' 
      });

      const father = await createTestHorse({
        name: 'Father',
        gender: 'ogier',
        sire_id: grandfather.id,
        dam_id: grandmother.id
      });

      const mother = await createTestHorse({
        name: 'Mother',
        gender: 'klacz'
      });

      const child = await createTestHorse({
        name: 'Child',
        gender: 'klacz',
        sire_id: father.id,
        dam_id: mother.id
      });

      // Test pedigree
      const pedigree = await getPedigree(testKnex, child.id, 2);
      expect(pedigree.sire.sire.name).toBe('Grandfather');
      expect(pedigree.sire.dam.name).toBe('Grandmother');

      // Test offspring
      const grandfatherOffspring = await getOffspring(testKnex, grandfather.id);
      expect(grandfatherOffspring).toHaveLength(1);
      expect(grandfatherOffspring[0].name).toBe('Father');

      const fatherOffspring = await getOffspring(testKnex, father.id);
      expect(fatherOffspring).toHaveLength(1);
      expect(fatherOffspring[0].name).toBe('Child');

      // Test HTML generation
      const html = await generatePedigreeHtml(testKnex, child.id, 2);
      expect(html).toContain('Grandfather');
      expect(html).toContain('Grandmother');
      expect(html).toContain('Father');
      expect(html).toContain('Mother');
      expect(html).toContain('Child');
    });

    it('should handle multiple generations breed calculation', async () => {
      // Utwórz rodzinę z różnymi rasami
      const ooGrandpa = await createTestHorse({ 
        gender: 'ogier',
        breed_id: breeds.oo.id 
      });
      
      const xxGrandma = await createTestHorse({ 
        gender: 'klacz',
        breed_id: breeds.xx.id 
      });

      // oo + xx = xxoo
      const expectedBreed = await calculateBreed(testKnex, ooGrandpa.id, xxGrandma.id);
      expect(expectedBreed).toBe('xxoo');

      const xxooParent = await createTestHorse({
        gender: 'ogier',
        sire_id: ooGrandpa.id,
        dam_id: xxGrandma.id,
        breed_id: breeds.xxoo.id
      });

      const xoMother = await createTestHorse({
        gender: 'klacz',
        breed_id: breeds.xo.id
      });

      // xxoo + xo = xxoo
      const childBreed = await calculateBreed(testKnex, xxooParent.id, xoMother.id);
      expect(childBreed).toBe('xxoo');
    });
  });
});