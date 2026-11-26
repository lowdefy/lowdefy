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

test('runs headless by default, and --headless is the default spelled out', () => {
  expect(readTestMode({ options: {} })).toEqual({ runner: 'headless', build: false });
  expect(readTestMode({ options: { headless: true } })).toEqual({
    runner: 'headless',
    build: false,
  });
});

test('--thorough is the mixed run and --browser the browser run', () => {
  expect(readTestMode({ options: { thorough: true } })).toEqual({ runner: 'mixed', build: false });
  expect(readTestMode({ options: { browser: true } })).toEqual({ runner: 'browser', build: false });
});

test('--build runs headless, with or without --headless', () => {
  expect(readTestMode({ options: { build: true } })).toEqual({ runner: 'headless', build: true });
  expect(readTestMode({ options: { headless: true, build: true } })).toEqual({
    runner: 'headless',
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
    /^--browser, --thorough and --headless each pick where the journeys run: pass one of them\. By default \(or with --headless\) only the journeys that need no browser run;/
  );
});

test.each([
  [{ thorough: true }, '--thorough'],
  [{ browser: true }, '--browser'],
])('refuses --build with a browser run (%j)', (options, flag) => {
  expect(readTestMode({ options: { ...options, build: true } }).error).toBe(
    `--build runs the journeys that need no browser on the production build. Running the browser journeys on the production build is not supported yet: drop --build and run "lowdefy test ${flag}" to run them on the dev server.`
  );
});

test('refuses a typed --concurrency only on a headless run', () => {
  expect(readTestMode({ options: { typedOptions: ['concurrency'] } }).error).toBe(
    '--concurrency runs browser journeys side by side, and a headless run goes one at a time: drop --concurrency, or pass --thorough or --browser to run the browser journeys side by side.'
  );
  expect(
    readTestMode({ options: { headless: true, typedOptions: ['concurrency'] } }).error
  ).toMatch(/^--concurrency runs browser journeys side by side/);
  expect(readTestMode({ options: { build: true, typedOptions: ['concurrency'] } }).error).toMatch(
    /^--concurrency runs browser journeys side by side/
  );
  expect(readTestMode({ options: { thorough: true, typedOptions: ['concurrency'] } }).runner).toBe(
    'mixed'
  );
  expect(readTestMode({ options: { browser: true, typedOptions: ['concurrency'] } }).runner).toBe(
    'browser'
  );
  // One from lowdefy.yaml's cli config is not this run's choice.
  expect(readTestMode({ options: { concurrency: 2 } }).runner).toBe('headless');
});

test('names the options without dashes for the MCP tool', () => {
  expect(
    readTestMode({ options: { browser: true, headless: true }, flagPrefix: '' }).error
  ).toMatch(/^browser, thorough and headless each pick/);
  expect(
    readTestMode({
      options: { typedOptions: ['concurrency'] },
      flagPrefix: '',
    }).error
  ).toBe(
    'concurrency runs browser journeys side by side, and a headless run goes one at a time: drop concurrency, or pass thorough or browser to run the browser journeys side by side.'
  );
});
