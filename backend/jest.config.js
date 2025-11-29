module.exports = {
  testEnvironment: 'node',
  setupFilesAfterEnv: ['<rootDir>/tests/setup.js'],
  testMatch: [
    '**/tests/**/*.test.js',
    '**/__tests__/**/*.js'
  ],
  collectCoverageFrom: [
    '**/*.js',
    '!**/node_modules/**',
    '!**/tests/**',
    '!**/coverage/**',
    '!**/logs/**',
    '!**/uploads/**',
    '!**/migrations/**',
    '!**/scripts/**',
    '!jest.config.js',
    '!newrelic.js'
  ],
  coverageDirectory: 'coverage',
  coverageReporters: ['text', 'lcov', 'html'],
  coveragePathIgnorePatterns: [
    '/node_modules/',
    '/tests/',
    '/coverage/',
    '/logs/',
    '/uploads/',
    '/migrations/',
    '/scripts/',
    'jest.config.js',
    'newrelic.js'
  ],
  verbose: true,
  testTimeout: 30000,
  forceExit: true,
  clearMocks: true,
  resetMocks: true,
  restoreMocks: true,
  // Executar testes em série para evitar problemas de sincronização do banco
  maxWorkers: 1
};
