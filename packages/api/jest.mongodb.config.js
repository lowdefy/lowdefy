import config from './jest.config.js';

// The *.mongodb.test.js suites: real MongoDB through @shelf/jest-mongodb
// (jest-mongodb-config.js), run by pnpm test:mongodb and skipped by pnpm test.
export default {
  ...config,
  collectCoverage: false,
  preset: '@shelf/jest-mongodb',
  testMatch: ['<rootDir>/src/**/*.mongodb.test.js'],
  testPathIgnorePatterns: ['<rootDir>/dist/'],
};
