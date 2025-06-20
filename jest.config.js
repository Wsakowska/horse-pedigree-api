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
     projects: [
       {
         displayName: 'backend',
         testEnvironment: 'node',
         testMatch: ['**/__tests__/backend/**/*.test.js'],
         setupFilesAfterEnv: ['<rootDir>/__tests__/setup.js']
       },
       {
         displayName: 'frontend',
         testEnvironment: 'jsdom',
         testMatch: ['**/__tests__/frontend/**/*.test.js'],
         setupFilesAfterEnv: ['<rootDir>/__tests__/setup.js']
       }
     ]
   };