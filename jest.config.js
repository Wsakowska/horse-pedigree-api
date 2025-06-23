// jest.config.js
module.exports = {
  testEnvironment: 'node',
  verbose: true,
  collectCoverageFrom: [
    'src/**/*.js',
    '!src/app.js', // Wykluczamy app.js z coverage
    '!src/migrations/**',
    '!src/seeds/**'
  ],
  coverageDirectory: 'coverage',
  coverageReporters: ['text', 'lcov', 'html'],
  setupFilesAfterEnv: [
    '<rootDir>/__tests__/backend/setup.js'
  ],
  testMatch: [
    '**/__tests__/backend/**/*.test.js'
  ],
  testTimeout: 30000,
  forceExit: true,
  detectOpenHandles: true,
  projects: [
    {
      displayName: 'backend',
      testEnvironment: 'node',
      testMatch: ['<rootDir>/__tests__/backend/**/*.test.js'],
      setupFilesAfterEnv: ['<rootDir>/__tests__/backend/setup.js']
    },
    {
      displayName: 'frontend',
      testEnvironment: 'jsdom',
      testMatch: ['<rootDir>/__tests__/frontend/**/*.test.js'],
      setupFilesAfterEnv: ['<rootDir>/__tests__/frontend/setup.js']
    }
  ]
};