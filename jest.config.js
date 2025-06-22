module.exports = {
  // Konfiguracja główna
  testEnvironment: 'node',
  setupFilesAfterEnv: ['<rootDir>/__tests__/setup.js'],
  collectCoverageFrom: [
    'src/**/*.js',
    'public/**/*.js',
    '!src/migrations/**',
    '!src/seeds/**',
    '!**/node_modules/**'
  ],
  coverageDirectory: 'coverage',
  coverageReporters: ['text', 'lcov', 'html'],
  testMatch: [
    '**/__tests__/**/*.test.js'
  ],
  
  // Projekty - backend i frontend
  projects: [
    {
      displayName: 'backend',
      testMatch: ['<rootDir>/__tests__/backend/**/*.test.js'],
      testEnvironment: 'node',
      setupFilesAfterEnv: ['<rootDir>/__tests__/backend/setup.js']
    },
    {
      displayName: 'frontend',
      testMatch: ['<rootDir>/__tests__/frontend/**/*.test.js'],
      testEnvironment: 'jsdom',
      setupFilesAfterEnv: ['<rootDir>/__tests__/frontend/setup.js']
    }
  ],
  
  // Timeouts
  testTimeout: 30000,
  
  // Mock patterns
  moduleNameMapping: {
    '^@/(.*)$': '<rootDir>/src/$1'
  },
  
  // Transform patterns dla ES6
  transform: {
    '^.+\\.js$': 'babel-jest'
  },
  
  // Verbose output
  verbose: true,
  
  // Clear mocks between tests
  clearMocks: true,
  
  // Stop on first failure in CI
  bail: process.env.CI ? 1 : 0
};