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

import { expect, test } from 'vitest';

import readAccessMode from './readAccessMode.js';

// What a `lowdefy test` run carries with no flags typed: getOptions' port, the log level default
// and the empty paths.
const defaults = { port: 3000, logLevel: 'info', paths: [], typedOptions: [] };

test('readAccessMode reads neither flag on a plain run, whatever its journey options', () => {
  expect(readAccessMode({ options: { ...defaults, tag: ['smoke'], headless: true } })).toEqual({
    access: false,
    updateAccess: false,
  });
});

test('readAccessMode takes --access and --update-access with the build and app options', () => {
  const options = {
    ...defaults,
    configDirectory: 'app',
    serverDirectory: 'app/.lowdefy/server',
    logLevel: 'debug',
    disableTelemetry: true,
    typedOptions: ['configDirectory', 'serverDirectory', 'logLevel', 'disableTelemetry'],
  };
  expect(readAccessMode({ options: { ...options, access: true } })).toEqual({
    access: true,
    updateAccess: false,
  });
  expect(readAccessMode({ options: { ...options, updateAccess: true } })).toEqual({
    access: false,
    updateAccess: true,
  });
});

test('readAccessMode refuses --access with --update-access', () => {
  expect(readAccessMode({ options: { ...defaults, access: true, updateAccess: true } })).toEqual({
    error:
      '--access and --update-access do different things: run "lowdefy test --access" to check tests/access.yaml, or "lowdefy test --update-access" to rewrite it.',
  });
});

test('readAccessMode refuses a journey option with --access, naming the command meant', () => {
  expect(
    readAccessMode({
      options: { ...defaults, access: true, tag: ['smoke'], typedOptions: ['tag'] },
    })
  ).toEqual({
    error:
      '--access checks the access table alone: drop --tag, or run "lowdefy test --build --tag <tag>" to check the table and run those journeys.',
  });
  expect(
    readAccessMode({ options: { ...defaults, updateAccess: true, paths: ['tests/journeys/a'] } })
  ).toEqual({
    error:
      '--update-access rewrites tests/access.yaml alone: drop the journey paths, or run "lowdefy test --build <paths>" to check the table and run those journeys.',
  });
});

test('readAccessMode refuses every journey and dev-server option with --access', () => {
  const given = {
    headless: true,
    build: true,
    lint: true,
    repeat: '2',
    filter: ['x'],
    tier: 'common',
    usageWindow: '6m',
    journeysDirectory: 'journeys',
    url: 'http://localhost:3000',
    port: '3001',
    devDirectory: 'dev',
    refResolver: 'resolver.js',
  };
  Object.entries(given).forEach(([key, value]) => {
    const { error } = readAccessMode({
      options: { ...defaults, access: true, [key]: value, typedOptions: [key] },
    });
    expect(error).toMatch(/^--access checks the access table alone: drop --/);
  });
});

test('readAccessMode takes options the environment or lowdefy.yaml cli config set', () => {
  const fromConfig = {
    port: '3001',
    devDirectory: 'dev',
    refResolver: 'resolver.js',
    journeysDirectory: 'tests/e2e',
    url: 'http://localhost:3000',
    tier: 'common',
  };
  Object.entries(fromConfig).forEach(([key, value]) => {
    expect(readAccessMode({ options: { ...defaults, access: true, [key]: value } })).toEqual({
      access: true,
      updateAccess: false,
    });
  });
});
