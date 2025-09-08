module.exports = {
  testEnvironment: 'node',
  setupFilesAfterEnv: ['<rootDir>/tests/setup.js'],
  testMatch: [
    '**/tests/**/*.test.js',
    '**/__tests__/**/*.js'
  ],
  collectCoverageFrom: [
    "src/**/*.{js,jsx,ts,tsx}",      // ✅ só mede código-fonte
    "!src/**/__tests__/**",          // ignora pasta __tests__
    "!src/**/tests/**",              // ignora pasta tests
    "!src/**/*.test.{js,jsx,ts,tsx}",// ignora arquivos *.test.*
    "!src/**/*.spec.{js,jsx,ts,tsx}",// ignora arquivos *.spec.*
    "!**/node_modules/**",           // por garantia
  ],
  coverageDirectory: 'coverage',
  coverageReporters: ['text', 'lcov', 'html'],
  verbose: true,
  testTimeout: 10000,
  forceExit: true,
  clearMocks: true,
  resetMocks: true,
  restoreMocks: true
};
