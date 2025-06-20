module.exports = {
  testEnvironment: 'node',
  testEnvironmentOptions: {
    customExportConditions: ['node', 'node-addons']
  },
  testMatch: ['**/__tests__/**/*.test.js'],
  coverageDirectory: 'coverage',
  setupFilesAfterEnv: ['<rootDir>/__tests__/setup.js'],
  moduleNameMapper: {
    '\\.(css|less|scss|sass)$': 'identity-obj-proxy'
  },
  transform: {
    '^.+\\.js$': 'babel-jest'
  },
  collectCoverageFrom: [
    'src/**/*.js',
    'public/**/*.js',
    '!src/migrations/**',
    '!src/seeds/**',
    '!**/node_modules/**'
  ],
  coverageThreshold: {
    global: {
      branches: 50,
      functions: 50,
      lines: 50,
      statements: 50
    }
  },
  projects: [
    {
      displayName: 'backend',
      testEnvironment: 'node',
      testMatch: ['**/__tests__/backend/**/*.test.js'],
      setupFilesAfterEnv: ['<rootDir>/__tests__/setup.js'],
      collectCoverageFrom: [
        'src/**/*.js',
        '!src/migrations/**',
        '!src/seeds/**'
      ]
    },
    {
      displayName: 'frontend',
      testEnvironment: 'jsdom',
      testMatch: ['**/__tests__/frontend/**/*.test.js'],
      setupFilesAfterEnv: ['<rootDir>/__tests__/setup.js'],
      collectCoverageFrom: [
        'public/**/*.js'
      ],
      moduleNameMapper: {
        '\\.(css|less|scss|sass)$': 'identity-obj-proxy'
      }
    }
  ],
  // Globalne ustawienia timeoutów
  testTimeout: 30000,
  setupTimeout: 60000
};