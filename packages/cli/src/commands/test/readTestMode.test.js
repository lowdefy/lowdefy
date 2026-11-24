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

import readTestMode from './readTestMode.js';

test('runs mixed by default, each journey headless when it can', () => {
  expect(readTestMode({ options: {} })).toEqual({ runner: 'mixed', thorough: false, build: false });
});

test('--thorough is a mixed run that also takes found journeys to the browser', () => {
  expect(readTestMode({ options: { thorough: true } })).toEqual({
    runner: 'mixed',
    thorough: true,
    build: false,
  });
});

test('--browser and --headless pick their runner', () => {
  expect(readTestMode({ options: { browser: true } }).runner).toBe('browser');
  expect(readTestMode({ options: { headless: true } }).runner).toBe('headless');
  expect(readTestMode({ options: { headless: true, build: true } })).toEqual({
    runner: 'headless',
    thorough: false,
    build: true,
  });
});

test.each([
  [{ browser: true, thorough: true }],
  [{ browser: true, headless: true }],
  [{ thorough: true, headless: true }],
  [{ browser: true, thorough: true, headless: true }],
])('refuses two runners at once (%j)', (options) => {
  expect(readTestMode({ options }).error).toMatch(
    /^--browser, --thorough and --headless each pick where the journeys run: pass one of them\./
  );
});

test.each([[{}], [{ thorough: true }], [{ browser: true }]])(
  'refuses --build without --headless (%j)',
  (options) => {
    expect(readTestMode({ options: { ...options, build: true } }).error).toMatch(
      /pass --headless with it, as in "lowdefy test --headless --build"/
    );
  }
);

test('refuses a typed --concurrency only with --headless', () => {
  expect(
    readTestMode({ options: { headless: true, typedOptions: ['concurrency'] } }).error
  ).toMatch(/^--concurrency runs browser journeys side by side/);
  expect(readTestMode({ options: { typedOptions: ['concurrency'] } }).runner).toBe('mixed');
  expect(readTestMode({ options: { thorough: true, typedOptions: ['concurrency'] } }).runner).toBe(
    'mixed'
  );
  // One from lowdefy.yaml's cli config is not this run's choice.
  expect(readTestMode({ options: { headless: true, concurrency: 2 } }).runner).toBe('headless');
});

test('names the options without dashes for the MCP tool', () => {
  expect(
    readTestMode({ options: { browser: true, headless: true }, flagPrefix: '' }).error
  ).toMatch(/^browser, thorough and headless each pick/);
  expect(
    readTestMode({
      options: { headless: true, typedOptions: ['concurrency'] },
      flagPrefix: '',
    }).error
  ).toBe(
    'concurrency runs browser journeys side by side, and a headless run goes one at a time: drop concurrency, or drop headless to run the browser journeys side by side.'
  );
});
