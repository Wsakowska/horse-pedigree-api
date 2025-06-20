const API_URL = 'http://localhost:3000/api';

function showSection(sectionId) {
  document.querySelectorAll('section').forEach(section => {
    section.classList.toggle('active', section.id === sectionId);
    section.classList.toggle('hidden', section.id !== sectionId);
  });
}

function resetForm(formId) {
  const form = document.getElementById(formId);
  form.reset();
  form.querySelectorAll('.error-message').forEach(span => span.textContent = '');
  if (formId === 'horse-form') {
    form.onsubmit = null;
    handleFormSubmit('horse-form', 'horses', loadHorses);
  }
}

async function fetchData(endpoint) {
  if (!endpoint) throw new Error('Endpoint nie może być pusty');
  try {
    const response = await fetch(`${API_URL}/${endpoint}`);
    if (!response.ok) throw new Error(`Błąd HTTP ${response.status}`);
    return await response.json();
  } catch (error) {
    console.error('Błąd fetch:', error);
    throw error;
  }
}

async function postData(endpoint, data) {
  try {
    const response = await fetch(`${API_URL}/${endpoint}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || `Błąd HTTP ${response.status}`);
    }
    return await response.json();
  } catch (error) {
    console.error('Błąd post:', error);
    throw error;
  }
}

async function updateData(endpoint, id, data) {
  try {
    const response = await fetch(`${API_URL}/${endpoint}/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || `Błąd HTTP ${response.status}`);
    }
    return await response.json();
  } catch (error) {
    console.error('Błąd update:', error);
    throw error;
  }
}

async function deleteData(endpoint, id) {
  try {
    const response = await fetch(`${API_URL}/${endpoint}/${id}`, { method: 'DELETE' });
    if (!response.ok) throw new Error(`Błąd HTTP ${response.status}`);
  } catch (error) {
    console.error('Błąd delete:', error);
    throw error;
  }
}

async function loadHorses(searchQuery = '', sortOption = 'name-asc') {
  try {
    const horses = await fetchData('horses');
    const breeds = await fetchData('breeds');
    const colors = await fetchData('colors');
    const breeders = await fetchData('breeders');

    let filteredHorses = horses.filter(horse =>
      horse.name.toLowerCase().includes(searchQuery.toLowerCase())
    );

    if (sortOption === 'name-asc') {
      filteredHorses.sort((a, b) => a.name.localeCompare(b.name));
    } else if (sortOption === 'name-desc') {
      filteredHorses.sort((a, b) => b.name.localeCompare(a.name));
    } else if (sortOption === 'birth_date-asc') {
      filteredHorses.sort((a, b) => (a.birth_date || '').localeCompare(b.birth_date || ''));
    } else if (sortOption === 'birth_date-desc') {
      filteredHorses.sort((a, b) => (b.birth_date || '').localeCompare(a.birth_date || ''));
    }

    const horseList = document.getElementById('horse-list');
    horseList.innerHTML = '';

    filteredHorses.forEach(horse => {
      const breed = breeds.find(b => b.id === horse.breed_id)?.name || 'Brak';
      const color = colors.find(c => c.id === horse.color_id)?.name || 'Brak';
      const breeder = breeders.find(b => b.id === horse.breeder_id)?.name || 'Brak';

      const card = document.createElement('div');
      card.className = 'horse-card';
      card.innerHTML = `
        <h3>${horse.name}</h3>
        <p>Rasa: ${breed}</p>
        <p>Płeć: ${horse.gender}</p>
        <p>Maść: ${color}</p>
        <p>Hodowca: ${breeder}</p>
        <button onclick="showPedigree(${horse.id})">Pokaż Rodowód</button>
        <button onclick="showOffspring(${horse.id})">Pokaż Potomstwo</button>
        <button onclick="editHorse(${horse.id})">Edytuj</button>
        <button onclick="deleteHorse(${horse.id})">Usuń</button>
      `;
      horseList.appendChild(card);
    });
  } catch (error) {
    alert('Błąd podczas ładowania koni: ' + error.message);
  }
}

async function loadSelectOptions() {
  try {
    const countries = await fetchData('countries');
    const breeds = await fetchData('breeds');
    const colors = await fetchData('colors');
    const breeders = await fetchData('breeders');
    const horses = await fetchData('horses');

    const breederCountrySelect = document.getElementById('breeder-country-select');
    countries.forEach(country => {
      const option = document.createElement('option');
      option.value = country.code;
      option.textContent = country.name;
      breederCountrySelect.appendChild(option);
    });

    const horseBreedSelect = document.getElementById('horse-breed-select');
    breeds.forEach(breed => {
      const option = document.createElement('option');
      option.value = breed.id;
      option.textContent = breed.name;
      horseBreedSelect.appendChild(option);
    });

    const horseColorSelect = document.getElementById('horse-color-select');
    colors.forEach(color => {
      const option = document.createElement('option');
      option.value = color.id;
      option.textContent = color.name;
      horseColorSelect.appendChild(option);
    });

    const horseBreederSelect = document.getElementById('horse-breeder-select');
    breeders.forEach(breeder => {
      const option = document.createElement('option');
      option.value = breeder.id;
      option.textContent = breeder.name;
      horseBreederSelect.appendChild(option);
    });

    const offspringBreederSelect = document.getElementById('offspring-breeder');
    breeders.forEach(breeder => {
      const option = document.createElement('option');
      option.value = breeder.id;
      option.textContent = breeder.name;
      offspringBreederSelect.appendChild(option);
    });

    window.allHorses = horses; // Store for filtering
    updateHorseSelects(horses);
  } catch (error) {
    alert('Błąd podczas ładowania opcji: ' + error.message);
  }
}

function updateHorseSelects(horses, sireFilter = '', damFilter = '') {
  const sireSelect = document.getElementById('horse-sire-select');
  const damSelect = document.getElementById('horse-dam-select');
  sireSelect.innerHTML = '<option value="">Brak</option>';
  damSelect.innerHTML = '<option value="">Brak</option>';

  horses.forEach(horse => {
    if (horse.gender === 'ogier' && (!sireFilter || horse.name.toLowerCase().includes(sireFilter.toLowerCase()))) {
      const option = document.createElement('option');
      option.value = horse.id;
      option.textContent = horse.name;
      sireSelect.appendChild(option);
    }
    if (horse.gender === 'klacz' && (!damFilter || horse.name.toLowerCase().includes(damFilter.toLowerCase()))) {
      const option = document.createElement('option');
      option.value = horse.id;
      option.textContent = horse.name;
      damSelect.appendChild(option);
    }
  });
}

function filterHorses(type) {
  const searchInput = document.getElementById(`${type}-search`).value;
  updateHorseSelects(window.allHorses, type === 'sire' ? searchInput : '', type === 'dam' ? searchInput : '');
}

function validateForm(formId) {
  const form = document.getElementById(formId);
  const inputs = form.querySelectorAll('input[required], select[required]');
  let isValid = true;

  inputs.forEach(input => {
    const errorSpan = input.parentElement.querySelector('.error-message');
    if (!input.value || (input.pattern && !new RegExp(input.pattern).test(input.value))) {
      errorSpan.textContent = 'To pole jest wymagane lub zawiera nieprawidłowe dane.';
      isValid = false;
    } else {
      errorSpan.textContent = '';
    }
  });

  return isValid;
}

function handleFormSubmit(formId, endpoint, callback) {
  const form = document.getElementById(formId);
  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    if (!validateForm(formId)) return;

    const formData = new FormData(form);
    const data = Object.fromEntries(formData);
    try {
      await postData(endpoint, data);
      alert('Dodano pomyślnie!');
      resetForm(formId);
      callback();
    } catch (error) {
      alert('Błąd podczas dodawania: ' + error.message);
    }
  });
}

async function editHorse(id) {
  try {
    const horse = await fetchData(`horses/${id}`);
    showSection('add-horse');
    const form = document.getElementById('horse-form');
    form.name.value = horse.name;
    form.breed_id.value = horse.breed_id;
    form.birth_date.value = horse.birth_date ? horse.birth_date.split('T')[0] : '';
    form.gender.value = horse.gender;
    form.sire_id.value = horse.sire_id || '';
    form.dam_id.value = horse.dam_id || '';
    form.color_id.value = horse.color_id;
    form.breeder_id.value = horse.breeder_id;

    form.onsubmit = async (e) => {
      e.preventDefault();
      if (!validateForm('horse-form')) return;
      const formData = new FormData(form);
      const data = Object.fromEntries(formData);
      try {
        await updateData('horses', id, data);
        alert('Zaktualizowano pomyślnie!');
        resetForm('horse-form');
        showSection('dashboard');
        loadHorses();
      } catch (error) {
        alert('Błąd podczas edycji: ' + error.message);
      }
    };
  } catch (error) {
    alert('Błąd podczas ładowania danych konia: ' + error.message);
  }
}

async function deleteHorse(id) {
  if (confirm('Czy na pewno chcesz usunąć tego konia?')) {
    try {
      await deleteData('horses', id);
      alert('Usunięto pomyślnie!');
      loadHorses();
    } catch (error) {
      alert('Błąd podczas usuwania: ' + error.message);
    }
  }
}

async function showPedigree(horseId) {
  if (!horseId) {
    alert('Błąd: Nie wybrano konia.');
    return;
  }
  showSection('pedigree-view');
  window.currentHorseId = horseId;
}

async function fetchPedigreeHtml() {
  if (!window.currentHorseId) {
    alert('Błąd: Nie wybrano konia.');
    return;
  }
  const depth = document.getElementById('pedigree-depth').value;
  if (depth < 1 || depth > 5) {
    alert('Głębokość musi być między 1 a 5.');
    return;
  }
  try {
    const response = await fetch(`${API_URL}/horses/${window.currentHorseId}/pedigree/html/${depth}`);
    if (!response.ok) throw new Error(`Błąd HTTP ${response.status}`);
    const html = await response.text();
    const treeContainer = document.getElementById('pedigree-tree');
    treeContainer.innerHTML = html;
    treeContainer.querySelectorAll('.node').forEach(node => {
      node.addEventListener('click', () => {
        const horseId = node.dataset.horseId || window.currentHorseId;
        showHorseDetails(horseId);
      });
    });
  } catch (error) {
    alert('Błąd podczas pobierania rodowodu: ' + error.message);
  }
}

async function showHorseDetails(horseId) {
  try {
    const horse = await fetchData(`horses/${horseId}`);
    const breeds = await fetchData('breeds');
    const colors = await fetchData('colors');
    const breeders = await fetchData('breeders');
    const breed = breeds.find(b => b.id === horse.breed_id)?.name || 'Brak';
    const color = colors.find(c => c.id === horse.color_id)?.name || 'Brak';
    const breeder = breeders.find(b => b.id === horse.breeder_id)?.name || 'Brak';

    alert(`Szczegóły konia:\nImię: ${horse.name}\nRasa: ${breed}\nPłeć: ${horse.gender}\nMaść: ${color}\nHodowca: ${breeder}`);
  } catch (error) {
    alert('Błąd podczas ładowania szczegółów konia: ' + error.message);
  }
}

async function showOffspring(horseId) {
  if (!horseId) {
    alert('Błąd: Nie wybrano konia.');
    return;
  }
  showSection('offspring-view');
  window.currentHorseId = horseId;
  fetchOffspring();
}

async function fetchOffspring() {
  if (!window.currentHorseId) {
    alert('Błąd: Nie wybrano konia.');
    return;
  }
  const gender = document.getElementById('offspring-gender').value;
  const breederId = document.getElementById('offspring-breeder').value;
  let url = `${API_URL}/horses/${window.currentHorseId}/offspring`;
  const params = new URLSearchParams();
  if (gender) params.append('gender', gender);
  if (breederId) params.append('breeder_id', breederId);
  if (params.toString()) url += `?${params.toString()}`;

  try {
    const offspring = await fetchData(url.slice(url.indexOf('horses')));
    const offspringList = document.getElementById('offspring-list');
    offspringList.innerHTML = '';

    offspring.forEach(horse => {
      const card = document.createElement('div');
      card.className = 'horse-card';
      card.innerHTML = `<h3>${horse.name}</h3><p>Płeć: ${horse.gender}</p>`;
      offspringList.appendChild(card);
    });
  } catch (error) {
    alert('Błąd podczas pobierania potomstwa: ' + error.message);
  }
}

// Initialize
document.addEventListener('DOMContentLoaded', () => {
  loadHorses();
  loadSelectOptions();

  handleFormSubmit('country-form', 'countries', loadSelectOptions);
  handleFormSubmit('breeder-form', 'breeders', loadSelectOptions);
  handleFormSubmit('horse-form', 'horses', loadHorses);
  handleFormSubmit('color-form', 'colors', loadSelectOptions);
  handleFormSubmit('breed-form', 'breeds', loadSelectOptions);

  document.getElementById('search-horses').addEventListener('input', (e) => {
    const sortOption = document.getElementById('sort-horses').value;
    loadHorses(e.target.value, sortOption);
  });

  document.getElementById('sort-horses').addEventListener('change', (e) => {
    const searchQuery = document.getElementById('search-horses').value;
    loadHorses(searchQuery, e.target.value);
  });
});