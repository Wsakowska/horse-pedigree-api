const API_URL = 'http://localhost:3000/api';

function showSection(sectionId) {
  document.querySelectorAll('section').forEach(section => {
    section.classList.toggle('active', section.id === sectionId);
    section.classList.toggle('hidden', section.id !== sectionId);
  });
}

async function fetchData(endpoint) {
  try {
    const response = await fetch(`${API_URL}/${endpoint}`);
    if (!response.ok) throw new Error(`HTTP error ${response.status}`);
    return await response.json();
  } catch (error) {
    console.error('Fetch error:', error);
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
    if (!response.ok) throw new Error(`HTTP error ${response.status}`);
    return await response.json();
  } catch (error) {
    console.error('Post error:', error);
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
    if (!response.ok) throw new Error(`HTTP error ${response.status}`);
    return await response.json();
  } catch (error) {
    console.error('Update error:', error);
    throw error;
  }
}

async function deleteData(endpoint, id) {
  try {
    const response = await fetch(`${API_URL}/${endpoint}/${id}`, { method: 'DELETE' });
    if (!response.ok) throw new Error(`HTTP error ${response.status}`);
  } catch (error) {
    console.error('Delete error:', error);
    throw error;
  }
}

async function loadHorses() {
  try {
    const horses = await fetchData('horses');
    const breeds = await fetchData('breeds');
    const colors = await fetchData('colors');
    const breeders = await fetchData('breeders');

    const horseList = document.getElementById('horse-list');
    horseList.innerHTML = '';

    horses.forEach(horse => {
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

    const sireSelect = document.getElementById('horse-sire-select');
    const damSelect = document.getElementById('horse-dam-select');
    horses.forEach(horse => {
      if (horse.gender === 'ogier') {
        const option = document.createElement('option');
        option.value = horse.id;
        option.textContent = horse.name;
        sireSelect.appendChild(option);
      }
      if (horse.gender === 'klacz') {
        const option = document.createElement('option');
        option.value = horse.id;
        option.textContent = horse.name;
        damSelect.appendChild(option);
      }
    });
  } catch (error) {
    alert('Błąd podczas ładowania opcji: ' + error.message);
  }
}

function handleFormSubmit(formId, endpoint, callback) {
  const form = document.getElementById(formId);
  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const formData = new FormData(form);
    const data = Object.fromEntries(formData);
    try {
      await postData(endpoint, data);
      alert('Dodano pomyślnie!');
      form.reset();
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
      const formData = new FormData(form);
      const data = Object.fromEntries(formData);
      try {
        await updateData('horses', id, data);
        alert('Zaktualizowano pomyślnie!');
        form.reset();
        form.onsubmit = null;
        handleFormSubmit('horse-form', 'horses', loadHorses);
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
  try {
    const response = await fetch(`${API_URL}/horses/${window.currentHorseId}/pedigree/html/${depth}`);
    if (!response.ok) throw new Error(`HTTP error ${response.status}`);
    const html = await response.text();
    document.getElementById('pedigree-tree').innerHTML = html;
  } catch (error) {
    alert('Błąd podczas pobierania rodowodu: ' + error.message);
  }
}

async function showOffspring(horseId) {
  if (!horseId) {
    alert('Błąd: Nie wybrano konia.');
    return;
  }
  showSection('offspring-view');
  window.currentHorseId = horseId;
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
});