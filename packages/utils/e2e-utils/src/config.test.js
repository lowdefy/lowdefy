/*
  Copyright 2020-2026 Lowdefy, Inc

  Licensed under the Apache License, Version 2.0 (the "License");
  you may not use this file except in compliance with the License.
  You may obtain a copy of the License at

      http://www.apache.org/licenses/LICENSE-2.0

  Unless required by applicable law or agreed to in writing, software
  distributed under the License is distributed on an "AS IS" BASIS,
  WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
  See the License for the specific language governing permissions and
  limitations under the License.
*/

import fs from 'fs';
import path from 'path';

import { jest } from '@jest/globals';

// The real module replaces jest's expect when imported outside the Playwright runner.
jest.unstable_mockModule('@playwright/test', () => ({
  defineConfig: (config) => config,
  devices: { 'Desktop Chrome': {} },
}));

const { createConfig, createMultiAppConfig } = await import('./config.js');

afterEach(() => {
  delete process.env.LOWDEFY_E2E_PORT;
  delete process.env.LOWDEFY_E2E_REUSE_SERVER;
  delete process.env.SOME_APP_SECRET;
});

test('createConfig starts its own server, verified by global setup, unless reuse is requested', () => {
  const config = createConfig({ appDir: '/apps/shop', port: 3101 });

  expect(config.webServer).toMatchObject({ port: 3101, reuseExistingServer: false });
  expect(config.webServer.url).toBeUndefined();
  expect(fs.existsSync(config.globalSetup)).toBe(true);
  expect(path.basename(config.globalSetup)).toBe('globalSetup.js');
  expect(JSON.parse(process.env.LOWDEFY_E2E_SERVERS)).toEqual([
    { buildDir: path.resolve('/apps/shop/.lowdefy/server/build'), port: 3101 },
  ]);
});

test('createConfig reuses a running server when LOWDEFY_E2E_REUSE_SERVER is true', () => {
  process.env.LOWDEFY_E2E_REUSE_SERVER = 'true';
  const config = createConfig({ appDir: '/apps/shop', port: 3101 });

  expect(config.webServer.reuseExistingServer).toBe(true);
});

test('createConfig tells the server to exit with the Playwright runner', () => {
  process.env.SOME_APP_SECRET = 'kept';
  const config = createConfig({ appDir: '/apps/shop', port: 3101 });

  expect(config.webServer.env.LOWDEFY_EXIT_WITH_PID).toEqual(String(process.pid));
  expect(config.webServer.env.SOME_APP_SECRET).toEqual('kept');
});

test('createConfig moves the run to LOWDEFY_E2E_PORT when set', () => {
  process.env.LOWDEFY_E2E_PORT = '3199';
  const config = createConfig({ appDir: '/apps/shop', port: 3101 });

  expect(config.webServer.port).toBe(3199);
  expect(config.webServer.command).toContain('--port 3199');
  expect(config.use.baseURL).toEqual('http://localhost:3199');
  expect(JSON.parse(process.env.LOWDEFY_E2E_SERVERS)[0].port).toBe(3199);
});

test('createMultiAppConfig verifies the build of every app server', () => {
  const config = createMultiAppConfig({
    apps: [
      { name: 'admin', appDir: '/apps/admin', port: 3102 },
      { name: 'shop', appDir: '/apps/shop', port: 3103, buildDir: 'custom/build' },
    ],
  });

  expect(config.webServer.map(({ port, url }) => ({ port, url }))).toEqual([
    { port: 3102, url: undefined },
    { port: 3103, url: undefined },
  ]);
  config.webServer.forEach((webServer) => {
    expect(webServer.reuseExistingServer).toBe(false);
    expect(webServer.env.LOWDEFY_EXIT_WITH_PID).toEqual(String(process.pid));
  });
  expect(fs.existsSync(config.globalSetup)).toBe(true);
  expect(JSON.parse(process.env.LOWDEFY_E2E_SERVERS)).toEqual([
    { buildDir: path.resolve('/apps/admin/.lowdefy/server/build'), port: 3102 },
    { buildDir: path.resolve('/apps/shop/custom/build'), port: 3103 },
  ]);
});
