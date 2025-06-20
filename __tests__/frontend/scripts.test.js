/**
 * @jest-environment jsdom
 */
const fs = require('fs');
const path = require('path');
const { JSDOM } = require('jsdom');

// Load HTML
const html = fs.readFileSync(path.resolve(__dirname, '../../public/index.html'), 'utf8');

// Mock scripts.js module
jest.mock('../../public/scripts.js', () => {
  const originalModule = jest.requireActual('../../public/scripts.js');
  return {
    ...originalModule,
    fetchData: jest.fn(),
    showSection: originalModule.showSection,
    resetForm: originalModule.resetForm,
    validateForm: originalModule.validateForm,
    loadHorses: originalModule.loadHorses
  };
});

const scripts = require('../../public/scripts.js');

describe('Frontend Scripts', () => {
  let dom;
  let document;

  beforeEach(() => {
    dom = new JSDOM(html, { runScripts: 'dangerously', resources: 'usable' });
    document = dom.window.document;
    global.document = document;
    global.window = dom.window;
    global.alert = jest.fn();
    global.fetch = jest.fn(() =>
      Promise.resolve({
        ok: true,
        json: () => Promise.resolve([]),
        text: () => Promise.resolve('<div class="node">Test</div>')
      })
    );

    // Inject scripts.js functions into the DOM
    Object.assign(dom.window, scripts);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('przełącza sekcje', () => {
    scripts.showSection('add-country');
    expect(document.getElementById('dashboard').classList.contains('hidden')).toBe(true);
    expect(document.getElementById('add-country').classList.contains('active')).toBe(true);
  });

  it('resetuje formularz', () => {
    const form = document.getElementById('country-form');
    form.querySelector('input[name="code"]').value = 'PL';
    scripts.resetForm('country-form');
    expect(form.querySelector('input[name="code"]').value).toBe('');
    expect(form.querySelector('.error-message').textContent).toBe('');
  });

  it('waliduje formularz', () => {
    const form = document.getElementById('country-form');
    form.querySelector('input[name="code"]').value = '';
    const isValid = scripts.validateForm('country-form');
    expect(isValid).toBe(false);
    expect(form.querySelector('.error-message').textContent).toContain('nieprawidłowe dane');
  });

  it('ładuje konie', async () => {
    scripts.fetchData
      .mockResolvedValueOnce([{ id: 1, name: 'Bucefał', breed_id: 1, gender: 'ogier', color_id: 1, breeder_id: 1 }])
      .mockResolvedValueOnce([{ id: 1, name: 'oo' }])
      .mockResolvedValueOnce([{ id: 1, name: 'Gniada' }])
      .mockResolvedValueOnce([{ id: 1, name: 'Hodowla XYZ' }]);

    await scripts.loadHorses();
    const horseList = document.getElementById('horse-list');
    expect(horseList.children).toHaveLength(1);
    expect(horseList.querySelector('.horse-card h3').textContent).toBe('Bucefał');
  });
});