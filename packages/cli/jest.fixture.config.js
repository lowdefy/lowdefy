// Real-Chromium tests over apps/journey-fixture, served by this checkout's dev
// server (`pnpm --filter=lowdefy test:fixture`, after `pnpm build`). They
// drive the built CLI (dist/index.js) against that server, one at a time.
export default {
  errorOnDeprecated: true,
  globalSetup: '<rootDir>/test/journeyFixture/globalSetup.mjs',
  globalTeardown: '<rootDir>/test/journeyFixture/globalTeardown.mjs',
  maxWorkers: 1,
  testEnvironment: 'node',
  testMatch: ['<rootDir>/test/journeyFixture/**/*.test.mjs'],
  testTimeout: 300000,
  transform: {},
};
