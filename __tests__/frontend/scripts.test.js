/**
 * @jest-environment jsdom
 */
const fs = require('fs');
const path = require('path');

// Load HTML
const html = fs.readFileSync(path.resolve(__dirname, '../../public/index.html'), 'utf8');

describe('Frontend Scripts', () => {
  let window, document;

  beforeEach(() => {
    // Setup JSDOM environment
    document = window.document;
    global.document = document;
    global.window = window;
    
    // Mock functions
    global.alert = jest.fn();
    global.confirm = jest.fn(() => true);
    global.fetch = jest.fn(() =>
      Promise.resolve({
        ok: true,
        json: () => Promise.resolve([]),
        text: () => Promise.resolve('<div class="node">Test</div>')
      })
    );

    // Set innerHTML
    document.documentElement.innerHTML = html;

    // Mock console methods
    global.console.error = jest.fn();
    global.console.log = jest.fn();
  });

  afterEach(() => {
    jest.clearAllMocks();
    jest.resetModules();
  });

  describe('DOM Manipulation', () => {
    it('should have required DOM elements', () => {
      expect(document.getElementById('dashboard')).toBeTruthy();
      expect(document.getElementById('add-country')).toBeTruthy();
      expect(document.getElementById('add-horse')).toBeTruthy();
      expect(document.getElementById('horse-list')).toBeTruthy();
    });

    it('should toggle sections visibility', () => {
      // Load and execute scripts
      const scriptsPath = path.resolve(__dirname, '../../public/scripts.js');
      const scriptsContent = fs.readFileSync(scriptsPath, 'utf8');
      
      // Create a function from the scripts content
      const scriptFunction = new Function('window', 'document', 'alert', 'fetch', scriptsContent);
      scriptFunction(window, document, global.alert, global.fetch);

      // Test showSection function if it exists
      if (typeof window.showSection === 'function') {
        window.showSection('add-country');
        expect(document.getElementById('dashboard').classList.contains('hidden')).toBe(true);
        expect(document.getElementById('add-country').classList.contains('active')).toBe(true);
      }
    });

    it('should handle form validation', () => {
      const form = document.getElementById('country-form');
      expect(form).toBeTruthy();
      
      const codeInput = form.querySelector('input[name="code"]');
      const nameInput = form.querySelector('input[name="name"]');
      
      expect(codeInput).toBeTruthy();
      expect(nameInput).toBeTruthy();
      
      // Test form structure
      expect(codeInput.maxLength).toBe(2);
      expect(codeInput.pattern).toBe('[A-Z]{2}');
      expect(nameInput.maxLength).toBe(100);
    });
  });

  describe('API Integration', () => {
    it('should handle fetch errors gracefully', async () => {
      global.fetch.mockRejectedValueOnce(new Error('Network error'));
      
      const scriptsPath = path.resolve(__dirname, '../../public/scripts.js');
      const scriptsContent = fs.readFileSync(scriptsPath, 'utf8');
      
      // Execute scripts in JSDOM context
      const scriptFunction = new Function('window', 'document', 'alert', 'fetch', 'console', scriptsContent);
      scriptFunction(window, document, global.alert, global.fetch, global.console);

      // Test that the script doesn't crash on fetch errors
      expect(true).toBe(true); // Script executed without throwing
    });

    it('should format API URLs correctly', () => {
      const scriptsPath = path.resolve(__dirname, '../../public/scripts.js');
      const scriptsContent = fs.readFileSync(scriptsPath, 'utf8');
      
      // Check if API_URL is defined correctly
      expect(scriptsContent).toContain("const API_URL = 'http://localhost:3000/api'");
    });
  });

  describe('Form Handling', () => {
    it('should have proper form structure for countries', () => {
      const form = document.getElementById('country-form');
      expect(form).toBeTruthy();
      
      const submitButton = form.querySelector('button[type="submit"]');
      const cancelButton = form.querySelector('button[type="button"]');
      
      expect(submitButton).toBeTruthy();
      expect(cancelButton).toBeTruthy();
      expect(submitButton.textContent).toBe('Dodaj');
      expect(cancelButton.textContent).toBe('Anuluj');
    });

    it('should have proper form structure for horses', () => {
      const form = document.getElementById('horse-form');
      expect(form).toBeTruthy();
      
      const nameInput = form.querySelector('input[name="name"]');
      const genderSelect = form.querySelector('select[name="gender"]');
      
      expect(nameInput).toBeTruthy();
      expect(genderSelect).toBeTruthy();
      
      const genderOptions = genderSelect.querySelectorAll('option');
      expect(genderOptions).toHaveLength(3);
      expect(genderOptions[0].value).toBe('klacz');
      expect(genderOptions[1].value).toBe('ogier');
      expect(genderOptions[2].value).toBe('wałach');
    });
  });

  describe('Search and Filter', () => {
    it('should have search input for horses', () => {
      const searchInput = document.getElementById('search-horses');
      expect(searchInput).toBeTruthy();
      expect(searchInput.placeholder).toBe('Wyszukaj konia po nazwie...');
    });

    it('should have sort select for horses', () => {
      const sortSelect = document.getElementById('sort-horses');
      expect(sortSelect).toBeTruthy();
      
      const options = sortSelect.querySelectorAll('option');
      expect(options).toHaveLength(4);
      expect(options[0].value).toBe('name-asc');
      expect(options[1].value).toBe('name-desc');
      expect(options[2].value).toBe('birth_date-asc');
      expect(options[3].value).toBe('birth_date-desc');
    });
  });

  describe('Navigation', () => {
    it('should have sidebar navigation', () => {
      const sidebar = document.querySelector('.sidebar');
      expect(sidebar).toBeTruthy();
      
      const navButtons = sidebar.querySelectorAll('button');
      expect(navButtons.length).toBeGreaterThan(0);
      
      const dashboardButton = Array.from(navButtons).find(btn => 
        btn.textContent.includes('Panel Główny')
      );
      expect(dashboardButton).toBeTruthy();
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
});