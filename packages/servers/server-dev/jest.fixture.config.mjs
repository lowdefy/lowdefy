// Real-Chromium tests over apps/journey-fixture, served by this checkout's dev
// server (`pnpm --filter=@lowdefy/server-dev test:fixture`, after `pnpm build`).
// The fixture files share one server, so they run one at a time.
export default {
  errorOnDeprecated: true,
  globalSetup: '<rootDir>/test/journeyFixture/globalSetup.mjs',
  globalTeardown: '<rootDir>/test/journeyFixture/globalTeardown.mjs',
  maxWorkers: 1,
  testEnvironment: 'node',
  testMatch: ['<rootDir>/test/journeyFixture/**/*.test.mjs'],
  testTimeout: 120000,
  transform: {},
};
