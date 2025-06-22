const API_URL = 'http://localhost:3000/api';

// Globalne zmienne
let allHorses = [];
let currentHorseId = null;

// =====================================
// FUNKCJE ZARZĄDZANIA SEKCJAMI
// =====================================

function showSection(sectionId) {
  // Ukryj wszystkie sekcje
  document.querySelectorAll('section').forEach(section => {
    section.classList.remove('active');
    section.classList.add('hidden');
  });
  
  // Pokaż wybraną sekcję
  const targetSection = document.getElementById(sectionId);
  if (targetSection) {
    targetSection.classList.add('active');
    targetSection.classList.remove('hidden');
  }
  
  // Załaduj dane dla sekcji view-data
  if (sectionId === 'view-data') {
    loadViewData();
  }
  
  console.log(`Przełączono na sekcję: ${sectionId}`);
}

function resetForm(formId) {
  const form = document.getElementById(formId);
  if (!form) return;
  
  form.reset();
  
  // Wyczyść błędy
  form.querySelectorAll('.error-message').forEach(span => {
    span.textContent = '';
  });
  
  // POPRAWKA: Reset form submission handler dla edycji koni
  if (formId === 'horse-form') {
    // Usuń handler edycji jeśli istnieje
    if (form._editHandler) {
      form.removeEventListener('submit', form._editHandler);
      form._editHandler = null;
    }
    
    // Przywróć standardowy handler dodawania
    form.onsubmit = null;
    setupFormHandler('horse-form', 'horses', loadHorses);
    hideBreedingPreview();
  }
  
  console.log(`Reset formularza: ${formId}`);
}

// =====================================
// FUNKCJE TABS
// =====================================

function setupTabs() {
  const tabButtons = document.querySelectorAll('.tab-button');
  tabButtons.forEach(button => {
    button.addEventListener('click', (e) => {
      const tabName = e.target.getAttribute('data-tab');
      showTab(tabName);
    });
  });
}

function showTab(tabName) {
  // Ukryj wszystkie tab-panes
  document.querySelectorAll('.tab-pane').forEach(pane => {
    pane.classList.add('hidden');
  });
  
  // Usuń active z wszystkich tab-button
  document.querySelectorAll('.tab-button').forEach(button => {
    button.classList.remove('active');
  });
  
  // Pokaż wybrany tab
  const targetPane = document.getElementById(`${tabName}-tab`);
  const targetButton = document.querySelector(`[data-tab="${tabName}"]`);
  
  if (targetPane) targetPane.classList.remove('hidden');
  if (targetButton) targetButton.classList.add('active');
  
  // Załaduj dane dla aktywnego taba
  loadTabData(tabName);
}

async function loadTabData(tabName) {
  try {
    switch (tabName) {
      case 'countries':
        await loadCountriesData();
        break;
      case 'breeders':
        await loadBreedersData();
        break;
      case 'breeds':
        await loadBreedsData();
        break;
      case 'colors':
        await loadColorsData();
        break;
    }
  } catch (error) {
    console.error(`Błąd ładowania danych dla ${tabName}:`, error);
  }
}

async function loadViewData() {
  // Domyślnie załaduj pierwszy tab
  showTab('countries');
}

async function loadCountriesData() {
  try {
    const countries = await fetchData('countries');
    const container = document.getElementById('countries-list');
    
    if (!container) return;
    
    container.innerHTML = '';
    
    countries.forEach(country => {
      const item = document.createElement('div');
      item.className = 'data-item';
      item.innerHTML = `
        <strong>${country.code}</strong>
        ${country.name}
      `;
      container.appendChild(item);
    });
    
    console.log(`Załadowano ${countries.length} krajów`);
  } catch (error) {
    console.error('Błąd ładowania krajów:', error);
  }
}

async function loadBreedersData() {
  try {
    const [breeders, countries] = await Promise.all([
      fetchData('breeders'),
      fetchData('countries')
    ]);
    
    const container = document.getElementById('breeders-list');
    
    if (!container) return;
    
    container.innerHTML = '';
    
    breeders.forEach(breeder => {
      const country = countries.find(c => c.code === breeder.country_code);
      const item = document.createElement('div');
      item.className = 'data-item';
      item.innerHTML = `
        <strong>${breeder.name}</strong>
        ${country ? country.name : breeder.country_code}
      `;
      container.appendChild(item);
    });
    
    console.log(`Załadowano ${breeders.length} hodowców`);
  } catch (error) {
    console.error('Błąd ładowania hodowców:', error);
  }
}

async function loadBreedsData() {
  try {
    const breeds = await fetchData('breeds');
    const container = document.getElementById('breeds-list');
    
    if (!container) return;
    
    container.innerHTML = '';
    
    const breedDescriptions = {
      'oo': 'Koń półkrwi polskiej',
      'xx': 'Koń pełnej krwi angielskiej',
      'xo': 'Mieszaniec',
      'xxoo': 'Mieszaniec złożony'
    };
    
    breeds.forEach(breed => {
      const item = document.createElement('div');
      item.className = 'data-item';
      item.innerHTML = `
        <strong>${breed.name}</strong>
        ${breedDescriptions[breed.name] || 'Nieznany opis'}
      `;
      container.appendChild(item);
    });
    
    console.log(`Załadowano ${breeds.length} ras`);
  } catch (error) {
    console.error('Błąd ładowania ras:', error);
  }
}

async function loadColorsData() {
  try {
    const colors = await fetchData('colors');
    const container = document.getElementById('colors-list');
    
    if (!container) return;
    
    container.innerHTML = '';
    
    colors.forEach(color => {
      const item = document.createElement('div');
      item.className = 'data-item';
      item.innerHTML = `
        <strong>${color.name}</strong>
        ID: ${color.id}
      `;
      container.appendChild(item);
    });
    
    console.log(`Załadowano ${colors.length} maści`);
  } catch (error) {
    console.error('Błąd ładowania maści:', error);
  }
}

// =====================================
// FUNKCJE API
// =====================================

async function fetchData(endpoint) {
  if (!endpoint) throw new Error('Endpoint nie może być pusty');
  
  try {
    console.log(`Pobieranie danych: ${API_URL}/${endpoint}`);
    const response = await fetch(`${API_URL}/${endpoint}`);
    
    if (!response.ok) {
      throw new Error(`Błąd HTTP ${response.status}: ${response.statusText}`);
    }
    
    const data = await response.json();
    console.log(`Pobrano dane:`, data);
    return data;
  } catch (error) {
    console.error('Błąd fetch:', error);
    throw error;
  }
}

async function postData(endpoint, data) {
  try {
    console.log(`Wysyłanie danych do: ${API_URL}/${endpoint}`, data);
    const response = await fetch(`${API_URL}/${endpoint}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || `Błąd HTTP ${response.status}`);
    }
    
    const result = await response.json();
    console.log('Dane wysłane pomyślnie:', result);
    return result;
  } catch (error) {
    console.error('Błąd post:', error);
    throw error;
  }
}

async function updateData(endpoint, id, data) {
  try {
    console.log(`Aktualizacja danych: ${API_URL}/${endpoint}/${id}`, data);
    const response = await fetch(`${API_URL}/${endpoint}/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || `Błąd HTTP ${response.status}`);
    }
    
    const result = await response.json();
    console.log('Dane zaktualizowane pomyślnie:', result);
    return result;
  } catch (error) {
    console.error('Błąd update:', error);
    throw error;
  }
}

async function deleteData(endpoint, id) {
  try {
    console.log(`Usuwanie danych: ${API_URL}/${endpoint}/${id}`);
    const response = await fetch(`${API_URL}/${endpoint}/${id}`, { 
      method: 'DELETE' 
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || `Błąd HTTP ${response.status}`);
    }
    
    console.log('Dane usunięte pomyślnie');
  } catch (error) {
    console.error('Błąd delete:', error);
    throw error;
  }
}

// =====================================
// FUNKCJE ŁADOWANIA DANYCH
// =====================================

async function loadHorses(searchQuery = '', sortOption = 'name-asc') {
  try {
    console.log('Ładowanie listy koni...');
    const [horses, breeds, colors, breeders] = await Promise.all([
      fetchData('horses'),
      fetchData('breeds'),
      fetchData('colors'),
      fetchData('breeders')
    ]);

    // Filtrowanie
    let filteredHorses = horses.filter(horse =>
      horse.name.toLowerCase().includes(searchQuery.toLowerCase())
    );

    // Sortowanie
    switch (sortOption) {
      case 'name-asc':
        filteredHorses.sort((a, b) => a.name.localeCompare(b.name));
        break;
      case 'name-desc':
        filteredHorses.sort((a, b) => b.name.localeCompare(a.name));
        break;
      case 'birth_date-asc':
        filteredHorses.sort((a, b) => (a.birth_date || '').localeCompare(b.birth_date || ''));
        break;
      case 'birth_date-desc':
        filteredHorses.sort((a, b) => (b.birth_date || '').localeCompare(a.birth_date || ''));
        break;
    }

    const horseList = document.getElementById('horse-list');
    if (!horseList) return;
    
    horseList.innerHTML = '';

    filteredHorses.forEach(horse => {
      const breed = breeds.find(b => b.id === horse.breed_id)?.name || 'Brak';
      const color = colors.find(c => c.id === horse.color_id)?.name || 'Brak';
      const breeder = breeders.find(b => b.id === horse.breeder_id)?.name || 'Brak';

      const card = document.createElement('div');
      card.className = 'horse-card';
      card.innerHTML = `
        <h3>${horse.name}</h3>
        <p><strong>Rasa:</strong> ${breed}</p>
        <p><strong>Płeć:</strong> ${horse.gender}</p>
        <p><strong>Maść:</strong> ${color}</p>
        <p><strong>Hodowca:</strong> ${breeder}</p>
        <div class="horse-actions">
          <button onclick="showPedigree(${horse.id})" class="btn-primary">Rodowód</button>
          <button onclick="showOffspring(${horse.id})" class="btn-secondary">Potomstwo</button>
          <button onclick="editHorse(${horse.id})" class="btn-edit">Edytuj</button>
          <button onclick="deleteHorse(${horse.id})" class="btn-delete">Usuń</button>
        </div>
      `;
      horseList.appendChild(card);
    });
    
    console.log(`Załadowano ${filteredHorses.length} koni`);
  } catch (error) {
    console.error('Błąd podczas ładowania koni:', error);
    alert('Błąd podczas ładowania koni: ' + error.message);
  }
}

async function loadSelectOptions() {
  try {
    console.log('Ładowanie opcji dla select...');
    const [countries, breeds, colors, breeders, horses] = await Promise.all([
      fetchData('countries'),
      fetchData('breeds'),
      fetchData('colors'),
      fetchData('breeders'),
      fetchData('horses')
    ]);

    // Kraje dla hodowców
    const breederCountrySelect = document.getElementById('breeder-country-select');
    if (breederCountrySelect) {
      breederCountrySelect.innerHTML = '<option value="">Wybierz kraj...</option>';
      countries.forEach(country => {
        const option = document.createElement('option');
        option.value = country.code;
        option.textContent = country.name;
        breederCountrySelect.appendChild(option);
      });
    }

    // Rasy dla koni - ZMIANA: opcjonalne
    const horseBreedSelect = document.getElementById('horse-breed-select');
    if (horseBreedSelect) {
      horseBreedSelect.innerHTML = '<option value="">Auto-oblicz z rodziców</option>';
      breeds.forEach(breed => {
        const option = document.createElement('option');
        option.value = breed.id;
        const descriptions = {
          'oo': 'oo (Koń półkrwi polskiej)',
          'xx': 'xx (Koń pełnej krwi angielskiej)',
          'xo': 'xo (Mieszaniec)',
          'xxoo': 'xxoo (Mieszaniec złożony)'
        };
        option.textContent = descriptions[breed.name] || breed.name;
        horseBreedSelect.appendChild(option);
      });
    }

    // Maści dla koni
    const horseColorSelect = document.getElementById('horse-color-select');
    if (horseColorSelect) {
      horseColorSelect.innerHTML = '<option value="">Wybierz maść...</option>';
      colors.forEach(color => {
        const option = document.createElement('option');
        option.value = color.id;
        option.textContent = color.name;
        horseColorSelect.appendChild(option);
      });
    }

    // Hodowcy dla koni
    const horseBreederSelect = document.getElementById('horse-breeder-select');
    if (horseBreederSelect) {
      horseBreederSelect.innerHTML = '<option value="">Wybierz hodowcę...</option>';
      breeders.forEach(breeder => {
        const option = document.createElement('option');
        option.value = breeder.id;
        option.textContent = breeder.name;
        horseBreederSelect.appendChild(option);
      });
    }

    // Hodowcy dla filtra potomstwa
    const offspringBreederSelect = document.getElementById('offspring-breeder');
    if (offspringBreederSelect) {
      offspringBreederSelect.innerHTML = '<option value="">Wszyscy hodowcy</option>';
      breeders.forEach(breeder => {
        const option = document.createElement('option');
        option.value = breeder.id;
        option.textContent = breeder.name;
        offspringBreederSelect.appendChild(option);
      });
    }

    // Zapisz konie globalnie do filtrowania
    allHorses = horses;
    updateHorseSelects(horses);
    
    console.log('Opcje select załadowane pomyślnie');
  } catch (error) {
    console.error('Błąd podczas ładowania opcji:', error);
    alert('Błąd podczas ładowania opcji: ' + error.message);
  }
}

function updateHorseSelects(horses, sireFilter = '', damFilter = '') {
  const sireSelect = document.getElementById('horse-sire-select');
  const damSelect = document.getElementById('horse-dam-select');
  
  if (sireSelect) {
    sireSelect.innerHTML = '<option value="">Brak</option>';
    horses
      .filter(horse => horse.gender === 'ogier' && // TYLKO ogiery mogą być ojcami
                      (!sireFilter || horse.name.toLowerCase().includes(sireFilter.toLowerCase())))
      .forEach(horse => {
        const option = document.createElement('option');
        option.value = horse.id;
        option.textContent = `${horse.name} (${horse.gender})`;
        sireSelect.appendChild(option);
      });
  }
  
  if (damSelect) {
    damSelect.innerHTML = '<option value="">Brak</option>';
    horses
      .filter(horse => horse.gender === 'klacz' && // TYLKO klacze mogą być matkami
                      (!damFilter || horse.name.toLowerCase().includes(damFilter.toLowerCase())))
      .forEach(horse => {
        const option = document.createElement('option');
        option.value = horse.id;
        option.textContent = `${horse.name} (${horse.gender})`;
        damSelect.appendChild(option);
      });
  }
}

function filterHorses(type) {
  const searchInput = document.getElementById(`${type}-search`);
  if (!searchInput) return;
  
  const searchValue = searchInput.value;
  
  if (type === 'sire') {
    updateHorseSelects(allHorses, searchValue, '');
  } else if (type === 'dam') {
    updateHorseSelects(allHorses, '', searchValue);
  }
}

// =====================================
// FUNKCJE BREEDING PREVIEW
// =====================================

function setupBreedingPreview() {
  const sireSelect = document.getElementById('horse-sire-select');
  const damSelect = document.getElementById('horse-dam-select');
  
  if (sireSelect && damSelect) {
    sireSelect.addEventListener('change', checkBreeding);
    damSelect.addEventListener('change', checkBreeding);
  }
}

async function checkBreeding() {
  const sireSelect = document.getElementById('horse-sire-select');
  const damSelect = document.getElementById('horse-dam-select');
  const previewDiv = document.getElementById('breeding-preview');
  const resultDiv = document.getElementById('breeding-result');
  
  if (!sireSelect || !damSelect || !previewDiv || !resultDiv) return;
  
  const sireId = sireSelect.value;
  const damId = damSelect.value;
  
  if (!sireId || !damId) {
    hideBreedingPreview();
    return;
  }
  
  try {
    const response = await fetch(`${API_URL}/horses/breeding/check?sire_id=${sireId}&dam_id=${damId}`);
    
    if (!response.ok) {
      const errorData = await response.json();
      
      // Sprawdź czy to błąd niedozwolonego krzyżowania
      if (errorData.breeding_possible === false) {
        resultDiv.innerHTML = `
          <div class="breeding-error">
            <p><strong>🚫 ${errorData.error}</strong></p>
            <p><strong>Ojciec:</strong> ${errorData.sire.name}</p>
            <p><strong>Matka:</strong> ${errorData.dam.name}</p>
            ${errorData.problems ? 
              `<ul>${errorData.problems.map(p => `<li class="error">❌ ${p}</li>`).join('')}</ul>` : 
              ''
            }
          </div>
        `;
        previewDiv.style.display = 'block';
        return;
      }
      
      throw new Error(errorData.error);
    }
    
    const data = await response.json();
    
    // Określ kolor na podstawie poziomu ryzyka
    let riskColor = '#27ae60'; // zielony
    let riskIcon = '✅';
    
    if (data.risk_level === 'high') {
      riskColor = '#e74c3c'; // czerwony
      riskIcon = '🚫';
    } else if (data.risk_level === 'medium') {
      riskColor = '#f39c12'; // pomarańczowy
      riskIcon = '⚠️';
    }
    
    resultDiv.innerHTML = `
      <div class="breeding-info">
        <p><strong>Ojciec:</strong> ${data.sire.name}</p>
        <p><strong>Matka:</strong> ${data.dam.name}</p>
        <p><strong>Przewidywana rasa potomstwa:</strong> <span class="breed-highlight">${data.predicted_breed}</span></p>
        <div class="risk-assessment" style="border-left: 4px solid ${riskColor}; padding-left: 10px; margin: 10px 0;">
          <p><strong>Ocena ryzyka:</strong> <span style="color: ${riskColor};">${data.risk_level.toUpperCase()}</span></p>
          ${data.inbreeding_detected ? 
            `<p><strong>Typ pokrewieństwa:</strong> ${data.inbreeding_type}</p>` : 
            ''
          }
          <p style="color: ${riskColor}; font-weight: bold;">${riskIcon} ${data.recommendation}</p>
        </div>
      </div>
    `;
    
    previewDiv.style.display = 'block';
    
  } catch (error) {
    console.error('Błąd sprawdzania krzyżowania:', error);
    resultDiv.innerHTML = `<p class="error">Błąd: ${error.message}</p>`;
    previewDiv.style.display = 'block';
  }
}

function hideBreedingPreview() {
  const previewDiv = document.getElementById('breeding-preview');
  if (previewDiv) {
    previewDiv.style.display = 'none';
  }
}

// =====================================
// FUNKCJE WALIDACJI I FORMULARZY
// =====================================

function validateForm(formId) {
  const form = document.getElementById(formId);
  if (!form) return false;
  
  const inputs = form.querySelectorAll('input[required], select[required]');
  let isValid = true;

  inputs.forEach(input => {
    const errorSpan = input.parentElement.querySelector('.error-message');
    if (!errorSpan) return;
    
    if (!input.value || (input.pattern && !new RegExp(input.pattern).test(input.value))) {
      errorSpan.textContent = 'To pole jest wymagane lub zawiera nieprawidłowe dane.';
      isValid = false;
    } else {
      errorSpan.textContent = '';
    }
  });

  return isValid;
}

function setupFormHandler(formId, endpoint, callback) {
  const form = document.getElementById(formId);
  if (!form) return;
  
  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    if (!validateForm(formId)) {
      console.log('Walidacja formularza nie powiodła się');
      return;
    }

    const formData = new FormData(form);
    const data = Object.fromEntries(formData);
    
    // Konwersja pustych stringów na null dla opcjonalnych pól
    Object.keys(data).forEach(key => {
      if (data[key] === '') {
        data[key] = null;
      }
    });
    
    try {
      await postData(endpoint, data);
      alert('Dodano pomyślnie!');
      resetForm(formId);
      if (callback) callback();
    } catch (error) {
      console.error('Błąd podczas dodawania:', error);
      alert('Błąd podczas dodawania: ' + error.message);
    }
  });
}

// =====================================
// FUNKCJE KONI (CRUD)
// =====================================

async function editHorse(id) {
  try {
    console.log(`Edycja konia ID: ${id}`);
    const horse = await fetchData(`horses/${id}`);
    
    showSection('add-horse');
    
    const form = document.getElementById('horse-form');
    if (!form) return;
    
    // Wypełnij formularz danymi konia
    if (form.name) form.name.value = horse.name || '';
    if (form.breed_id) form.breed_id.value = horse.breed_id || '';
    if (form.birth_date) form.birth_date.value = horse.birth_date ? horse.birth_date.split('T')[0] : '';
    if (form.gender) form.gender.value = horse.gender || '';
    if (form.sire_id) form.sire_id.value = horse.sire_id || '';
    if (form.dam_id) form.dam_id.value = horse.dam_id || '';
    if (form.color_id) form.color_id.value = horse.color_id || '';
    if (form.breeder_id) form.breeder_id.value = horse.breeder_id || '';

    // POPRAWKA: Usuń stary handler i ustaw nowy
    form.removeEventListener('submit', form._editHandler);
    
    // Stwórz nowy handler dla edycji
    const editHandler = async (e) => {
      e.preventDefault();
      
      if (!validateForm('horse-form')) return;
      
      const formData = new FormData(form);
      const data = Object.fromEntries(formData);
      
      // Konwersja pustych stringów na null
      Object.keys(data).forEach(key => {
        if (data[key] === '') {
          data[key] = null;
        }
      });
      
      try {
        const response = await updateData('horses', id, data);
        
        // POPRAWKA: Sprawdź czy response ma message
        if (response && response.message) {
          alert(response.message);
        } else {
          alert('Zaktualizowano pomyślnie!');
        }
        
        resetForm('horse-form');
        showSection('dashboard');
        loadHorses();
      } catch (error) {
        console.error('Błąd podczas edycji:', error);
        alert('Błąd podczas edycji: ' + error.message);
      }
    };
    
    // Zapisz referencję i dodaj handler
    form._editHandler = editHandler;
    form.addEventListener('submit', editHandler);
    
    // Sprawdź krzyżowanie po załadowaniu danych
    setTimeout(checkBreeding, 100);
    
    console.log('Formularz edycji przygotowany');
  } catch (error) {
    console.error('Błąd podczas ładowania danych konia:', error);
    alert('Błąd podczas ładowania danych konia: ' + error.message);
  }
}

async function deleteHorse(id) {
  if (!confirm('Czy na pewno chcesz usunąć tego konia?')) {
    return;
  }
  
  try {
    console.log(`Usuwanie konia ID: ${id}`);
    await deleteData('horses', id);
    alert('Usunięto pomyślnie!');
    loadHorses();
  } catch (error) {
    console.error('Błąd podczas usuwania:', error);
    alert('Błąd podczas usuwania: ' + error.message);
  }
}

// =====================================
// FUNKCJE RODOWODU
// =====================================

async function showPedigree(horseId) {
  if (!horseId) {
    alert('Błąd: Nie wybrano konia.');
    return;
  }
  
  console.log(`Pokazywanie rodowodu dla konia ID: ${horseId}`);
  currentHorseId = horseId;
  showSection('pedigree-view');
}

async function fetchPedigreeHtml() {
  if (!currentHorseId) {
    alert('Błąd: Nie wybrano konia.');
    return;
  }
  
  const depthInput = document.getElementById('pedigree-depth');
  if (!depthInput) return;
  
  const depth = depthInput.value;
  
  if (depth < 1 || depth > 5) {
    alert('Głębokość musi być między 1 a 5.');
    return;
  }
  
  try {
    console.log(`Pobieranie HTML rodowodu dla konia ${currentHorseId}, głębokość: ${depth}`);
    const response = await fetch(`${API_URL}/horses/${currentHorseId}/pedigree/html/${depth}`);
    
    if (!response.ok) {
      throw new Error(`Błąd HTTP ${response.status}`);
    }
    
    const html = await response.text();
    const treeContainer = document.getElementById('pedigree-tree');
    
    if (treeContainer) {
      treeContainer.innerHTML = html;
      
      // Dodaj obsługę kliknięć na węzły
      treeContainer.querySelectorAll('.node').forEach(node => {
        node.addEventListener('click', () => {
          const horseId = node.dataset.horseId || currentHorseId;
          showHorseDetails(horseId);
        });
      });
    }
    
    console.log('Rodowód HTML wygenerowany pomyślnie');
  } catch (error) {
    console.error('Błąd podczas pobierania rodowodu:', error);
    alert('Błąd podczas pobierania rodowodu: ' + error.message);
  }
}

async function showHorseDetails(horseId) {
  try {
    console.log(`Pokazywanie szczegółów konia ID: ${horseId}`);
    const [horse, breeds, colors, breeders] = await Promise.all([
      fetchData(`horses/${horseId}`),
      fetchData('breeds'),
      fetchData('colors'),
      fetchData('breeders')
    ]);
    
    const breed = breeds.find(b => b.id === horse.breed_id)?.name || 'Brak';
    const color = colors.find(c => c.id === horse.color_id)?.name || 'Brak';
    const breeder = breeders.find(b => b.id === horse.breeder_id)?.name || 'Brak';

    const details = `Szczegóły konia:
Imię: ${horse.name}
Rasa: ${breed}
Płeć: ${horse.gender}
Maść: ${color}
Hodowca: ${breeder}
Data urodzenia: ${horse.birth_date ? new Date(horse.birth_date).toLocaleDateString() : 'Brak'}`;

    alert(details);
  } catch (error) {
    console.error('Błąd podczas ładowania szczegółów konia:', error);
    alert('Błąd podczas ładowania szczegółów konia: ' + error.message);
  }
}

// =====================================
// FUNKCJE POTOMSTWA
// =====================================

async function showOffspring(horseId) {
  if (!horseId) {
    alert('Błąd: Nie wybrano konia.');
    return;
  }
  
  console.log(`Pokazywanie potomstwa dla konia ID: ${horseId}`);
  currentHorseId = horseId;
  showSection('offspring-view');
  fetchOffspring();
}

async function fetchOffspring() {
  if (!currentHorseId) {
    alert('Błąd: Nie wybrano konia.');
    return;
  }
  
  const genderSelect = document.getElementById('offspring-gender');
  const breederSelect = document.getElementById('offspring-breeder');
  
  const gender = genderSelect ? genderSelect.value : '';
  const breederId = breederSelect ? breederSelect.value : '';
  
  let url = `horses/${currentHorseId}/offspring`;
  const params = new URLSearchParams();
  
  if (gender) params.append('gender', gender);
  if (breederId) params.append('breeder_id', breederId);
  
  if (params.toString()) {
    url += `?${params.toString()}`;
  }

  try {
    console.log(`Pobieranie potomstwa: ${url}`);
    const response = await fetchData(url);
    const offspring = response.offspring || response; // API może zwracać różne struktury
    
    const offspringList = document.getElementById('offspring-list');
    if (!offspringList) return;
    
    offspringList.innerHTML = '';

    if (offspring.length === 0) {
      offspringList.innerHTML = '<p class="no-data">Brak potomstwa spełniającego kryteria.</p>';
      return;
    }

    offspring.forEach(horse => {
      const card = document.createElement('div');
      card.className = 'horse-card';
      card.innerHTML = `
        <h3>${horse.name}</h3>
        <p><strong>Płeć:</strong> ${horse.gender}</p>
        <p><strong>Data urodzenia:</strong> ${horse.birth_date ? new Date(horse.birth_date).toLocaleDateString() : 'Brak'}</p>
        <div class="horse-actions">
          <button onclick="showPedigree(${horse.id})" class="btn-primary">Rodowód</button>
          <button onclick="editHorse(${horse.id})" class="btn-edit">Edytuj</button>
        </div>
      `;
      offspringList.appendChild(card);
    });
    
    console.log(`Załadowano ${offspring.length} potomków`);
  } catch (error) {
    console.error('Błąd podczas pobierania potomstwa:', error);
    alert('Błąd podczas pobierania potomstwa: ' + error.message);
  }
}

// =====================================
// INICJALIZACJA
// =====================================

function setupNavigationHandlers() {
  console.log('Konfigurowanie handlerów nawigacji...');
  
  // Obsługa przycisków nawigacji
  const navButtons = document.querySelectorAll('.sidebar button[data-section]');
  navButtons.forEach(button => {
    button.addEventListener('click', (e) => {
      const sectionId = e.target.getAttribute('data-section');
      console.log(`Kliknięto przycisk nawigacji: ${sectionId}`);
      
      if (sectionId) {
        showSection(sectionId);
      }
    });
  });
  
  console.log(`Skonfigurowano ${navButtons.length} przycisków nawigacji`);
}

function setupSearchAndSort() {
  console.log('Konfigurowanie wyszukiwania i sortowania...');
  
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

function setupParentFilters() {
  console.log('Konfigurowanie filtrów rodziców...');
  
  const sireSearch = document.getElementById('sire-search');
  const damSearch = document.getElementById('dam-search');
  
  if (sireSearch) {
    sireSearch.addEventListener('input', () => filterHorses('sire'));
  }
  
  if (damSearch) {
    damSearch.addEventListener('input', () => filterHorses('dam'));
  }
}

function setupOffspringFilters() {
  console.log('Konfigurowanie filtrów potomstwa...');
  
  const genderFilter = document.getElementById('offspring-gender');
  const breederFilter = document.getElementById('offspring-breeder');
  
  if (genderFilter) {
    genderFilter.addEventListener('change', fetchOffspring);
  }
  
  if (breederFilter) {
    breederFilter.addEventListener('change', fetchOffspring);
  }
}

function setupPedigreeControls() {
  console.log('Konfigurowanie kontroli rodowodu...');
  
  const pedigreeButton = document.querySelector('#pedigree-view button');
  if (pedigreeButton) {
    pedigreeButton.addEventListener('click', fetchPedigreeHtml);
  }
}

// Główna funkcja inicjalizacyjna
document.addEventListener('DOMContentLoaded', async () => {
  console.log('🐎 Inicjalizacja aplikacji Horse Pedigree...');
  
  try {
    // 1. Skonfiguruj handlery nawigacji
    setupNavigationHandlers();
    
    // 2. Skonfiguruj tabs
    setupTabs();
    
    // 3. Skonfiguruj wyszukiwanie i sortowanie
    setupSearchAndSort();
    
    // 4. Skonfiguruj filtry rodziców
    setupParentFilters();
    
    // 5. Skonfiguruj filtry potomstwa
    setupOffspringFilters();
    
    // 6. Skonfiguruj kontrole rodowodu
    setupPedigreeControls();
    
    // 7. Skonfiguruj breeding preview
    setupBreedingPreview();
    
    // 8. Załaduj dane
    await loadSelectOptions();
    await loadHorses();
    
    // 9. Skonfiguruj handlery formularzy
    setupFormHandler('country-form', 'countries', loadSelectOptions);
    setupFormHandler('breeder-form', 'breeders', loadSelectOptions);
    setupFormHandler('horse-form', 'horses', loadHorses);
    setupFormHandler('color-form', 'colors', loadSelectOptions);
    
    console.log('✅ Aplikacja zainicjalizowana pomyślnie!');
  } catch (error) {
    console.error('❌ Błąd podczas inicjalizacji:', error);
    alert('Błąd podczas inicjalizacji aplikacji. Sprawdź czy API działa.');
  }
});

// Eksportuj funkcje dla testów (jeśli potrzebne)
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    showSection,
    resetForm,
    fetchData,
    postData,
    updateData,
    deleteData,
    loadHorses,
    loadSelectOptions,
    editHorse,
    deleteHorse,
    showPedigree,
    showOffspring,
    checkBreeding
  };
}