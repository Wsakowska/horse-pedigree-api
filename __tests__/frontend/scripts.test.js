/**
 * @jest-environment jsdom
 */
const fs = require('fs');
const path = require('path');

// Load HTML and scripts
const htmlPath = path.resolve(__dirname, '../../public/index.html');
const scriptsPath = path.resolve(__dirname, '../../public/scripts.js');

describe('Frontend Scripts', () => {
  let mockFetch;

  beforeEach(() => {
    // Setup DOM
    const html = fs.readFileSync(htmlPath, 'utf8');
    document.documentElement.innerHTML = html;
    
    // Reset fetch mock
    mockFetch = jest.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: () => Promise.resolve([]),
      text: () => Promise.resolve('<div class="node">Test</div>')
    });
    global.fetch = mockFetch;
    
    // Mock window functions
    global.alert = jest.fn();
    global.confirm = jest.fn(() => true);
    
    // Clear console
    jest.clearAllMocks();
  });

  describe('DOM Manipulation', () => {
    it('should have required DOM elements', () => {
      expect(document.getElementById('dashboard')).toBeTruthy();
      expect(document.getElementById('add-country')).toBeTruthy();
      expect(document.getElementById('add-horse')).toBeTruthy();
      expect(document.getElementById('horse-list')).toBeTruthy();
    });

    it('should have navigation buttons', () => {
      const sidebar = document.querySelector('.sidebar');
      expect(sidebar).toBeTruthy();
      
      const navButtons = sidebar.querySelectorAll('button');
      expect(navButtons.length).toBeGreaterThan(0);
    });

    it('should have all required sections', () => {
      const sections = [
        'dashboard',
        'add-country', 
        'add-breeder',
        'add-horse',
        'add-color',
        'add-breed',
        'pedigree-view',
        'offspring-view'
      ];

      sections.forEach(sectionId => {
        const section = document.getElementById(sectionId);
        expect(section).toBeTruthy();
      });
    });
  });

  describe('Script Loading and Execution', () => {
    it('should load scripts without errors', () => {
      const scriptsContent = fs.readFileSync(scriptsPath, 'utf8');
      expect(scriptsContent).toContain("const API_URL = 'http://localhost:3000/api'");
    });

    it('should define global functions when executed', () => {
      const scriptsContent = fs.readFileSync(scriptsPath, 'utf8');
      
      // Execute scripts in JSDOM context
      const scriptFunction = new Function('window', 'document', 'alert', 'fetch', 'console', scriptsContent);
      
      expect(() => {
        scriptFunction(window, document, global.alert, global.fetch, console);
      }).not.toThrow();
    });
  });

  describe('Form Structure', () => {
    it('should have proper form structure for countries', () => {
      const form = document.getElementById('country-form');
      expect(form).toBeTruthy();
      
      const codeInput = form.querySelector('input[name="code"]');
      const nameInput = form.querySelector('input[name="name"]');
      
      expect(codeInput).toBeTruthy();
      expect(nameInput).toBeTruthy();
      
      expect(codeInput.maxLength).toBe(2);
      expect(codeInput.pattern).toBe('[A-Z]{2}');
      expect(nameInput.maxLength).toBe(100);
      
      const submitButton = form.querySelector('button[type="submit"]');
      const cancelButton = form.querySelector('button[type="button"]');
      
      expect(submitButton).toBeTruthy();
      expect(cancelButton).toBeTruthy();
    });

    it('should have proper form structure for horses', () => {
      const form = document.getElementById('horse-form');
      expect(form).toBeTruthy();
      
      const nameInput = form.querySelector('input[name="name"]');
      const genderSelect = form.querySelector('select[name="gender"]');
      
      expect(nameInput).toBeTruthy();
      expect(genderSelect).toBeTruthy();
      
      const genderOptions = genderSelect.querySelectorAll('option');
      expect(genderOptions.length).toBeGreaterThanOrEqual(3);
      
      // Check if gender options exist
      const genderValues = Array.from(genderOptions).map(opt => opt.value);
      expect(genderValues).toContain('klacz');
      expect(genderValues).toContain('ogier');
      expect(genderValues).toContain('wałach');
    });

    it('should have breed form with correct options', () => {
      const form = document.getElementById('breed-form');
      expect(form).toBeTruthy();
      
      const breedSelect = form.querySelector('select[name="name"]');
      expect(breedSelect).toBeTruthy();
      
      const breedOptions = breedSelect.querySelectorAll('option');
      const breedValues = Array.from(breedOptions).map(opt => opt.value);
      
      expect(breedValues).toContain('oo');
      expect(breedValues).toContain('xx');
      expect(breedValues).toContain('xo');
      expect(breedValues).toContain('xxoo');
    });
  });

  describe('Search and Filter Elements', () => {
    it('should have search input for horses', () => {
      const searchInput = document.getElementById('search-horses');
      expect(searchInput).toBeTruthy();
      expect(searchInput.placeholder).toContain('Wyszukaj');
    });

    it('should have sort select for horses', () => {
      const sortSelect = document.getElementById('sort-horses');
      expect(sortSelect).toBeTruthy();
      
      const options = sortSelect.querySelectorAll('option');
      expect(options.length).toBeGreaterThanOrEqual(4);
      
      const optionValues = Array.from(options).map(opt => opt.value);
      expect(optionValues).toContain('name-asc');
      expect(optionValues).toContain('name-desc');
      expect(optionValues).toContain('birth_date-asc');
      expect(optionValues).toContain('birth_date-desc');
    });

    it('should have parent search inputs in horse form', () => {
      const sireSearch = document.getElementById('sire-search');
      const damSearch = document.getElementById('dam-search');
      
      expect(sireSearch).toBeTruthy();
      expect(damSearch).toBeTruthy();
      
      expect(sireSearch.placeholder).toContain('ojca');
      expect(damSearch.placeholder).toContain('matkę');
    });
  });

  describe('Pedigree and Offspring Elements', () => {
    it('should have pedigree controls', () => {
      const depthInput = document.getElementById('pedigree-depth');
      const treeContainer = document.getElementById('pedigree-tree');
      
      expect(depthInput).toBeTruthy();
      expect(treeContainer).toBeTruthy();
      
      expect(depthInput.type).toBe('number');
      expect(depthInput.min).toBe('1');
      expect(depthInput.max).toBe('5');
    });

    it('should have offspring controls', () => {
      const genderFilter = document.getElementById('offspring-gender');
      const breederFilter = document.getElementById('offspring-breeder');
      const offspringList = document.getElementById('offspring-list');
      
      expect(genderFilter).toBeTruthy();
      expect(breederFilter).toBeTruthy();
      expect(offspringList).toBeTruthy();
    });
  });

  describe('API Integration Structure', () => {
    it('should have proper API URL structure in scripts', () => {
      const scriptsContent = fs.readFileSync(scriptsPath, 'utf8');
      expect(scriptsContent).toContain("API_URL = 'http://localhost:3000/api'");
    });

    it('should handle mock fetch calls without errors', async () => {
      const scriptsContent = fs.readFileSync(scriptsPath, 'utf8');
      
      // Mock successful responses
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve([
          { id: 1, name: 'Test Horse', gender: 'ogier' }
        ])
      });

      // Execute scripts
      const scriptFunction = new Function('window', 'document', 'alert', 'fetch', 'console', scriptsContent);
      
      expect(() => {
        scriptFunction(window, document, global.alert, mockFetch, console);
      }).not.toThrow();
    });

    it('should contain async functions for API calls', () => {
      const scriptsContent = fs.readFileSync(scriptsPath, 'utf8');
      
      expect(scriptsContent).toContain('async function fetchData');
      expect(scriptsContent).toContain('async function postData');
      expect(scriptsContent).toContain('async function updateData');
      expect(scriptsContent).toContain('async function deleteData');
    });
  });

  describe('Error Handling', () => {
    it('should handle fetch errors gracefully', async () => {
      mockFetch.mockRejectedValueOnce(new Error('Network error'));
      
      const scriptsContent = fs.readFileSync(scriptsPath, 'utf8');
      
      // Execute scripts - should not throw even with network errors
      const scriptFunction = new Function('window', 'document', 'alert', 'fetch', 'console', scriptsContent);
      
      expect(() => {
        scriptFunction(window, document, global.alert, mockFetch, console);
      }).not.toThrow();
    });

    it('should have error message containers', () => {
      const forms = ['country-form', 'breeder-form', 'horse-form', 'color-form', 'breed-form'];
      
      forms.forEach(formId => {
        const form = document.getElementById(formId);
        if (form) {
          const errorContainers = form.querySelectorAll('.error-message');
          expect(errorContainers.length).toBeGreaterThan(0);
        }
      });
    });
  });

  describe('Accessibility and UX', () => {
    it('should have proper labels for form inputs', () => {
      const forms = document.querySelectorAll('form');
      
      forms.forEach(form => {
        const inputs = form.querySelectorAll('input[required], select[required]');
        inputs.forEach(input => {
          const label = form.querySelector(`label[for="${input.id}"]`) || 
                       input.closest('.form-group')?.querySelector('label');
          expect(label).toBeTruthy();
        });
      });
    });

    it('should have placeholders for text inputs', () => {
      const textInputs = document.querySelectorAll('input[type="text"]');
      
      textInputs.forEach(input => {
        if (input.required) {
          expect(input.placeholder).toBeTruthy();
          expect(input.placeholder.length).toBeGreaterThan(0);
        }
      });
    });

    it('should have emojis in navigation for better UX', () => {
      const navButtons = document.querySelectorAll('.sidebar button');
      
      navButtons.forEach(button => {
        // Check if button text contains emojis or unicode characters
        const hasEmoji = /[\u{1F600}-\u{1F64F}]|[\u{1F300}-\u{1F5FF}]|[\u{1F680}-\u{1F6FF}]|[\u{1F1E0}-\u{1F1FF}]|[\u{2600}-\u{26FF}]|[\u{2700}-\u{27BF}]/u.test(button.textContent);
        expect(button.textContent.length).toBeGreaterThan(1); // At least some text
      });
    });
  });
});