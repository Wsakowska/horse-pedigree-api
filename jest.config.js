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
      branches: 20,
      functions: 20,
      lines: 20,
      statements: 20
    }
  },
  testTimeout: 30000,
  // Uruchom testy SEKWENCYJNIE, nie równolegle
  maxWorkers: 1,
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
      moduleNameMapper: {
        '^../config/db$': '<rootDir>/__tests__/mocks/db.js'
      },
      // Testy backendu również sekwencyjnie
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
      moduleNameMapper: {
        '\\.(css|less|scss|sass)$': 'identity-obj-proxy'
      }
    }
  ]
};