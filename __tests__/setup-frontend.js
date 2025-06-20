// Setup dla testów frontend - bez bazy danych

// Polyfill dla TextEncoder/TextDecoder
global.TextEncoder = global.TextEncoder || require('util').TextEncoder;
global.TextDecoder = global.TextDecoder || require('util').TextDecoder;

// Mock globalnych funkcji
global.alert = jest.fn();
global.confirm = jest.fn(() => true);
global.fetch = jest.fn(() =>
  Promise.resolve({
    ok: true,
    json: () => Promise.resolve([]),
    text: () => Promise.resolve('<div class="node">Test</div>')
  })
);

// Mock console methods
global.console.error = jest.fn();
global.console.log = jest.fn();

beforeEach(() => {
  jest.clearAllMocks();
});

afterEach(() => {
  jest.resetAllMocks();
});