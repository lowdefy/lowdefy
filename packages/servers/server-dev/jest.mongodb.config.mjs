import config from './jest.config.mjs';

// The *.mongodb.test.mjs suites: real MongoDB through @shelf/jest-mongodb
// (jest-mongodb-config.js), run by pnpm test:mongodb and skipped by pnpm test.
export default {
  ...config,
  collectCoverage: false,
  preset: '@shelf/jest-mongodb',
  testMatch: ['**/*.mongodb.test.mjs'],
  testPathIgnorePatterns: ['/node_modules/'],
};
