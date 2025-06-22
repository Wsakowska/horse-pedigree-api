const knex = require('../config/db');
const Joi = require('joi');
const { calculateBreed, getPedigree, getOffspring, generatePedigreeHtml, checkCyclicRelations } = require('../services/pedigreeService');

// POPRAWIONA walidacja - breed_id jest opcjonalne
const horseSchema = Joi.object({
  name: Joi.string().max(100).required(),
  breed_id: Joi.number().integer().optional().allow(null), // ZMIANA: opcjonalne
  birth_date: Joi.date().optional().allow(null),
  gender: Joi.string().valid('klacz', 'ogier', 'wałach').required(),
  sire_id: Joi.number().integer().optional().allow(null),
  dam_id: Joi.number().integer().optional().allow(null),
  color_id: Joi.number().integer().required(),
  breeder_id: Joi.number().integer().required(),
});

const handleDatabaseError = (error, res) => {
  console.error('Database error:', error);
  
  if (error.code === '23505') { // unique violation
    return res.status(409).json({ error: 'Rekord o tych danych już istnieje' });
  }
  
  if (error.code === '23503') { // foreign key violation
    return res.status(400).json({ error: 'Nie można usunąć - rekord jest używany w innych tabelach' });
  }
  
  if (error.code === '23514') { // check constraint violation
    return res.status(400).json({ error: 'Dane nie spełniają warunków walidacji bazodanowych' });
  }
  
  return res.status(500).json({ error: 'Błąd serwera bazy danych' });
};

exports.getAllHorses = async (req, res) => {
  try {
    const { limit = 100, offset = 0, gender, breed_id } = req.query;
    
    let query = knex('horses');
    
    if (gender && ['klacz', 'ogier', 'wałach'].includes(gender)) {
      query = query.where({ gender });
    }
    
    if (breed_id && !isNaN(breed_id)) {
      query = query.where({ breed_id: parseInt(breed_id) });
    }
    
    const horses = await query
      .limit(parseInt(limit))
      .offset(parseInt(offset))
      .orderBy('name')
      .select('*');
      
    res.json(horses);
  } catch (error) {
    handleDatabaseError(error, res);
  }
};

exports.getHorseById = async (req, res) => {
  try {
    const horse = await knex('horses').where({ id: req.params.id }).first();
    if (!horse) {
      return res.status(404).json({ error: 'Koń nie znaleziony' });
    }
    res.json(horse);
  } catch (error) {
    handleDatabaseError(error, res);
  }
};

exports.createHorse = async (req, res) => {
  const { error } = horseSchema.validate(req.body);
  if (error) return res.status(400).json({ error: error.details[0].message });

  const { sire_id, dam_id, breed_id, name } = req.body;

  try {
    // Sprawdź czy rodzice istnieją i mają odpowiednią płeć
    if (sire_id) {
      const sire = await knex('horses').where({ id: sire_id }).first();
      if (!sire) {
        return res.status(400).json({ error: 'Ojciec o podanym ID nie istnieje' });
      }
      if (sire.gender !== 'ogier') {
        return res.status(400).json({ error: 'Ojciec musi być ogierem (wałach nie może mieć potomstwa)' });
      }
    }
    
    if (dam_id) {
      const dam = await knex('horses').where({ id: dam_id }).first();
      if (!dam) {
        return res.status(400).json({ error: 'Matka o podanym ID nie istnieje' });
      }
      if (dam.gender !== 'klacz') {
        return res.status(400).json({ error: 'Matka musi być klaczą (wałach nie może mieć potomstwa)' });
      }
    }

    // Sprawdź czy ojciec i matka to nie ten sam koń
    if (sire_id && dam_id && sire_id === dam_id) {
      return res.status(400).json({ error: 'Ojciec i matka nie mogą być tym samym koniem' });
    }

    // Sprawdź czy koń o takiej nazwie już istnieje
    const existingHorse = await knex('horses').where({ name }).first();
    if (existingHorse) {
      return res.status(409).json({ error: 'Koń o takiej nazwie już istnieje' });
    }

    // ZMIANA: Automatyczne obliczanie rasy lub użycie domyślnej
    let finalBreedId = breed_id;
    
    if (sire_id && dam_id) {
      // Jeśli są rodzice - oblicz automatycznie
      const calculatedBreed = await calculateBreed(knex, sire_id, dam_id);
      if (calculatedBreed) {
        const breed = await knex('breeds').where({ name: calculatedBreed }).first();
        if (breed) {
          finalBreedId = breed.id;
          console.log(`Automatycznie obliczona rasa: ${calculatedBreed} (ID: ${breed.id})`);
        }
      }
    } else if (!finalBreedId) {
      // Jeśli nie ma rodziców ani wybranej rasy - użyj domyślnej (oo)
      const defaultBreed = await knex('breeds').where({ name: 'oo' }).first();
      if (defaultBreed) {
        finalBreedId = defaultBreed.id;
        console.log(`Użyto domyślnej rasy: oo (ID: ${defaultBreed.id})`);
      }
    }

    // Sprawdź czy finalBreedId jest prawidłowe
    if (!finalBreedId) {
      return res.status(400).json({ error: 'Nie można ustalić rasy konia' });
    }

    const [horse] = await knex('horses')
      .insert({ ...req.body, breed_id: finalBreedId })
      .returning('*');
    
    res.status(201).json(horse);
  } catch (error) {
    handleDatabaseError(error, res);
  }
};

exports.updateHorse = async (req, res) => {
  const { error } = horseSchema.validate(req.body);
  if (error) return res.status(400).json({ error: error.details[0].message });

  const { sire_id, dam_id, name, breed_id } = req.body;
  const horseId = req.params.id;

  try {
    // Sprawdź czy koń istnieje
    const existingHorse = await knex('horses').where({ id: horseId }).first();
    if (!existingHorse) {
      return res.status(404).json({ error: 'Koń nie znaleziony' });
    }

    // Sprawdź czy inna nazwa już istnieje (jeśli zmieniana)
    if (name !== existingHorse.name) {
      const nameExists = await knex('horses')
        .where({ name })
        .whereNot({ id: horseId })
        .first();
      if (nameExists) {
        return res.status(409).json({ error: 'Koń o takiej nazwie już istnieje' });
      }
    }

    // Sprawdź czy rodzice istnieją i mają odpowiednią płeć
    if (sire_id) {
      if (sire_id == horseId) {
        return res.status(400).json({ error: 'Koń nie może być swoim własnym ojcem' });
      }
      const sire = await knex('horses').where({ id: sire_id }).first();
      if (!sire) {
        return res.status(400).json({ error: 'Ojciec o podanym ID nie istnieje' });
      }
      if (sire.gender !== 'ogier') {
        return res.status(400).json({ error: 'Ojciec musi być ogierem' });
      }
    }
    
    if (dam_id) {
      if (dam_id == horseId) {
        return res.status(400).json({ error: 'Koń nie może być swoją własną matką' });
      }
      const dam = await knex('horses').where({ id: dam_id }).first();
      if (!dam) {
        return res.status(400).json({ error: 'Matka o podanym ID nie istnieje' });
      }
      if (dam.gender !== 'klacz') {
        return res.status(400).json({ error: 'Matka musi być klaczą' });
      }
    }

    // Sprawdź czy ojciec i matka to nie ten sam koń
    if (sire_id && dam_id && sire_id === dam_id) {
      return res.status(400).json({ error: 'Ojciec i matka nie mogą być tym samym koniem' });
    }

    // Sprawdź cykliczne relacje
    const hasCycle = await checkCyclicRelations(knex, horseId, sire_id, dam_id);
    if (hasCycle) {
      return res.status(400).json({ 
        error: 'Nie można utworzyć tej relacji - koń byłby swoim własnym przodkiem (cykliczna relacja rodzinna)' 
      });
    }

    // ZMIANA: Oblicz nową rasę jeśli są rodzice, w przeciwnym razie zachowaj wybraną
    let updateData = { ...req.body };
    if (sire_id && dam_id) {
      const calculatedBreed = await calculateBreed(knex, sire_id, dam_id);
      if (calculatedBreed) {
        const breed = await knex('breeds').where({ name: calculatedBreed }).first();
        if (breed) {
          updateData.breed_id = breed.id;
          console.log(`Automatycznie obliczona nowa rasa: ${calculatedBreed} (ID: ${breed.id})`);
        }
      }
    }

    const [horse] = await knex('horses')
      .where({ id: horseId })
      .update(updateData)
      .returning('*');
    
    if (!horse) return res.status(404).json({ error: 'Koń nie znaleziony' });
    res.json(horse);
  } catch (error) {
    handleDatabaseError(error, res);
  }
};

exports.deleteHorse = async (req, res) => {
  try {
    const horseId = req.params.id;
    
    // Sprawdź czy koń ma potomstwo
    const offspring = await knex('horses')
      .where({ sire_id: horseId })
      .orWhere({ dam_id: horseId })
      .select('id', 'name')
      .limit(1);
    
    if (offspring.length > 0) {
      return res.status(400).json({ 
        error: 'Nie można usunąć konia który ma potomstwo. Najpierw usuń lub zmień rodziców potomstwa.' 
      });
    }
    
    const deleted = await knex('horses').where({ id: horseId }).del();
    if (!deleted) return res.status(404).json({ error: 'Koń nie znaleziony' });
    res.status(204).send();
  } catch (error) {
    handleDatabaseError(error, res);
  }
};

exports.getPedigree = async (req, res) => {
  const { id, depth } = req.params;
  
  if (!id || isNaN(id) || !depth || isNaN(depth)) {
    return res.status(400).json({ error: 'Nieprawidłowe ID konia lub głębokość' });
  }
  
  const depthNum = parseInt(depth);
  if (depthNum < 0 || depthNum > 10) {
    return res.status(400).json({ error: 'Głębokość musi być między 0 a 10' });
  }
  
  try {
    const pedigree = await getPedigree(knex, parseInt(id), depthNum);
    if (!pedigree) return res.status(404).json({ error: 'Koń nie znaleziony lub wystąpił cykl w rodowodzie' });
    res.json(pedigree);
  } catch (error) {
    handleDatabaseError(error, res);
  }
};

exports.getOffspring = async (req, res) => {
  const { id } = req.params;
  const { gender, breeder_id, limit = 50, offset = 0 } = req.query;
  
  if (!id || isNaN(id)) {
    return res.status(400).json({ error: 'Nieprawidłowe ID konia' });
  }
  
  // Walidacja parametrów filtrowania
  if (gender && !['klacz', 'ogier', 'wałach'].includes(gender)) {
    return res.status(400).json({ error: 'Nieprawidłowa płeć. Dozwolone: klacz, ogier, wałach' });
  }
  
  if (breeder_id && isNaN(breeder_id)) {
    return res.status(400).json({ error: 'Nieprawidłowe ID hodowcy' });
  }

  if (limit && (isNaN(limit) || limit > 200)) {
    return res.status(400).json({ error: 'Limit musi być liczbą nie większą niż 200' });
  }

  if (offset && isNaN(offset)) {
    return res.status(400).json({ error: 'Offset musi być liczbą' });
  }
  
  try {
    // Sprawdź czy koń istnieje
    const horse = await knex('horses').where({ id: parseInt(id) }).first();
    if (!horse) {
      return res.status(404).json({ error: 'Koń nie znaleziony' });
    }

    const offspring = await getOffspring(knex, parseInt(id), { 
      gender, 
      breeder_id, 
      limit: parseInt(limit), 
      offset: parseInt(offset) 
    });
    
    // Dodaj informacje o łącznej liczbie potomstwa
    const totalQuery = knex('horses')
      .where(function() {
        this.where({ sire_id: parseInt(id) }).orWhere({ dam_id: parseInt(id) });
      });
    
    if (gender) totalQuery.andWhere({ gender });
    if (breeder_id) totalQuery.andWhere({ breeder_id: parseInt(breeder_id) });
    
    const totalCount = await totalQuery.count('* as count').first();
    
    res.json({
      offspring,
      pagination: {
        total: parseInt(totalCount.count),
        limit: parseInt(limit),
        offset: parseInt(offset),
        hasMore: parseInt(offset) + offspring.length < parseInt(totalCount.count)
      }
    });
  } catch (error) {
    handleDatabaseError(error, res);
  }
};

exports.getPedigreeHtml = async (req, res) => {
  const { id, depth } = req.params;
  
  if (!id || isNaN(id) || !depth || isNaN(depth)) {
    return res.status(400).json({ error: 'Nieprawidłowe ID konia lub głębokość' });
  }
  
  const depthNum = parseInt(depth);
  if (depthNum < 0 || depthNum > 5) {
    return res.status(400).json({ error: 'Głębokość musi być między 0 a 5 dla wizualizacji HTML' });
  }
  
  try {
    // Sprawdź czy koń istnieje
    const horse = await knex('horses').where({ id: parseInt(id) }).first();
    if (!horse) {
      return res.status(404).json({ error: 'Koń nie znaleziony' });
    }

    const html = await generatePedigreeHtml(knex, parseInt(id), depthNum);
    res.set('Content-Type', 'text/html; charset=utf-8');
    res.send(html);
  } catch (error) {
    console.error('Błąd podczas generowania HTML:', error);
    res.status(500).send(`
      <!DOCTYPE html>
      <html>
        <head><title>Błąd</title></head>
        <body>
          <h2>Błąd podczas generowania rodowodu</h2>
          <p>Przepraszamy, wystąpił błąd serwera.</p>
        </body>
      </html>
    `);
  }
};

// Sprawdzanie możliwości krzyżowania
exports.checkBreeding = async (req, res) => {
  const { sire_id, dam_id } = req.query;
  
  if (!sire_id || !dam_id || isNaN(sire_id) || isNaN(dam_id)) {
    return res.status(400).json({ error: 'Wymagane są poprawne ID ojca i matki' });
  }

  if (sire_id === dam_id) {
    return res.status(400).json({ error: 'Ojciec i matka nie mogą być tym samym koniem' });
  }

  try {
    // Sprawdź czy konie istnieją i mają odpowiednie płcie
    const sire = await knex('horses').where({ id: sire_id }).first();
    const dam = await knex('horses').where({ id: dam_id }).first();

    if (!sire || !dam) {
      return res.status(404).json({ error: 'Jeden lub oba konie nie zostali znalezieni' });
    }

    if (sire.gender !== 'ogier') {
      return res.status(400).json({ error: 'Ojciec musi być ogierem (wałach nie może mieć potomstwa)' });
    }

    if (dam.gender !== 'klacz') {
      return res.status(400).json({ error: 'Matka musi być klaczą (wałach nie może mieć potomstwa)' });
    }

    // NOWE: Sprawdź niedozwolone relacje rodzic-dziecko
    let breedingProblems = [];
    
    // Sprawdź czy ojciec jest synem matki (matka + syn)
    if (sire.dam_id && parseInt(sire.dam_id) === parseInt(dam_id)) {
      breedingProblems.push('Matka nie może mieć potomstwa ze swoim synem');
    }
    
    // Sprawdź czy matka jest córką ojca (ojciec + córka)
    if (dam.sire_id && parseInt(dam.sire_id) === parseInt(sire_id)) {
      breedingProblems.push('Ojciec nie może mieć potomstwa ze swoją córką');
    }
    
    // Jeśli są poważne problemy, zwróć błąd
    if (breedingProblems.length > 0) {
      return res.status(400).json({
        breeding_possible: false,
        error: 'Niedozwolone krzyżowanie',
        problems: breedingProblems,
        sire: { id: sire.id, name: sire.name },
        dam: { id: dam.id, name: dam.name }
      });
    }

    // Sprawdź czy są rodzeństwem
    let isInbreeding = false;
    let inbreedingType = '';
    
    if ((sire.sire_id && dam.sire_id && parseInt(sire.sire_id) === parseInt(dam.sire_id)) ||
        (sire.dam_id && dam.dam_id && parseInt(sire.dam_id) === parseInt(dam.dam_id))) {
      isInbreeding = true;
      inbreedingType = 'rodzeństwo (ten sam ojciec lub matka)';
    }

    // Oblicz potencjalną rasę potomstwa
    const predictedBreed = await calculateBreed(knex, sire_id, dam_id);
    
    // Sprawdź stopień pokrewieństwa w szerszym rodowodzie (3 generacje)
    const siresPedigree = await getPedigree(knex, parseInt(sire_id), 3);
    const damsPedigree = await getPedigree(knex, parseInt(dam_id), 3);
    
    const getAncestorIds = (horse, depth, ids = new Set()) => {
      if (!horse || depth <= 0) return ids;
      if (horse.sire) {
        ids.add(horse.sire.id);
        getAncestorIds(horse.sire, depth - 1, ids);
      }
      if (horse.dam) {
        ids.add(horse.dam.id);
        getAncestorIds(horse.dam, depth - 1, ids);
      }
      return ids;
    };

    const sireAncestors = getAncestorIds(siresPedigree, 3);
    const damAncestors = getAncestorIds(damsPedigree, 3);
    
    // Znajdź wspólnych przodków
    const commonAncestors = [...sireAncestors].filter(id => damAncestors.has(id));

    // Stwórz rekomendację
    let recommendation = '';
    let riskLevel = 'low';
    
    if (isInbreeding) {
      recommendation = `⚠️ WYSOKIE RYZYKO: Krzyżowanie ${inbreedingType}. Może prowadzić do problemów genetycznych.`;
      riskLevel = 'high';
    } else if (commonAncestors.length > 0) {
      recommendation = `⚠️ ŚREDNIE RYZYKO: Wykryto wspólnych przodków. Umiarkowane pokrewieństwo.`;
      riskLevel = 'medium';
    } else {
      recommendation = `✅ NISKIE RYZYKO: Brak bliskiego pokrewieństwa. Krzyżowanie zalecane.`;
      riskLevel = 'low';
    }

    res.json({
      breeding_possible: true,
      predicted_breed: predictedBreed,
      risk_level: riskLevel,
      inbreeding_detected: isInbreeding || commonAncestors.length > 0,
      inbreeding_type: inbreedingType || (commonAncestors.length > 0 ? 'dalsza rodzina' : 'brak'),
      common_ancestors: commonAncestors,
      recommendation,
      sire: { id: sire.id, name: sire.name, breed: sire.breed_id },
      dam: { id: dam.id, name: dam.name, breed: dam.breed_id }
    });
  } catch (error) {
    handleDatabaseError(error, res);
  }
};