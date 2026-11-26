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

import readCiBrowserOnlyFailure, { isCi } from './readCiBrowserOnlyFailure.js';

const skipped = [{ name: 'reads the title' }, { name: 'copies the link' }];

test('isCi reads the CI variable, with empty, false and 0 saying it is not CI', () => {
  expect(isCi({ env: {} })).toBe(false);
  expect(isCi({ env: { CI: '' } })).toBe(false);
  expect(isCi({ env: { CI: 'false' } })).toBe(false);
  expect(isCi({ env: { CI: 'FALSE' } })).toBe(false);
  expect(isCi({ env: { CI: '0' } })).toBe(false);
  expect(isCi({ env: { CI: 'true' } })).toBe(true);
  expect(isCi({ env: { CI: '1' } })).toBe(true);
  expect(isCi({ env: { CI: 'woodpecker' } })).toBe(true);
});

test('in CI with no mode flag and a skip, the message names the count and both ways out', () => {
  expect(readCiBrowserOnlyFailure({ env: { CI: 'true' }, options: {}, browserOnly: skipped })).toBe(
    "2 journeys need a browser and did not run. In CI, lowdefy test without --headless, --thorough or --browser fails when it skips a browser journey. To fix this, pass --thorough to run them in the browser, or pass --headless to say on purpose that browser journeys don't run here."
  );
  expect(
    readCiBrowserOnlyFailure({ env: { CI: 'true' }, options: {}, browserOnly: [skipped[0]] })
  ).toMatch(/^1 journey needs a browser and did not run\./);
});

test('in CI, --build with no mode flag names the dev server run, since --build refuses --thorough', () => {
  expect(
    readCiBrowserOnlyFailure({
      env: { CI: 'true' },
      options: { build: true },
      browserOnly: skipped,
      build: true,
    })
  ).toBe(
    "2 journeys need a browser and did not run. In CI, lowdefy test without --headless, --thorough or --browser fails when it skips a browser journey. To fix this, run them in the browser on the dev server with lowdefy test --thorough, without --build, or pass --headless to say on purpose that browser journeys don't run here."
  );
});

test('in CI, any mode flag keeps the run as it is', () => {
  ['headless', 'thorough', 'browser'].forEach((flag) => {
    expect(
      readCiBrowserOnlyFailure({
        env: { CI: 'true' },
        options: { [flag]: true },
        browserOnly: skipped,
      })
    ).toBeUndefined();
  });
  expect(
    readCiBrowserOnlyFailure({
      env: { CI: 'true' },
      options: { headless: true, build: true },
      browserOnly: skipped,
      build: true,
    })
  ).toBeUndefined();
});

test('in CI with nothing skipped, the run passes', () => {
  expect(
    readCiBrowserOnlyFailure({ env: { CI: 'true' }, options: {}, browserOnly: [] })
  ).toBeUndefined();
});

test('outside CI, a skip never fails the run', () => {
  expect(readCiBrowserOnlyFailure({ env: {}, options: {}, browserOnly: skipped })).toBeUndefined();
  expect(
    readCiBrowserOnlyFailure({ env: { CI: 'false' }, options: {}, browserOnly: skipped })
  ).toBeUndefined();
});

test('a journey no run takes to the browser does not count', () => {
  expect(
    readCiBrowserOnlyFailure({
      env: { CI: 'true' },
      options: {},
      browserOnly: skipped,
      inProcess: skipped,
    })
  ).toBeUndefined();
  expect(
    readCiBrowserOnlyFailure({
      env: { CI: 'true' },
      options: {},
      browserOnly: skipped,
      inProcess: [skipped[0]],
    })
  ).toMatch(/^1 journey needs a browser/);
});
