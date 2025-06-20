const API_URL = 'http://localhost:3000/api';

// Sprawdź czy DOM jest gotowy
document.addEventListener('DOMContentLoaded', function() {
  console.log('DOM loaded, initializing application...');
  initializeApp();
});

// Główna funkcja inicjalizacji
function initializeApp() {
  try {
    // Załaduj dane startowe
    loadHorses();
    loadSelectOptions();

    // Skonfiguruj event listeners dla formularzy
    setupFormHandlers();
    
    // Skonfiguruj event listeners dla wyszukiwania i sortowania
    setupSearchAndSort();
    
    console.log('Application initialized successfully');
  } catch (error) {
    console.error('Error initializing application:', error);
    alert('Błąd podczas inicjalizacji aplikacji. Sprawdź konsolę przeglądarki.');
  }
}

// Funkcja konfigurująca obsługę formularzy
function setupFormHandlers() {
  const forms = [
    { id: 'country-form', endpoint: 'countries', callback: loadSelectOptions },
    { id: 'breeder-form', endpoint: 'breeders', callback: loadSelectOptions },
    { id: 'horse-form', endpoint: 'horses', callback: loadHorses },
    { id: 'color-form', endpoint: 'colors', callback: loadSelectOptions },
    { id: 'breed-form', endpoint: 'breeds', callback: loadSelectOptions }
  ];

  forms.forEach(({ id, endpoint, callback }) => {
    const form = document.getElementById(id);
    if (form) {
      handleFormSubmit(id, endpoint, callback);
    } else {
      console.warn(`Form ${id} not found`);
    }
  });
}

// Funkcja konfigurująca wyszukiwanie i sortowanie
function setupSearchAndSort() {
  const searchInput = document.getElementById('search-horses');
  const sortSelect = document.getElementById('sort-horses');
  
  if (searchInput) {
    searchInput.addEventListener('input', (e) => {
      const sortOption = sortSelect ? sortSelect.value : 'name-asc';
      loadHorses(e.target.value, sortOption);
    });
  }
  
  if (sortSelect) {
    sortSelect.addEventListener('change', (e) => {
      const searchQuery = searchInput ? searchInput.value : '';
      loadHorses(searchQuery, e.target.value);
    });
  }
}

function showSection(sectionId) {
  console.log(`Switching to section: ${sectionId}`);
  
  // Ukryj wszystkie sekcje
  const sections = document.querySelectorAll('main section');
  sections.forEach(section => {
    section.classList.remove('active');
    section.classList.add('hidden');
  });
  
  // Pokaż wybraną sekcję
  const targetSection = document.getElementById(sectionId);
  if (targetSection) {
    targetSection.classList.remove('hidden');
    targetSection.classList.add('active');
    console.log(`Section ${sectionId} is now active`);
  } else {
    console.error(`Section ${sectionId} not found`);
  }
}

function resetForm(formId) {
  const form = document.getElementById(formId);
  if (!form) {
    console.error(`Form ${formId} not found`);
    return;
  }
  
  form.reset();
  form.querySelectorAll('.error-message').forEach(span => span.textContent = '');
  form.querySelectorAll('.error').forEach(input => input.classList.remove('error'));
  
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

function validateForm(formId) {
  const form = document.getElementById(formId);
  if (!form) {
    console.error(`Form ${formId} not found`);
    return false;
  }
  
  const inputs = form.querySelectorAll('input[required], select[required]');
  let isValid = true;

  inputs.forEach(input => {
    const errorSpan = input.parentElement.querySelector('.error-message');
    let inputValid = true;
    let errorMessage = '';

    // Sprawdź czy pole jest wypełnione
    if (!input.value.trim()) {
      inputValid = false;
      errorMessage = 'To pole jest wymagane.';
    }
    // Sprawdź pattern jeśli istnieje
    else if (input.pattern && !new RegExp(input.pattern).test(input.value)) {
      inputValid = false;
      errorMessage = 'Nieprawidłowy format danych.';
    }
    // Sprawdź długość
    else if (input.maxLength && input.value.length > input.maxLength) {
      inputValid = false;
      errorMessage = `Maksymalna długość: ${input.maxLength} znaków.`;
    }

    if (errorSpan) {
      errorSpan.textContent = errorMessage;
    }

    if (!inputValid) {
      isValid = false;
      input.classList.add('error');
    } else {
      input.classList.remove('error');
    }
  });

  return isValid;
}

function handleFormSubmit(formId, endpoint, callback) {
  const form = document.getElementById(formId);
  if (!form) {
    console.error(`Form ${formId} not found`);
    return;
  }
  
  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    console.log(`Submitting form: ${formId}`);
    
    if (!validateForm(formId)) {
      console.log('Form validation failed');
      return;
    }

    const formData = new FormData(form);
    const data = Object.fromEntries(formData);
    
    // Konwertuj puste stringi na null dla opcjonalnych pól
    Object.keys(data).forEach(key => {
      if (data[key] === '') {
        data[key] = null;
      }
    });
    
    try {
      console.log('Sending data:', data);
      await postData(endpoint, data);
      alert('Dodano pomyślnie!');
      resetForm(formId);
      callback();
    } catch (error) {
      console.error('Form submission error:', error);
      alert('Błąd podczas dodawania: ' + error.message);
    }
  });
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
    if (!horseList) {
      console.error('horse-list element not found');
      return;
    }
    
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
        <div class="horse-actions">
          <button onclick="showPedigree(${horse.id})">Pokaż Rodowód</button>
          <button onclick="showOffspring(${horse.id})">Pokaż Potomstwo</button>
          <button onclick="editHorse(${horse.id})">Edytuj</button>
          <button onclick="deleteHorse(${horse.id})" class="delete-btn">Usuń</button>
        </div>
      `;
      horseList.appendChild(card);
    });
  } catch (error) {
    console.error('Error loading horses:', error);
    alert('Błąd podczas ładowania koni: ' + error.message);
  }
}

async function loadSelectOptions() {
  try {
    const [countries, breeds, colors, breeders, horses] = await Promise.all([
      fetchData('countries'),
      fetchData('breeds'),
      fetchData('colors'),
      fetchData('breeders'),
      fetchData('horses')
    ]);

    // Załaduj opcje dla krajów
    const breederCountrySelect = document.getElementById('breeder-country-select');
    if (breederCountrySelect) {
      breederCountrySelect.innerHTML = '<option value="">Wybierz kraj</option>';
      countries.forEach(country => {
        const option = document.createElement('option');
        option.value = country.code;
        option.textContent = country.name;
        breederCountrySelect.appendChild(option);
      });
    }

    // Załaduj opcje dla ras
    const horseBreedSelect = document.getElementById('horse-breed-select');
    if (horseBreedSelect) {
      horseBreedSelect.innerHTML = '<option value="">Wybierz rasę</option>';
      breeds.forEach(breed => {
        const option = document.createElement('option');
        option.value = breed.id;
        option.textContent = breed.name;
        horseBreedSelect.appendChild(option);
      });
    }

    // Załaduj opcje dla maści
    const horseColorSelect = document.getElementById('horse-color-select');
    if (horseColorSelect) {
      horseColorSelect.innerHTML = '<option value="">Wybierz maść</option>';
      colors.forEach(color => {
        const option = document.createElement('option');
        option.value = color.id;
        option.textContent = color.name;
        horseColorSelect.appendChild(option);
      });
    }

    // Załaduj opcje dla hodowców
    const horseBreederSelect = document.getElementById('horse-breeder-select');
    if (horseBreederSelect) {
      horseBreederSelect.innerHTML = '<option value="">Wybierz hodowcę</option>';
      breeders.forEach(breeder => {
        const option = document.createElement('option');
        option.value = breeder.id;
        option.textContent = breeder.name;
        horseBreederSelect.appendChild(option);
      });
    }

    const offspringBreederSelect = document.getElementById('offspring-breeder');
    if (offspringBreederSelect) {
      offspringBreederSelect.innerHTML = '<option value="">Wszyscy</option>';
      breeders.forEach(breeder => {
        const option = document.createElement('option');
        option.value = breeder.id;
        option.textContent = breeder.name;
        offspringBreederSelect.appendChild(option);
      });
    }

    window.allHorses = horses; // Store for filtering
    updateHorseSelects(horses);
  } catch (error) {
    console.error('Error loading select options:', error);
    alert('Błąd podczas ładowania opcji: ' + error.message);
  }
}

function updateHorseSelects(horses, sireFilter = '', damFilter = '') {
  const sireSelect = document.getElementById('horse-sire-select');
  const damSelect = document.getElementById('horse-dam-select');
  
  if (sireSelect) {
    sireSelect.innerHTML = '<option value="">Brak</option>';
    horses.forEach(horse => {
      if (horse.gender === 'ogier' && (!sireFilter || horse.name.toLowerCase().includes(sireFilter.toLowerCase()))) {
        const option = document.createElement('option');
        option.value = horse.id;
        option.textContent = horse.name;
        sireSelect.appendChild(option);
      }
    });
  }
  
  if (damSelect) {
    damSelect.innerHTML = '<option value="">Brak</option>';
    horses.forEach(horse => {
      if (horse.gender === 'klacz' && (!damFilter || horse.name.toLowerCase().includes(damFilter.toLowerCase()))) {
        const option = document.createElement('option');
        option.value = horse.id;
        option.textContent = horse.name;
        damSelect.appendChild(option);
      }
    });
  }
}

function filterHorses(type) {
  const searchInput = document.getElementById(`${type}-search`);
  if (searchInput && window.allHorses) {
    const searchValue = searchInput.value;
    updateHorseSelects(window.allHorses, type === 'sire' ? searchValue : '', type === 'dam' ? searchValue : '');
  }
}

async function editHorse(id) {
  try {
    const horse = await fetchData(`horses/${id}`);
    showSection('add-horse');
    const form = document.getElementById('horse-form');
    if (!form) {
      alert('Formularz nie został znaleziony');
      return;
    }
    
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
    if (treeContainer) {
      treeContainer.innerHTML = html;
      treeContainer.querySelectorAll('.node').forEach(node => {
        node.addEventListener('click', () => {
          const horseId = node.dataset.horseId || window.currentHorseId;
          showHorseDetails(horseId);
        });
      });
    }
  } catch (error) {
    alert('Błąd podczas pobierania rodowodu: ' + error.message);
  }
}

async function showHorseDetails(horseId) {
  try {
    const [horse, breeds, colors, breeders] = await Promise.all([
      fetchData(`horses/${horseId}`),
      fetchData('breeds'),
      fetchData('colors'),
      fetchData('breeders')
    ]);
    
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
  let url = `horses/${window.currentHorseId}/offspring`;
  const params = new URLSearchParams();
  if (gender) params.append('gender', gender);
  if (breederId) params.append('breeder_id', breederId);
  if (params.toString()) url += `?${params.toString()}`;

  try {
    const result = await fetchData(url);
    const offspring = result.offspring || result; // Handle both formats
    const offspringList = document.getElementById('offspring-list');
    if (!offspringList) {
      console.error('offspring-list element not found');
      return;
    }
    
    offspringList.innerHTML = '';

    if (offspring.length === 0) {
      offspringList.innerHTML = '<p>Brak potomstwa spełniającego kryteria.</p>';
      return;
    }

    offspring.forEach(horse => {
      const card = document.createElement('div');
      card.className = 'horse-card';
      card.innerHTML = `
        <h3>${horse.name}</h3>
        <p>Płeć: ${horse.gender}</p>
        <p>Data urodzenia: ${horse.birth_date ? new Date(horse.birth_date).toLocaleDateString() : 'Brak'}</p>
        <button onclick="showPedigree(${horse.id})">Pokaż Rodowód</button>
        <button onclick="editHorse(${horse.id})">Edytuj</button>
      `;
      offspringList.appendChild(card);
    });
  } catch (error) {
    alert('Błąd podczas pobierania potomstwa: ' + error.message);
  }
}