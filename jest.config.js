module.exports = {
  testEnvironment: 'node',
  testMatch: ['**/__tests__/**/*.test.js'],
  coverageDirectory: 'coverage',
  collectCoverageFrom: [
    'src/**/*.js',
    'public/**/*.js',
    '!src/migrations/**',
    '!src/seeds/**',
    '!**/node_modules/**'
  ],
  coverageThreshold: {
    global: {
      branches: 15,
      functions: 15,
      lines: 15,
      statements: 15
    }
  },
  testTimeout: 45000, // Globalne ustawienie timeout
  maxWorkers: 1, // Testy sekwencyjnie
  verbose: true,
  forceExit: true,
  detectOpenHandles: true,
  projects: [
    {
      displayName: 'backend',
      testEnvironment: 'node',
      testMatch: ['**/__tests__/backend/**/*.test.js'],
      setupFilesAfterEnv: ['<rootDir>/__tests__/setup-backend.js'],
      collectCoverageFrom: [
        'src/**/*.js',
        '!src/migrations/**',
        '!src/seeds/**'
      ],
      maxWorkers: 1
    },
    {
      displayName: 'frontend',
      testEnvironment: 'jsdom',
      testMatch: ['**/__tests__/frontend/**/*.test.js'],
      setupFilesAfterEnv: ['<rootDir>/__tests__/setup-frontend.js'],
      collectCoverageFrom: [
        'public/**/*.js'
      ],
      moduleNameMapper: { // Poprawna nazwa opcji
        '\\.(css|less|scss|sass)$': 'identity-obj-proxy'
      }
    }
  ]
};