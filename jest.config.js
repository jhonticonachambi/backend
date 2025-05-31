module.exports = {
  testEnvironment: 'node',
  setupFilesAfterEnv: ['<rootDir>/tests/setup.js'],
  testMatch: [
    '**/tests/**/*.test.js',
    '**/tests/**/*.spec.js'
  ],
  collectCoverageFrom: [
    'controllers/**/*.js',
    'models/**/*.js',
    'routes/**/*.js',
    'middleware/**/*.js',
    '!**/node_modules/**'
  ],
  coverageDirectory: 'coverage',
  coverageReporters: ['text', 'lcov', 'html'],
  reporters: [
    'default',
    [
      'jest-html-reporter',
      {
        pageTitle: 'Test Report - Sistema de Voluntariado',
        outputPath: 'test-report.html',
        includeFailureMsg: true,
        includeSuiteFailure: true
      }
    ]
  ],  verbose: true,
  testTimeout: 10000,
  // Configuración para evitar warnings de procesos
  forceExit: true,
  detectOpenHandles: true
};
