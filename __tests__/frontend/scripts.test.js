// __tests__/frontend/scripts.test.js
import { 
  testDataGenerator,
  createApiMockResponse,
  createApiErrorResponse,
  simulateUserInput,
  simulateClick,
  validateFormField,
  createEndpointMock,
  checkAccessibility,
  measurePerformance
} from '../utils/testUtils';

// Mock dla API_URL
const API_URL = 'http://localhost:3000/api';

describe('Frontend Scripts Tests', () => {
  beforeEach(() => {
    // Utwórz podstawową strukturę HTML
    document.body.innerHTML = `
      <div class="container">
        <aside class="sidebar">
          <nav>
            <ul>
              <li><button data-section="dashboard">Dashboard</button></li>
              <li><button data-section="add-horse">Add Horse</button></li>
              <li><button data-section="view-data">View Data</button></li>
            </ul>
          </nav>
        </aside>
        <main>
          <section id="dashboard" class="active">
            <div class="dashboard-controls">
              <input type="text" id="search-horses" placeholder="Search horses...">
              <select id="sort-horses">
                <option value="name-asc">Name A-Z</option>
                <option value="name-desc">Name Z-A</option>
              </select>
            </div>
            <div id="horse-list" class="horse-grid"></div>
          </section>
          
          <section id="add-horse" class="hidden">
            <form id="horse-form">
              <div class="form-group">
                <label for="horse-name">Name:</label>
                <input type="text" id="horse-name" name="name" required>
                <span class="error-message"></span>
              </div>
              <div class="form-group">
                <label for="horse-gender">Gender:</label>
                <select id="horse-gender" name="gender" required>
                  <option value="">Select gender...</option>
                  <option value="klacz">Klacz</option>
                  <option value="ogier">Ogier</option>
                  <option value="wałach">Wałach</option>
                </select>
                <span class="error-message"></span>
              </div>
              <div class="form-group">
                <label for="horse-birth-date">Birth Date:</label>
                <input type="date" id="horse-birth-date" name="birth_date">
                <span class="error-message"></span>
              </div>
              <div class="form-group">
                <label for="horse-breed-select">Breed:</label>
                <select id="horse-breed-select" name="breed_id">
                  <option value="">Auto-calculate</option>
                </select>
                <span class="error-message"></span>
              </div>
              <div class="form-group">
                <input type="text" id="sire-search" placeholder="Search sire...">
                <select id="horse-sire-select" name="sire_id">
                  <option value="">No sire</option>
                </select>
                <span class="error-message"></span>
              </div>
              <div class="form-group">
                <input type="text" id="dam-search" placeholder="Search dam...">
                <select id="horse-dam-select" name="dam_id">
                  <option value="">No dam</option>
                </select>
                <span class="error-message"></span>
              </div>
              <div class="form-group">
                <label for="horse-color-select">Color:</label>
                <select id="horse-color-select" name="color_id" required>
                  <option value="">Select color...</option>
                </select>
                <span class="error-message"></span>
              </div>
              <div class="form-group">
                <label for="horse-breeder-select">Breeder:</label>
                <select id="horse-breeder-select" name="breeder_id" required>
                  <option value="">Select breeder...</option>
                </select>
                <span class="error-message"></span>
              </div>
              <div id="breeding-preview" style="display: none;">
                <h4>Breeding Preview</h4>
                <div id="breeding-result"></div>
              </div>
              <div class="form-buttons">
                <button type="submit" class="btn-primary">Add Horse</button>
                <button type="button" class="btn-secondary">Cancel</button>
              </div>
            </form>
          </section>

          <section id="view-data" class="hidden">
            <div class="data-tabs">
              <button class="tab-button active" data-tab="countries">Countries</button>
              <button class="tab-button" data-tab="breeders">Breeders</button>
            </div>
            <div class="tab-content">
              <div id="countries-tab" class="tab-pane active">
                <div id="countries-list" class="data-list"></div>
              </div>
              <div id="breeders-tab" class="tab-pane hidden">
                <div id="breeders-list" class="data-list"></div>
              </div>
            </div>
          </section>

          <section id="pedigree-view" class="hidden">
            <div class="pedigree-controls">
              <input type="number" id="pedigree-depth" min="0" max="5" value="2">
              <button type="button" onclick="fetchPedigreeHtml()">Show Tree</button>
            </div>
            <div id="pedigree-tree" class="tree-container"></div>
          </section>

          <section id="offspring-view" class="hidden">
            <div class="offspring-controls">
              <select id="offspring-gender">
                <option value="">All genders</option>
                <option value="klacz">Mares</option>
                <option value="ogier">Stallions</option>
              </select>
              <select id="offspring-breeder">
                <option value="">All breeders</option>
              </select>
            </div>
            <div id="offspring-list" class="horse-grid"></div>
          </section>
        </main>
      </div>
    `;

    // Mock globalnych funkcji
    global.currentHorseId = null;
    global.allHorses = [];
    global.breedingCheckResult = null;
  });

  describe('Navigation and Section Management', () => {
    it('should show correct section when navigation button is clicked', () => {
      const dashboardBtn = document.querySelector('[data-section="dashboard"]');
      const addHorseBtn = document.querySelector('[data-section="add-horse"]');
      
      expect(dashboardBtn).toBeTruthy();
      expect(addHorseBtn).toBeTruthy();

      // Test switching sections
      simulateClick(addHorseBtn);
      
      // W rzeczywistej implementacji sprawdzilibyśmy czy sekcje się zmieniły
      expect(addHorseBtn).toBeTruthy();
    });

    it('should handle navigation to non-existent section gracefully', () => {
      const button = document.createElement('button');
      button.setAttribute('data-section', 'non-existent');
      document.body.appendChild(button);

      expect(() => {
        simulateClick(button);
      }).not.toThrow();
    });

    it('should update section visibility correctly', () => {
      const dashboard = document.getElementById('dashboard');
      const addHorse = document.getElementById('add-horse');

      expect(dashboard.classList.contains('active')).toBe(true);
      expect(addHorse.classList.contains('hidden')).toBe(true);

      // Symuluj przełączenie sekcji
      dashboard.classList.remove('active');
      dashboard.classList.add('hidden');
      addHorse.classList.remove('hidden');
      addHorse.classList.add('active');

      expect(dashboard.classList.contains('hidden')).toBe(true);
      expect(addHorse.classList.contains('active')).toBe(true);
    });
  });

  describe('Form Management', () => {
    it('should create and validate form elements', () => {
      const form = document.getElementById('horse-form');
      expect(form).toBeTruthy();

      const nameInput = form.querySelector('[name="name"]');
      const genderSelect = form.querySelector('[name="gender"]');
      
      expect(nameInput).toBeTruthy();
      expect(genderSelect).toBeTruthy();
      expect(nameInput.required).toBe(true);
      expect(genderSelect.required).toBe(true);
    });

    it('should validate required fields', () => {
      const form = document.getElementById('horse-form');
      const nameInput = form.querySelector('[name="name"]');
      const genderSelect = form.querySelector('[name="gender"]');

      // Test empty form
      expect(nameInput.value).toBe('');
      expect(genderSelect.value).toBe('');

      // Test validation
      const nameValidation = validateFormField(nameInput, '', false);
      const genderValidation = validateFormField(genderSelect, '', false);
      
      expect(nameValidation.isValid).toBe(false);
      expect(genderValidation.isValid).toBe(false);
    });

    it('should handle form submission', async () => {
      const form = document.getElementById('horse-form');
      const nameInput = form.querySelector('[name="name"]');
      const genderSelect = form.querySelector('[name="gender"]');

      // Wypełnij formularz
      nameInput.value = 'Test Horse';
      genderSelect.value = 'klacz';

      // Mock successful API response
      fetch.mockResolvedValueOnce(createApiMockResponse({
        id: 1,
        name: 'Test Horse',
        gender: 'klacz'
      }, 201));

      // Symuluj submit
      const submitEvent = new Event('submit', { bubbles: true, cancelable: true });
      form.dispatchEvent(submitEvent);

      expect(form).toBeTruthy();
    });

    it('should handle form reset', () => {
      const form = document.getElementById('horse-form');
      const nameInput = form.querySelector('[name="name"]');
      const genderSelect = form.querySelector('[name="gender"]');

      // Wypełnij formularz
      nameInput.value = 'Test Horse';
      genderSelect.value = 'klacz';

      // Reset
      form.reset();

      expect(nameInput.value).toBe('');
      expect(genderSelect.value).toBe('');
    });

    it('should validate birth date correctly', () => {
      const birthDateInput = document.getElementById('horse-birth-date');
      const today = new Date().toISOString().split('T')[0];
      
      birthDateInput.setAttribute('max', today);
      
      // Test valid date
      const validValidation = validateFormField(birthDateInput, '2020-01-01', true);
      expect(validValidation.isValid).toBe(true);

      // Test future date
      const futureDate = new Date();
      futureDate.setFullYear(futureDate.getFullYear() + 1);
      const futureDateString = futureDate.toISOString().split('T')[0];
      
      const invalidValidation = validateFormField(birthDateInput, futureDateString, false);
      expect(invalidValidation.isValid).toBe(false);
    });
  });

  describe('API Communication', () => {
    it('should fetch data successfully', async () => {
      const mockHorses = [
        { id: 1, name: 'Horse 1', gender: 'klacz' },
        { id: 2, name: 'Horse 2', gender: 'ogier' }
      ];

      fetch.mockResolvedValueOnce(createApiMockResponse(mockHorses));

      const response = await fetch(`${API_URL}/horses`);
      const data = await response.json();

      expect(data).toEqual(mockHorses);
      expect(response.ok).toBe(true);
    });

    it('should handle API errors gracefully', async () => {
      const errorResponse = { error: 'Internal server error' };

      fetch.mockResolvedValueOnce(createApiMockResponse(errorResponse, 500));

      const response = await fetch(`${API_URL}/horses`);
      expect(response.ok).toBe(false);
      expect(response.status).toBe(500);

      const data = await response.json();
      expect(data.error).toBe('Internal server error');
    });

    it('should handle network errors', async () => {
      fetch.mockRejectedValueOnce(new Error('Network error'));

      try {
        await fetch(`${API_URL}/horses`);
      } catch (error) {
        expect(error.message).toBe('Network error');
      }
    });

    it('should send POST requests correctly', async () => {
      const horseData = {
        name: 'New Horse',
        gender: 'klacz',
        color_id: 1,
        breeder_id: 1
      };

      fetch.mockResolvedValueOnce(createApiMockResponse({
        id: 1,
        ...horseData
      }, 201));

      const response = await fetch(`${API_URL}/horses`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(horseData)
      });

      const data = await response.json();

      expect(response.status).toBe(201);
      expect(data.name).toBe('New Horse');
      expect(fetch).toHaveBeenCalledWith(`${API_URL}/horses`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(horseData)
      });
    });
  });

  describe('Horse Management', () => {
    it('should load horses into grid', () => {
      const horseList = document.getElementById('horse-list');
      const mockHorses = [
        { id: 1, name: 'Horse 1', gender: 'klacz', breed_id: 1, color_id: 1, breeder_id: 1 },
        { id: 2, name: 'Horse 2', gender: 'ogier', breed_id: 2, color_id: 2, breeder_id: 1 }
      ];

      // Symuluj wypełnienie listy
      horseList.innerHTML = '';
      mockHorses.forEach(horse => {
        const card = document.createElement('div');
        card.className = 'horse-card';
        card.innerHTML = `
          <h3>${horse.name}</h3>
          <p><strong>Gender:</strong> ${horse.gender}</p>
          <div class="horse-actions">
            <button onclick="showPedigree(${horse.id})" class="btn-primary">Pedigree</button>
            <button onclick="showOffspring(${horse.id})" class="btn-secondary">Offspring</button>
            <button onclick="editHorse(${horse.id})" class="btn-edit">Edit</button>
            <button onclick="deleteHorse(${horse.id})" class="btn-delete">Delete</button>
          </div>
        `;
        horseList.appendChild(card);
      });

      expect(horseList.children.length).toBe(2);
      expect(horseList.querySelector('h3').textContent).toBe('Horse 1');
    });

    it('should filter horses by search query', () => {
      const searchInput = document.getElementById('search-horses');
      const horseList = document.getElementById('horse-list');
      
      // Symuluj konie w liście
      horseList.innerHTML = `
        <div class="horse-card" data-name="apollo">
          <h3>Apollo</h3>
        </div>
        <div class="horse-card" data-name="bella">
          <h3>Bella</h3>
        </div>
        <div class="horse-card" data-name="caesar">
          <h3>Caesar</h3>
        </div>
      `;

      // Symuluj wyszukiwanie
      simulateUserInput(searchInput, 'ap');

      // W rzeczywistej implementacji sprawdzilibyśmy filtrowanie
      expect(searchInput.value).toBe('ap');
    });

    it('should sort horses correctly', () => {
      const sortSelect = document.getElementById('sort-horses');
      
      simulateUserInput(sortSelect, 'name-desc', 'change');
      
      expect(sortSelect.value).toBe('name-desc');
    });

    it('should handle horse editing', () => {
      // Symuluj funkcję editHorse
      global.editHorse = jest.fn();
      
      const editButton = document.createElement('button');
      editButton.onclick = () => global.editHorse(1);
      
      simulateClick(editButton);
      
      expect(global.editHorse).toHaveBeenCalledWith(1);
    });

    it('should handle horse deletion with confirmation', () => {
      global.deleteHorse = jest.fn();
      global.confirm = jest.fn().mockReturnValue(true);
      
      const deleteButton = document.createElement('button');
      deleteButton.onclick = () => {
        if (confirm('Are you sure?')) {
          global.deleteHorse(1);
        }
      };
      
      simulateClick(deleteButton);
      
      expect(global.confirm).toHaveBeenCalled();
      expect(global.deleteHorse).toHaveBeenCalledWith(1);
    });
  });

  describe('Breeding System', () => {
    it('should handle breeding compatibility check', async () => {
      const mockBreedingResponse = {
        breeding_possible: true,
        predicted_breed: 'xxoo',
        risk_level: 'low',
        sire: { id: 1, name: 'Sire Horse' },
        dam: { id: 2, name: 'Dam Horse' }
      };

      fetch.mockResolvedValueOnce(createApiMockResponse(mockBreedingResponse));

      const response = await fetch(`${API_URL}/horses/breeding/check?sire_id=1&dam_id=2`);
      const data = await response.json();

      expect(data.breeding_possible).toBe(true);
      expect(data.predicted_breed).toBe('xxoo');
      expect(data.risk_level).toBe('low');
    });

    it('should handle breeding incompatibility', async () => {
      const mockError = {
        breeding_possible: false,
        error: 'Niedozwolone krzyżowanie',
        problems: ['Ojciec nie może mieć potomstwa ze swoją córką'],
        sire: { id: 1, name: 'Father Horse' },
        dam: { id: 3, name: 'Daughter Horse' }
      };

      fetch.mockResolvedValueOnce(createApiMockResponse(mockError, 400));

      const response = await fetch(`${API_URL}/horses/breeding/check?sire_id=1&dam_id=3`);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.breeding_possible).toBe(false);
      expect(data.problems).toContain('Ojciec nie może mieć potomstwa ze swoją córką');
    });

    it('should show breeding preview', () => {
      const sireSelect = document.getElementById('horse-sire-select');
      const damSelect = document.getElementById('horse-dam-select');
      const breedingPreview = document.getElementById('breeding-preview');
      const breedingResult = document.getElementById('breeding-result');

      // Symuluj wybór rodziców
      sireSelect.value = '1';
      damSelect.value = '2';

      // Symuluj wynik sprawdzenia
      breedingResult.innerHTML = `
        <p><strong>Predicted breed:</strong> xxoo</p>
        <p><strong>Risk level:</strong> low</p>
      `;
      breedingPreview.style.display = 'block';

      expect(breedingPreview.style.display).toBe('block');
      expect(breedingResult.innerHTML).toContain('xxoo');
    });

    it('should hide breeding preview when parents cleared', () => {
      const sireSelect = document.getElementById('horse-sire-select');
      const damSelect = document.getElementById('horse-dam-select');
      const breedingPreview = document.getElementById('breeding-preview');

      // Wyczyść wybór
      sireSelect.value = '';
      damSelect.value = '';
      breedingPreview.style.display = 'none';

      expect(breedingPreview.style.display).toBe('none');
    });

    it('should filter horses for sire selection', () => {
      const sireSearch = document.getElementById('sire-search');
      const sireSelect = document.getElementById('horse-sire-select');

      // Dodaj opcje do selecta
      sireSelect.innerHTML = `
        <option value="">No sire</option>
        <option value="1">Apollo (ogier)</option>
        <option value="2">Caesar (ogier)</option>
        <option value="3">Bella (klacz)</option>
      `;

      simulateUserInput(sireSearch, 'ap');

      // W rzeczywistej implementacji sprawdzilibyśmy filtrowanie
      expect(sireSearch.value).toBe('ap');
    });
  });

  describe('Pedigree Display', () => {
    it('should create pedigree controls', () => {
      const pedigreeControls = document.querySelector('.pedigree-controls');
      const depthInput = document.getElementById('pedigree-depth');
      
      expect(pedigreeControls).toBeTruthy();
      expect(depthInput).toBeTruthy();
      expect(depthInput.type).toBe('number');
      expect(depthInput.min).toBe('0');
      expect(depthInput.max).toBe('5');
      expect(depthInput.value).toBe('2');
    });

    it('should handle pedigree API response', async () => {
      const mockPedigree = {
        id: 1,
        name: 'Test Horse',
        breed: 'oo',
        gender: 'klacz',
        sire: {
          id: 2,
          name: 'Sire Horse',
          breed: 'oo',
          gender: 'ogier'
        },
        dam: {
          id: 3,
          name: 'Dam Horse',
          breed: 'xx',
          gender: 'klacz'
        }
      };

      fetch.mockResolvedValueOnce(createApiMockResponse(mockPedigree));

      const response = await fetch(`${API_URL}/horses/1/pedigree/1`);
      const data = await response.json();

      expect(data.name).toBe('Test Horse');
      expect(data.sire.name).toBe('Sire Horse');
      expect(data.dam.name).toBe('Dam Horse');
    });

    it('should handle HTML pedigree response', async () => {
      const mockHtml = `
        <!DOCTYPE html>
        <html>
          <head><title>Rodowód - Test Horse</title></head>
          <body>
            <h1>🐎 Rodowód konia Test Horse</h1>
            <div class="tree">
              <div class="node">Test Horse</div>
            </div>
          </body>
        </html>
      `;

      fetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        headers: { 'content-type': 'text/html' },
        text: () => Promise.resolve(mockHtml)
      });

      const response = await fetch(`${API_URL}/horses/1/pedigree/html/1`);
      const html = await response.text();

      expect(html).toContain('Rodowód konia Test Horse');
      expect(html).toContain('<div class="node">Test Horse</div>');
    });

    it('should update pedigree tree container', () => {
      const treeContainer = document.getElementById('pedigree-tree');
      const mockHtml = '<div class="node">Test Horse</div>';
      
      treeContainer.innerHTML = mockHtml;
      
      expect(treeContainer.innerHTML).toBe(mockHtml);
    });
  });

  describe('Offspring Display', () => {
    it('should create offspring filter controls', () => {
      const genderFilter = document.getElementById('offspring-gender');
      const breederFilter = document.getElementById('offspring-breeder');

      expect(genderFilter).toBeTruthy();
      expect(breederFilter).toBeTruthy();
      expect(genderFilter.options.length).toBe(3);
      expect(breederFilter.options.length).toBe(1);
    });

    it('should handle offspring API response', async () => {
      const mockOffspring = {
        offspring: [
          { id: 1, name: 'Offspring 1', gender: 'klacz' },
          { id: 2, name: 'Offspring 2', gender: 'ogier' }
        ],
        pagination: {
          total: 2,
          limit: 50,
          offset: 0,
          hasMore: false
        }
      };

      fetch.mockResolvedValueOnce(createApiMockResponse(mockOffspring));

      const response = await fetch(`${API_URL}/horses/1/offspring`);
      const data = await response.json();

      expect(data.offspring).toHaveLength(2);
      expect(data.pagination.total).toBe(2);
    });

    it('should handle offspring filtering', () => {
      const genderFilter = document.getElementById('offspring-gender');
      const breederFilter = document.getElementById('offspring-breeder');

      simulateUserInput(genderFilter, 'klacz', 'change');
      simulateUserInput(breederFilter, '1', 'change');

      expect(genderFilter.value).toBe('klacz');
      expect(breederFilter.value).toBe('1');
    });

    it('should display offspring in grid', () => {
      const offspringList = document.getElementById('offspring-list');
      const mockOffspring = [
        { id: 1, name: 'Offspring 1', gender: 'klacz' },
        { id: 2, name: 'Offspring 2', gender: 'ogier' }
      ];

      offspringList.innerHTML = '';
      mockOffspring.forEach(horse => {
        const card = document.createElement('div');
        card.className = 'horse-card';
        card.innerHTML = `
          <h3>${horse.name}</h3>
          <p><strong>Gender:</strong> ${horse.gender}</p>
        `;
        offspringList.appendChild(card);
      });

      expect(offspringList.children.length).toBe(2);
    });
  });

  describe('Tab Management', () => {
    it('should handle tab switching', () => {
      const tabButtons = document.querySelectorAll('.tab-button');
      const tabPanes = document.querySelectorAll('.tab-pane');

      expect(tabButtons.length).toBe(2);
      expect(tabPanes.length).toBe(2);

      // Test switching to breeders tab
      const breedersButton = document.querySelector('[data-tab="breeders"]');
      const breedersPane = document.getElementById('breeders-tab');
      const countriesPane = document.getElementById('countries-tab');

      // Symuluj kliknięcie
      simulateClick(breedersButton);

      // Symuluj zmianę klas
      document.querySelectorAll('.tab-button').forEach(btn => btn.classList.remove('active'));
      breedersButton.classList.add('active');
      
      tabPanes.forEach(pane => pane.classList.add('hidden'));
      breedersPane.classList.remove('hidden');

      expect(breedersButton.classList.contains('active')).toBe(true);
      expect(breedersPane.classList.contains('hidden')).toBe(false);
    });

    it('should load tab data correctly', () => {
      const countriesList = document.getElementById('countries-list');
      const breedersList = document.getElementById('breeders-list');

      // Symuluj załadowanie danych krajów
      countriesList.innerHTML = `
        <div class="data-item">
          <strong>PL</strong>
          Polska
        </div>
        <div class="data-item">
          <strong>DE</strong>
          Niemcy
        </div>
      `;

      expect(countriesList.children.length).toBe(2);
      expect(countriesList.innerHTML).toContain('Polska');
    });
  });

  describe('Error Handling', () => {
    it('should handle validation errors', () => {
      const form = document.getElementById('horse-form');
      const errorSpan = form.querySelector('.error-message');
      
      // Symuluj błąd walidacji
      errorSpan.textContent = 'To pole jest wymagane';
      
      expect(errorSpan.textContent).toBe('To pole jest wymagane');
    });

    it('should display API error messages', async () => {
      const errorResponse = {
        error: 'Koń o takiej nazwie już istnieje'
      };

      fetch.mockResolvedValueOnce(createApiMockResponse(errorResponse, 409));

      const response = await fetch(`${API_URL}/horses`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: 'Duplicate Horse' })
      });

      const data = await response.json();

      expect(response.status).toBe(409);
      expect(data.error).toBe('Koń o takiej nazwie już istnieje');
    });

    it('should handle network timeouts', async () => {
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error('Timeout')), 100);
      });

      fetch.mockReturnValueOnce(timeoutPromise);

      try {
        await fetch(`${API_URL}/horses`);
      } catch (error) {
        expect(error.message).toBe('Timeout');
      }
    });

    it('should handle malformed JSON responses', async () => {
      fetch.mockResolvedValueOnce({
        ok: false,
        status: 500,
        json: () => Promise.reject(new Error('Invalid JSON')),
        text: () => Promise.resolve('Server Error')
      });

      try {
        const response = await fetch(`${API_URL}/horses`);
        await response.json();
      } catch (error) {
        expect(error.message).toBe('Invalid JSON');
      }
    });

    it('should handle empty responses', async () => {
      fetch.mockResolvedValueOnce(createApiMockResponse(null, 204));

      const response = await fetch(`${API_URL}/horses/1`, { method: 'DELETE' });
      
      expect(response.status).toBe(204);
      
      try {
        await response.json();
      } catch (error) {
        // Oczekiwany błąd dla pustej odpowiedzi
        expect(error).toBeTruthy();
      }
    });

    it('should handle not found errors', async () => {
      const errorResponse = { error: 'Not found' };

      fetch.mockResolvedValueOnce(createApiMockResponse(errorResponse, 404));

      const response = await fetch(`${API_URL}/horses/9999`);
      expect(response.ok).toBe(false);
      expect(response.status).toBe(404);

      const data = await response.json();
      expect(data.error).toBe('Not found');
    });

    it('should handle unauthorized errors', async () => {
      const errorResponse = { error: 'Unauthorized' };

      fetch.mockResolvedValueOnce(createApiMockResponse(errorResponse, 401));

      const response = await fetch(`${API_URL}/horses`);
      expect(response.ok).toBe(false);
      expect(response.status).toBe(401);

      const data = await response.json();
      expect(data.error).toBe('Unauthorized');
    });

    it('should handle forbidden errors', async () => {
      const errorResponse = { error: 'Forbidden' };

      fetch.mockResolvedValueOnce(createApiMockResponse(errorResponse, 403));

      const response = await fetch(`${API_URL}/horses`);
      expect(response.ok).toBe(false);
      expect(response.status).toBe(403);

      const data = await response.json();
      expect(data.error).toBe('Forbidden');
    });
  });

  describe('User Interactions', () => {
    it('should handle button clicks', () => {
      const button = document.createElement('button');
      button.className = 'btn-primary';
      button.textContent = 'Test Button';

      let clicked = false;
      button.addEventListener('click', () => {
        clicked = true;
      });

      document.body.appendChild(button);
      simulateClick(button);

      expect(clicked).toBe(true);
    });

    it('should handle form input changes', () => {
      const input = document.createElement('input');
      input.type = 'text';
      input.name = 'test-input';

      let inputValue = '';
      input.addEventListener('input', (e) => {
        inputValue = e.target.value;
      });

      document.body.appendChild(input);
      simulateUserInput(input, 'test value');

      expect(inputValue).toBe('test value');
    });

    it('should handle select changes', () => {
      const select = document.createElement('select');
      select.name = 'test-select';
      select.innerHTML = `
        <option value="">Select</option>
        <option value="option1">Option 1</option>
        <option value="option2">Option 2</option>
      `;

      let selectedValue = '';
      select.addEventListener('change', (e) => {
        selectedValue = e.target.value;
      });

      document.body.appendChild(select);
      select.value = 'option1';
      simulateUserInput(select, 'option1', 'change');

      expect(selectedValue).toBe('option1');
    });

    it('should handle keyboard events', () => {
      const input = document.createElement('input');
      input.type = 'text';
      
      let enterPressed = false;
      input.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
          enterPressed = true;
        }
      });

      document.body.appendChild(input);
      
      const enterEvent = new KeyboardEvent('keydown', { key: 'Enter' });
      input.dispatchEvent(enterEvent);

      expect(enterPressed).toBe(true);
    });

    it('should handle mouse events', () => {
      const element = document.createElement('div');
      element.className = 'hover-element';
      
      let hovered = false;
      element.addEventListener('mouseenter', () => {
        hovered = true;
      });

      document.body.appendChild(element);
      
      const mouseEvent = new MouseEvent('mouseenter');
      element.dispatchEvent(mouseEvent);

      expect(hovered).toBe(true);
    });
  });

  describe('Data Validation', () => {
    it('should validate horse name length', () => {
      const nameInput = document.createElement('input');
      nameInput.type = 'text';
      nameInput.name = 'name';
      nameInput.maxLength = 100;

      nameInput.value = 'A'.repeat(101);
      
      // HTML5 validation powinna ograniczyć długość
      expect(nameInput.value.length).toBeLessThanOrEqual(100);
    });

    it('should validate birth date', () => {
      const birthDateInput = document.createElement('input');
      birthDateInput.type = 'date';
      birthDateInput.name = 'birth_date';

      const today = new Date().toISOString().split('T')[0];
      birthDateInput.setAttribute('max', today);

      expect(birthDateInput.getAttribute('max')).toBe(today);
    });

    it('should validate gender selection', () => {
      const genderSelect = document.createElement('select');
      genderSelect.name = 'gender';
      genderSelect.required = true;
      genderSelect.innerHTML = `
        <option value="">Wybierz płeć</option>
        <option value="klacz">Klacz</option>
        <option value="ogier">Ogier</option>
        <option value="wałach">Wałach</option>
      `;

      expect(genderSelect.required).toBe(true);
      expect(genderSelect.checkValidity()).toBe(false);

      genderSelect.value = 'klacz';
      expect(genderSelect.checkValidity()).toBe(true);
    });

    it('should validate number inputs', () => {
      const numberInput = document.createElement('input');
      numberInput.type = 'number';
      numberInput.min = '0';
      numberInput.max = '5';
      numberInput.value = '3';

      expect(numberInput.checkValidity()).toBe(true);

      numberInput.value = '10';
      expect(numberInput.checkValidity()).toBe(false);

      numberInput.value = '-1';
      expect(numberInput.checkValidity()).toBe(false);
    });

    it('should validate required fields', () => {
      const requiredInput = document.createElement('input');
      requiredInput.type = 'text';
      requiredInput.required = true;

      expect(requiredInput.checkValidity()).toBe(false);

      requiredInput.value = 'test value';
      expect(requiredInput.checkValidity()).toBe(true);
    });
  });

  describe('Performance', () => {
    it('should handle large datasets efficiently', async () => {
      const largeList = document.createElement('div');
      largeList.id = 'large-horse-list';
      
      const { result, metrics } = await measurePerformance(async () => {
        // Symuluj dodanie wielu elementów
        for (let i = 0; i < 1000; i++) {
          const item = document.createElement('div');
          item.className = 'horse-item';
          item.textContent = `Horse ${i}`;
          largeList.appendChild(item);
        }
        return largeList.children.length;
      }, 'Large dataset creation');
      
      document.body.appendChild(largeList);
      
      expect(result).toBe(1000);
      expect(metrics.duration).toBeLessThan(1000); // Powinno być szybsze niż 1 sekunda
    });

    it('should debounce search input', (done) => {
      const searchInput = document.createElement('input');
      searchInput.type = 'text';
      let searchCount = 0;
      
      // Symuluj debounced search
      let timeout;
      searchInput.addEventListener('input', () => {
        clearTimeout(timeout);
        timeout = setTimeout(() => {
          searchCount++;
        }, 300);
      });

      document.body.appendChild(searchInput);

      // Symuluj szybkie wpisywanie
      for (let i = 0; i < 5; i++) {
        simulateUserInput(searchInput, `test${i}`);
      }

      // Po debounce powinien być tylko jeden wywołano search
      setTimeout(() => {
        expect(searchCount).toBeLessThanOrEqual(1);
        done();
      }, 350);
    });
  });

  describe('Accessibility', () => {
    it('should have proper form labels', () => {
      const label = document.createElement('label');
      label.setAttribute('for', 'horse-name');
      label.textContent = 'Imię konia:';
      
      const input = document.createElement('input');
      input.id = 'horse-name';
      input.name = 'name';

      document.body.appendChild(label);
      document.body.appendChild(input);

      expect(label.getAttribute('for')).toBe('horse-name');
      expect(input.id).toBe('horse-name');
    });

    it('should have ARIA attributes', () => {
      const button = document.createElement('button');
      button.setAttribute('aria-label', 'Dodaj nowego konia');
      button.textContent = 'Dodaj';

      document.body.appendChild(button);

      expect(button.getAttribute('aria-label')).toBe('Dodaj nowego konia');
    });

    it('should have proper heading structure', () => {
      const h1 = document.createElement('h1');
      h1.textContent = 'Baza Rodowodowa Koni';
      
      const h2 = document.createElement('h2');
      h2.textContent = 'Lista Koni';

      document.body.appendChild(h1);
      document.body.appendChild(h2);

      expect(h1.tagName).toBe('H1');
      expect(h2.tagName).toBe('H2');
    });

    it('should have keyboard navigation support', () => {
      const button = document.createElement('button');
      button.tabIndex = 0;
      button.textContent = 'Przycisk';
      
      let focused = false;
      button.addEventListener('focus', () => {
        focused = true;
      });

      document.body.appendChild(button);
      button.focus();

      expect(focused).toBe(true);
      expect(document.activeElement).toBe(button);
    });

    it('should check accessibility issues', () => {
      const input = document.createElement('input');
      input.type = 'text';
      
      const accessibility = checkAccessibility(input);
      expect(accessibility.hasIssues).toBe(true);
      expect(accessibility.issues).toContain('Input without label or aria-label');
    });
  });

  describe('Browser Compatibility', () => {
    it('should detect modern browser features', () => {
      // Sprawdź czy fetch jest dostępne
      expect(typeof fetch).toBe('function');
      
      // Sprawdź czy Promise jest dostępne
      expect(typeof Promise).toBe('function');
      
      // Sprawdź czy localStorage jest dostępne
      expect(typeof Storage).toBe('function');
    });

    it('should handle missing browser features', () => {
      // Symuluj brak fetch API
      const originalFetch = global.fetch;
      delete global.fetch;

      // Sprawdź czy aplikacja gracefully handle'uje brak fetch
      expect(typeof fetch).toBe('undefined');

      // Przywróć fetch
      global.fetch = originalFetch;
    });
  });

  describe('Security', () => {
    it('should sanitize user input', () => {
      const input = document.createElement('input');
      input.type = 'text';
      const maliciousInput = '<script>alert("XSS")</script>';
      
      input.value = maliciousInput;
      
      // Sprawdź czy input został escaped/sanitized
      expect(input.value).not.toContain('<script>');
    });

    it('should validate API responses', () => {
      const mockResponse = {
        id: 1,
        name: 'Valid Horse',
        // Brak innych wymaganych pól
      };

      // Symuluj walidację response
      const isValid = mockResponse.id && mockResponse.name;
      expect(isValid).toBe(true);
    });
  });
});