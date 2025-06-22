// __tests__/frontend/setup.js
import 'jest-environment-jsdom';

// Mock dla fetch API
global.fetch = jest.fn();

// Mock dla localStorage i sessionStorage
const localStorageMock = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
};

const sessionStorageMock = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
};

Object.defineProperty(window, 'localStorage', {
  value: localStorageMock
});

Object.defineProperty(window, 'sessionStorage', {
  value: sessionStorageMock
});

// Mock dla alert, confirm, prompt
global.alert = jest.fn();
global.confirm = jest.fn();
global.prompt = jest.fn();

// Mock dla console w testach
global.console = {
  ...console,
  log: jest.fn(),
  error: jest.fn(),
  warn: jest.fn(),
  info: jest.fn()
};

// Setup DOM przed każdym testem
beforeEach(() => {
  // Wyczyść DOM
  document.body.innerHTML = '';
  document.head.innerHTML = '';
  
  // Reset wszystkich mocków
  jest.clearAllMocks();
  
  // Reset fetch mock
  fetch.mockClear();
  
  // Reset localStorage/sessionStorage
  localStorageMock.getItem.mockClear();
  localStorageMock.setItem.mockClear();
  localStorageMock.removeItem.mockClear();
  localStorageMock.clear.mockClear();
  
  sessionStorageMock.getItem.mockClear();
  sessionStorageMock.setItem.mockClear();
  sessionStorageMock.removeItem.mockClear();
  sessionStorageMock.clear.mockClear();
  
  // Reset alert/confirm
  alert.mockClear();
  confirm.mockClear();
});

// Funkcje pomocnicze dla testów frontendu
global.createMockResponse = (data, status = 200) => {
  return Promise.resolve({
    ok: status >= 200 && status < 300,
    status,
    statusText: status === 200 ? 'OK' : 'Error',
    json: () => Promise.resolve(data),
    text: () => Promise.resolve(JSON.stringify(data))
  });
};

global.createMockError = (message, status = 500) => {
  return Promise.reject(new Error(message));
};

// Helper do tworzenia HTML elementów dla testów
global.createTestElement = (tag, attributes = {}, innerHTML = '') => {
  const element = document.createElement(tag);
  
  Object.keys(attributes).forEach(key => {
    element.setAttribute(key, attributes[key]);
  });
  
  if (innerHTML) {
    element.innerHTML = innerHTML;
  }
  
  return element;
};

// Helper do tworzenia formularza testowego
global.createTestForm = (id, fields = []) => {
  const form = createTestElement('form', { id });
  
  fields.forEach(field => {
    const input = createTestElement('input', {
      type: field.type || 'text',
      name: field.name,
      id: field.id || field.name,
      value: field.value || '',
      required: field.required || false
    });
    
    const errorSpan = createTestElement('span', { 
      class: 'error-message' 
    });
    
    const div = createTestElement('div', { class: 'form-group' });
    div.appendChild(input);
    div.appendChild(errorSpan);
    
    form.appendChild(div);
  });
  
  return form;
};

// Helper do symulacji eventów
global.fireEvent = (element, eventType, eventInit = {}) => {
  const event = new Event(eventType, { bubbles: true, ...eventInit });
  element.dispatchEvent(event);
};

// Helper do oczekiwania na async operacje
global.waitFor = (callback, timeout = 1000) => {
  return new Promise((resolve, reject) => {
    const startTime = Date.now();
    
    const check = () => {
      try {
        const result = callback();
        if (result) {
          resolve(result);
        } else if (Date.now() - startTime > timeout) {
          reject(new Error('Timeout waiting for condition'));
        } else {
          setTimeout(check, 10);
        }
      } catch (error) {
        if (Date.now() - startTime > timeout) {
          reject(error);
        } else {
          setTimeout(check, 10);
        }
      }
    };
    
    check();
  });
};