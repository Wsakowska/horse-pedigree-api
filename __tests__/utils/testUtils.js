// __tests__/utils/testUtils.js

/**
 * Funkcje pomocnicze dla testów
 */

// Generator danych testowych
class TestDataGenerator {
  constructor() {
    this.counters = {
      country: 0,
      breeder: 0,
      horse: 0,
      color: 0,
      breed: 0
    };
  }

  reset() {
    Object.keys(this.counters).forEach(key => {
      this.counters[key] = 0;
    });
  }

  generateCountry(overrides = {}) {
    const id = ++this.counters.country;
    return {
      code: `T${id.toString().padStart(1, '0')}`,
      name: `Test Country ${id}`,
      ...overrides
    };
  }

  generateBreeder(overrides = {}) {
    const id = ++this.counters.breeder;
    return {
      name: `Test Breeder ${id}`,
      country_code: 'TC', // Default test country
      ...overrides
    };
  }

  generateHorse(overrides = {}) {
    const id = ++this.counters.horse;
    const genders = ['klacz', 'ogier', 'wałach'];
    const randomGender = genders[Math.floor(Math.random() * genders.length)];
    
    return {
      name: `Test Horse ${id}`,
      gender: randomGender,
      birth_date: '2020-01-01',
      breed_id: 1,
      color_id: 1,
      breeder_id: 1,
      ...overrides
    };
  }

  generateColor(overrides = {}) {
    const id = ++this.counters.color;
    const colors = ['Gniada', 'Kara', 'Siwa', 'Kasztanowata', 'Izabelowata'];
    const randomColor = colors[Math.floor(Math.random() * colors.length)];
    
    return {
      name: `${randomColor} ${id}`,
      ...overrides
    };
  }

  generateBreed(overrides = {}) {
    const breeds = ['oo', 'xx', 'xo', 'xxoo'];
    const randomBreed = breeds[Math.floor(Math.random() * breeds.length)];
    
    return {
      name: randomBreed,
      ...overrides
    };
  }

  // Generator dla rodziny koni
  generateFamily(generations = 2) {
    const family = {};
    
    // Dziadkowie
    if (generations >= 2) {
      family.grandsire = this.generateHorse({ 
        name: 'Grandsire',
        gender: 'ogier' 
      });
      family.granddam = this.generateHorse({ 
        name: 'Granddam',
        gender: 'klacz' 
      });
    }
    
    // Rodzice
    if (generations >= 1) {
      family.sire = this.generateHorse({
        name: 'Sire',
        gender: 'ogier',
        sire_id: family.grandsire?.id,
        dam_id: family.granddam?.id
      });
      family.dam = this.generateHorse({
        name: 'Dam',
        gender: 'klacz'
      });
    }
    
    // Potomek
    family.offspring = this.generateHorse({
      name: 'Offspring',
      gender: 'klacz',
      sire_id: family.sire?.id,
      dam_id: family.dam?.id
    });
    
    return family;
  }
}

// Singleton instance
const testDataGenerator = new TestDataGenerator();

// Helper do tworzenia mock response
const createApiMockResponse = (data, status = 200, headers = {}) => {
  const defaultHeaders = {
    'content-type': 'application/json',
    ...headers
  };

  return {
    ok: status >= 200 && status < 300,
    status,
    statusText: status === 200 ? 'OK' : 'Error',
    headers: defaultHeaders,
    json: () => Promise.resolve(data),
    text: () => Promise.resolve(typeof data === 'string' ? data : JSON.stringify(data))
  };
};

// Helper do symulacji błędów API
const createApiErrorResponse = (message, status = 500, code = null) => {
  const errorData = {
    error: message,
    status,
    timestamp: new Date().toISOString()
  };

  if (code) {
    errorData.code = code;
  }

  return createApiMockResponse(errorData, status);
};

// Helper do testowania asynchronicznych operacji
const waitForCondition = async (condition, timeout = 5000, interval = 100) => {
  const startTime = Date.now();
  
  while (Date.now() - startTime < timeout) {
    if (await condition()) {
      return true;
    }
    await new Promise(resolve => setTimeout(resolve, interval));
  }
  
  throw new Error(`Condition not met within ${timeout}ms`);
};

// Helper do czyszczenia DOM po testach
const cleanupDOM = () => {
  document.body.innerHTML = '';
  document.head.innerHTML = '<meta charset="UTF-8">';
  
  // Reset event listeners
  const newBody = document.createElement('body');
  document.body.parentNode.replaceChild(newBody, document.body);
};

// Helper do tworzenia form data
const createFormData = (data) => {
  const formData = new FormData();
  Object.keys(data).forEach(key => {
    if (data[key] !== null && data[key] !== undefined) {
      formData.append(key, data[key]);
    }
  });
  return formData;
};

// Helper do symulacji user input
const simulateUserInput = (element, value, eventType = 'input') => {
  element.value = value;
  
  const event = new Event(eventType, {
    bubbles: true,
    cancelable: true
  });
  
  Object.defineProperty(event, 'target', {
    value: element,
    enumerable: true
  });
  
  element.dispatchEvent(event);
};

// Helper do symulacji kliknięcia
const simulateClick = (element) => {
  const event = new MouseEvent('click', {
    view: window,
    bubbles: true,
    cancelable: true
  });
  
  element.dispatchEvent(event);
};

// Helper do testowania walidacji formularzy
const validateFormField = (field, value, expectedValid = true) => {
  simulateUserInput(field, value);
  const isValid = field.checkValidity();
  
  return {
    isValid,
    validationMessage: field.validationMessage,
    expectedValid,
    passed: isValid === expectedValid
  };
};

// Helper do tworzenia mock fetch response dla różnych endpointów
const createEndpointMock = (endpoint, data, status = 200) => {
  const mocks = {
    'countries': () => createApiMockResponse(data || [
      { code: 'PL', name: 'Polska' },
      { code: 'DE', name: 'Niemcy' }
    ], status),
    
    'breeds': () => createApiMockResponse(data || [
      { id: 1, name: 'oo' },
      { id: 2, name: 'xx' },
      { id: 3, name: 'xo' },
      { id: 4, name: 'xxoo' }
    ], status),
    
    'colors': () => createApiMockResponse(data || [
      { id: 1, name: 'Gniada' },
      { id: 2, name: 'Kara' },
      { id: 3, name: 'Siwa' }
    ], status),
    
    'breeders': () => createApiMockResponse(data || [
      { id: 1, name: 'Test Breeder', country_code: 'PL' }
    ], status),
    
    'horses': () => createApiMockResponse(data || [
      { 
        id: 1, 
        name: 'Test Horse', 
        gender: 'klacz',
        breed_id: 1,
        color_id: 1,
        breeder_id: 1
      }
    ], status)
  };

  return mocks[endpoint] ? mocks[endpoint]() : createApiMockResponse(data, status);
};

// Helper do testowania paginacji
const createPaginatedResponse = (items, page = 1, limit = 10, total = null) => {
  const startIndex = (page - 1) * limit;
  const endIndex = startIndex + limit;
  const paginatedItems = items.slice(startIndex, endIndex);
  const totalCount = total || items.length;
  
  return {
    data: paginatedItems,
    pagination: {
      page,
      limit,
      total: totalCount,
      pages: Math.ceil(totalCount / limit),
      hasNext: endIndex < totalCount,
      hasPrev: page > 1
    }
  };
};

// Helper do testowania sortowania
const createSortedResponse = (items, sortBy, order = 'asc') => {
  const sortedItems = [...items].sort((a, b) => {
    const valueA = a[sortBy];
    const valueB = b[sortBy];
    
    if (typeof valueA === 'string') {
      return order === 'asc' 
        ? valueA.localeCompare(valueB)
        : valueB.localeCompare(valueA);
    }
    
    if (order === 'asc') {
      return valueA < valueB ? -1 : valueA > valueB ? 1 : 0;
    } else {
      return valueA > valueB ? -1 : valueA < valueB ? 1 : 0;
    }
  });
  
  return sortedItems;
};

// Helper do testowania filtrowania
const createFilteredResponse = (items, filters) => {
  return items.filter(item => {
    return Object.keys(filters).every(key => {
      const filterValue = filters[key];
      const itemValue = item[key];
      
      if (filterValue === '' || filterValue === null || filterValue === undefined) {
        return true;
      }
      
      if (typeof filterValue === 'string' && typeof itemValue === 'string') {
        return itemValue.toLowerCase().includes(filterValue.toLowerCase());
      }
      
      return itemValue === filterValue;
    });
  });
};

// Helper do sprawdzania dostępności
const checkAccessibility = (element) => {
  const issues = [];
  
  // Sprawdź label dla input
  if (element.tagName === 'INPUT' && !element.labels?.length && !element.getAttribute('aria-label')) {
    issues.push('Input without label or aria-label');
  }
  
  // Sprawdź alt dla img
  if (element.tagName === 'IMG' && !element.alt) {
    issues.push('Image without alt text');
  }
  
  // Sprawdź tabindex
  const tabindex = element.getAttribute('tabindex');
  if (tabindex && parseInt(tabindex) > 0) {
    issues.push('Positive tabindex found (should use 0 or -1)');
  }
  
  // Sprawdź contrast (symulacja)
  const styles = getComputedStyle(element);
  const color = styles.color;
  const backgroundColor = styles.backgroundColor;
  
  if (color && backgroundColor && color === backgroundColor) {
    issues.push('Poor color contrast detected');
  }
  
  return {
    hasIssues: issues.length > 0,
    issues
  };
};

// Helper do testowania wydajności
const measurePerformance = async (operation, label = 'Operation') => {
  const startTime = performance.now();
  const startMemory = performance.memory ? performance.memory.usedJSHeapSize : 0;
  
  const result = await operation();
  
  const endTime = performance.now();
  const endMemory = performance.memory ? performance.memory.usedJSHeapSize : 0;
  
  return {
    result,
    metrics: {
      duration: endTime - startTime,
      memoryDelta: endMemory - startMemory,
      label
    }
  };
};

// Helper do debugowania testów
const debugTest = (description, data) => {
  if (process.env.DEBUG_TESTS === 'true') {
    console.log(`[DEBUG] ${description}:`, data);
  }
};

module.exports = {
  TestDataGenerator,
  testDataGenerator,
  createApiMockResponse,
  createApiErrorResponse,
  waitForCondition,
  cleanupDOM,
  createFormData,
  simulateUserInput,
  simulateClick,
  validateFormField,
  createEndpointMock,
  createPaginatedResponse,
  createSortedResponse,
  createFilteredResponse,
  checkAccessibility,
  measurePerformance,
  debugTest
};