// Setup dla testów frontend - bez bazy danych

// Mock globalnych funkcji
global.alert = jest.fn();
global.confirm = jest.fn(() => true);
global.fetch = jest.fn();

// Mock console methods tylko jeśli potrzebne
const originalConsoleError = console.error;
const originalConsoleLog = console.log;

beforeEach(() => {
  // Reset wszystkich mock'ów
  jest.clearAllMocks();
  
  // Setup domyślnych odpowiedzi fetch
  global.fetch.mockResolvedValue({
    ok: true,
    status: 200,
    json: () => Promise.resolve([]),
    text: () => Promise.resolve('<div class="node">Test</div>')
  });
});

afterEach(() => {
  jest.resetAllMocks();
});

afterAll(() => {
  // Przywróć oryginalne console methods
  console.error = originalConsoleError;
  console.log = originalConsoleLog;
});