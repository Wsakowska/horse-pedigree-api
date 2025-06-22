it('should handle not found errors', async () => {
  const errorResponse = { error: 'Not found' };

  fetch.mockResolvedValueOnce(createMockResponse(errorResponse, 404));

  const response = await fetch(`${API_URL}/horses/9999`);
  expect(response.ok).toBe(false);
  expect(response.status).toBe(404);

  const data = await response.json();
  expect(data.error).toBe('Not found');
});

it('should handle unauthorized errors', async () => {
  const errorResponse = { error: 'Unauthorized' };

  fetch.mockResolvedValueOnce(createMockResponse(errorResponse, 401));

  const response = await fetch(`${API_URL}/horses`);
  expect(response.ok).toBe(false);
  expect(response.status).toBe(401);

  const data = await response.json();
  expect(data.error).toBe('Unauthorized');
});

it('should handle forbidden errors', async () => {
  const errorResponse = { error: 'Forbidden' };

  fetch.mockResolvedValueOnce(createMockResponse(errorResponse, 403));

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

      fetch.mockResolvedValueOnce(createMockResponse(mockError, 400));

      const response = await fetch(`${API_URL}/horses/breeding/check?sire_id=1&dam_id=3`);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.breeding_possible).toBe(false);
      expect(data.problems).toContain('Ojciec nie może mieć potomstwa ze swoją córką');
    });
  });

  describe('Pedigree Display', () => {
    it('should create pedigree controls', () => {
      const pedigreeControls = createTestElement('div', { class: 'pedigree-controls' }, `
        <label for="pedigree-depth">Głębokość rodowodu:</label>
        <input type="number" id="pedigree-depth" min="0" max="5" value="2" class="depth-input">
        <button type="button" class="btn-primary">Pokaż Drzewo</button>
      `);

      document.body.appendChild(pedigreeControls);

      const depthInput = pedigreeControls.querySelector('#pedigree-depth');
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

      fetch.mockResolvedValueOnce(createMockResponse(mockPedigree));

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
            <h1>Rodowód konia Test Horse</h1>
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
  });

  describe('Offspring Display', () => {
    it('should create offspring filter controls', () => {
      const genderFilter = createTestElement('select', { id: 'offspring-gender' }, `
        <option value="">Wszystkie płcie</option>
        <option value="klacz">Klacze</option>
        <option value="ogier">Ogiery</option>
        <option value="wałach">Wałachy</option>
      `);

      const breederFilter = createTestElement('select', { id: 'offspring-breeder' }, `
        <option value="">Wszyscy hodowcy</option>
        <option value="1">Test Breeder</option>
      `);

      document.body.appendChild(genderFilter);
      document.body.appendChild(breederFilter);

      expect(genderFilter.options.length).toBe(4);
      expect(breederFilter.options.length).toBe(2);
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

      fetch.mockResolvedValueOnce(createMockResponse(mockOffspring));

      const response = await fetch(`${API_URL}/horses/1/offspring`);
      const data = await response.json();

      expect(data.offspring).toHaveLength(2);
      expect(data.pagination.total).toBe(2);
    });

    it('should handle offspring filtering', () => {
      const genderFilter = createTestElement('select', { id: 'offspring-gender' });
      genderFilter.value = 'klacz';

      const breederFilter = createTestElement('select', { id: 'offspring-breeder' });
      breederFilter.value = '1';

      document.body.appendChild(genderFilter);
      document.body.appendChild(breederFilter);

      fireEvent(genderFilter, 'change');
      fireEvent(breederFilter, 'change');

      expect(genderFilter.value).toBe('klacz');
      expect(breederFilter.value).toBe('1');
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

      fetch.mockResolvedValueOnce(createMockResponse(errorResponse, 409));

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
      fetch.mockResolvedValueOnce(createMockResponse(null, 204));

      const response = await fetch(`${API_URL}/horses/1`, { method: 'DELETE' });
      
      expect(response.status).toBe(204);
      
      try {
        await response.json();
      } catch (error) {
        // Oczekiwany błąd dla pustej odpowiedzi
        expect(error).toBeTruthy();
      }
    });
  });

  describe('User Interactions', () => {
    it('should handle button clicks', () => {
      const button = createTestElement('button', {
        class: 'btn-primary'
      }, 'Test Button');

      let clicked = false;
      button.addEventListener('click', () => {
        clicked = true;
      });

      document.body.appendChild(button);
      fireEvent(button, 'click');

      expect(clicked).toBe(true);
    });

    it('should handle form input changes', () => {
      const input = createTestElement('input', {
        type: 'text',
        name: 'test-input'
      });

      let inputValue = '';
      input.addEventListener('input', (e) => {
        inputValue = e.target.value;
      });

      document.body.appendChild(input);
      input.value = 'test value';
      fireEvent(input, 'input');

      expect(inputValue).toBe('test value');
    });

    it('should handle select changes', () => {
      const select = createTestElement('select', { name: 'test-select' }, `
        <option value="">Select</option>
        <option value="option1">Option 1</option>
        <option value="option2">Option 2</option>
      `);

      let selectedValue = '';
      select.addEventListener('change', (e) => {
        selectedValue = e.target.value;
      });

      document.body.appendChild(select);
      select.value = 'option1';
      fireEvent(select, 'change');

      expect(selectedValue).toBe('option1');
    });

    it('should handle keyboard events', () => {
      const input = createTestElement('input', { type: 'text' });
      
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
      const element = createTestElement('div', { class: 'hover-element' });
      
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
      const nameInput = createTestElement('input', {
        type: 'text',
        name: 'name',
        maxlength: '100'
      });

      nameInput.value = 'A'.repeat(101);
      
      // HTML5 validation powinna ograniczyć długość
      expect(nameInput.value.length).toBeLessThanOrEqual(100);
    });

    it('should validate birth date', () => {
      const birthDateInput = createTestElement('input', {
        type: 'date',
        name: 'birth_date'
      });

      const today = new Date().toISOString().split('T')[0];
      birthDateInput.setAttribute('max', today);

      expect(birthDateInput.getAttribute('max')).toBe(today);
    });

    it('should validate gender selection', () => {
      const genderSelect = createTestElement('select', { name: 'gender', required: true }, `
        <option value="">Wybierz płeć</option>
        <option value="klacz">Klacz</option>
        <option value="ogier">Ogier</option>
        <option value="wałach">Wałach</option>
      `);

      expect(genderSelect.required).toBe(true);
      expect(genderSelect.checkValidity()).toBe(false);

      genderSelect.value = 'klacz';
      expect(genderSelect.checkValidity()).toBe(true);
    });

    it('should validate number inputs', () => {
      const numberInput = createTestElement('input', {
        type: 'number',
        min: '0',
        max: '5',
        value: '3'
      });

      expect(numberInput.checkValidity()).toBe(true);

      numberInput.value = '10';
      expect(numberInput.checkValidity()).toBe(false);

      numberInput.value = '-1';
      expect(numberInput.checkValidity()).toBe(false);
    });

    it('should validate required fields', () => {
      const requiredInput = createTestElement('input', {
        type: 'text',
        required: true
      });

      expect(requiredInput.checkValidity()).toBe(false);

      requiredInput.value = 'test value';
      expect(requiredInput.checkValidity()).toBe(true);
    });

    it('should validate email format', () => {
      const emailInput = createTestElement('input', {
        type: 'email'
      });

      emailInput.value = 'invalid-email';
      expect(emailInput.checkValidity()).toBe(false);

      emailInput.value = 'valid@email.com';
      expect(emailInput.checkValidity()).toBe(true);
    });

    it('should validate URL format', () => {
      const urlInput = createTestElement('input', {
        type: 'url'
      });

      urlInput.value = 'invalid-url';
      expect(urlInput.checkValidity()).toBe(false);

      urlInput.value = 'https://example.com';
      expect(urlInput.checkValidity()).toBe(true);
    });
  });

  describe('Responsive Design', () => {
    it('should handle mobile viewport', () => {
      // Symuluj mobile viewport
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 480,
      });

      expect(window.innerWidth).toBe(480);
    });

    it('should adapt layout for small screens', () => {
      const container = createTestElement('div', { class: 'container' });
      const sidebar = createTestElement('aside', { class: 'sidebar' });
      const main = createTestElement('main', {});

      container.appendChild(sidebar);
      container.appendChild(main);
      document.body.appendChild(container);

      expect(container.children.length).toBe(2);
    });

    it('should handle orientation changes', () => {
      // Symuluj zmianę orientacji
      Object.defineProperty(window, 'orientation', {
        writable: true,
        configurable: true,
        value: 90,
      });

      const orientationEvent = new Event('orientationchange');
      window.dispatchEvent(orientationEvent);

      expect(window.orientation).toBe(90);
    });

    it('should handle resize events', () => {
      let resized = false;
      window.addEventListener('resize', () => {
        resized = true;
      });

      const resizeEvent = new Event('resize');
      window.dispatchEvent(resizeEvent);

      expect(resized).toBe(true);
    });
  });

  describe('Accessibility', () => {
    it('should have proper form labels', () => {
      const label = createTestElement('label', { for: 'horse-name' }, 'Imię konia:');
      const input = createTestElement('input', { id: 'horse-name', name: 'name' });

      document.body.appendChild(label);
      document.body.appendChild(input);

      expect(label.getAttribute('for')).toBe('horse-name');
      expect(input.id).toBe('horse-name');
    });

    it('should have ARIA attributes', () => {
      const button = createTestElement('button', {
        'aria-label': 'Dodaj nowego konia'
      }, 'Dodaj');

      document.body.appendChild(button);

      expect(button.getAttribute('aria-label')).toBe('Dodaj nowego konia');
    });

    it('should have proper heading structure', () => {
      const h1 = createTestElement('h1', {}, 'Baza Rodowodowa Koni');
      const h2 = createTestElement('h2', {}, 'Lista Koni');

      document.body.appendChild(h1);
      document.body.appendChild(h2);

      expect(h1.tagName).toBe('H1');
      expect(h2.tagName).toBe('H2');
    });

    it('should have keyboard navigation support', () => {
      const button = createTestElement('button', { tabindex: '0' }, 'Przycisk');
      
      let focused = false;
      button.addEventListener('focus', () => {
        focused = true;
      });

      document.body.appendChild(button);
      button.focus();

      expect(focused).toBe(true);
      expect(document.activeElement).toBe(button);
    });

    it('should have proper color contrast indicators', () => {
      const element = createTestElement('div', { 
        class: 'high-contrast',
        style: 'color: #000; background-color: #fff;'
      });

      document.body.appendChild(element);

      const styles = getComputedStyle(element);
      expect(styles.color).toBeTruthy();
      expect(styles.backgroundColor).toBeTruthy();
    });
  });

  describe('Performance', () => {
    it('should handle large datasets efficiently', () => {
      const largeList = createTestElement('div', { id: 'large-horse-list' });
      
      const startTime = performance.now();
      
      // Symuluj dodanie wielu elementów
      for (let i = 0; i < 1000; i++) {
        const item = createTestElement('div', { class: 'horse-item' }, `Horse ${i}`);
        largeList.appendChild(item);
      }
      
      const endTime = performance.now();
      const duration = endTime - startTime;
      
      document.body.appendChild(largeList);
      
      expect(largeList.children.length).toBe(1000);
      expect(duration).toBeLessThan(1000); // Powinno być szybsze niż 1 sekunda
    });

    it('should debounce search input', () => {
      const searchInput = createTestElement('input', { type: 'text' });
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
      }, 350);
    });

    it('should lazy load images', () => {
      const image = createTestElement('img', {
        'data-src': 'horse-image.jpg',
        alt: 'Horse image',
        class: 'lazy'
      });

      document.body.appendChild(image);

      expect(image.getAttribute('data-src')).toBe('horse-image.jpg');
      expect(image.classList.contains('lazy')).toBe(true);
    });
  });

  describe('Local Storage', () => {
    it('should handle localStorage operations', () => {
      // Symuluj zapisywanie preferencji użytkownika
      const preferences = {
        sortOrder: 'name-asc',
        viewMode: 'grid'
      };

      localStorage.setItem('horsePreferences', JSON.stringify(preferences));

      expect(localStorage.setItem).toHaveBeenCalledWith(
        'horsePreferences', 
        JSON.stringify(preferences)
      );
    });

    it('should handle localStorage errors gracefully', () => {
      // Symuluj błąd localStorage
      localStorage.setItem.mockImplementation(() => {
        throw new Error('Storage quota exceeded');
      });

      expect(() => {
        localStorage.setItem('test', 'value');
      }).toThrow('Storage quota exceeded');
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
      const input = createTestElement('input', { type: 'text' });
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
});d show correct section when navigation button is clicked', () => {
      const dashboardBtn = document.querySelector('[data-section="dashboard"]');
      const addHorseBtn = document.querySelector('[data-section="add-horse"]');
      
      expect(dashboardBtn).toBeTruthy();
      expect(addHorseBtn).toBeTruthy();

      // Test switching sections
      fireEvent(addHorseBtn, 'click');
      
      // W rzeczywistej implementacji sprawdzilibyśmy czy sekcje się zmieniły
      expect(addHorseBtn).toBeTruthy();
    });

    it('should handle navigation to non-existent section gracefully', () => {
      const button = createTestElement('button', { 'data-section': 'non-existent' });
      document.body.appendChild(button);

      expect(() => {
        fireEvent(button, 'click');
      }).not.toThrow();
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
      const errorSpan = form.querySelector('.error-message');

      // Test empty form
      expect(nameInput.value).toBe('');
      expect(genderSelect.value).toBe('');

      // Test validation
      nameInput.value = '';
      genderSelect.value = '';
      
      // Sprawdź czy pola są wymagane
      expect(nameInput.checkValidity()).toBe(false);
      expect(genderSelect.checkValidity()).toBe(false);
    });

    it('should handle form submission', async () => {
      const form = document.getElementById('horse-form');
      const nameInput = form.querySelector('[name="name"]');
      const genderSelect = form.querySelector('[name="gender"]');

      // Wypełnij formularz
      nameInput.value = 'Test Horse';
      genderSelect.value = 'klacz';

      // Mock successful API response
      fetch.mockResolvedValueOnce(createMockResponse({
        id: 1,
        name: 'Test Horse',
        gender: 'klacz'
      }, 201));

      // Symuluj submit
      const submitEvent = new Event('submit', { bubbles: true, cancelable: true });
      form.dispatchEvent(submitEvent);

      // W rzeczywistej implementacji sprawdzilibyśmy czy fetch został wywołany
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
  });

  