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

import formatBrowserOnlyNote from './formatBrowserOnlyNote.js';

test('a mixed run that left journeys browser-only says how they run in the browser', () => {
  expect(formatBrowserOnlyNote({ runner: 'mixed', browserOnly: 2 })).toBe(
    'The next lowdefy test runs the browser-only journeys in the browser while they and the app config are unchanged; lowdefy test --thorough runs them there in this run.'
  );
});

test('says nothing when none was left, or on a headless run, which lists them by design', () => {
  expect(formatBrowserOnlyNote({ runner: 'mixed', browserOnly: 0 })).toBeUndefined();
  expect(formatBrowserOnlyNote({ runner: 'headless', browserOnly: 2 })).toBeUndefined();
});

test('names the lowdefy_run_tests tool and its argument for the MCP answer', () => {
  expect(formatBrowserOnlyNote({ runner: 'mixed', browserOnly: 1, tool: true })).toBe(
    'The next lowdefy_run_tests runs the browser-only journeys in the browser while they and the app config are unchanged; thorough: true runs them there in this run.'
  );
});

test('a thorough run, which ran the rest in the browser, names only the journeys no run takes there', () => {
  expect(
    formatBrowserOnlyNote({ runner: 'mixed', thorough: true, browserOnly: 2, inProcess: 2 })
  ).toBe(
    '2 browser-only journeys also have a hold, release or call as system step, which only the headless runner takes, so no run takes them to the browser.'
  );
  expect(
    formatBrowserOnlyNote({ runner: 'mixed', thorough: true, browserOnly: 0, inProcess: 0 })
  ).toBeUndefined();
});

test('a default run says the next run takes only the journeys with no in-process step', () => {
  expect(formatBrowserOnlyNote({ runner: 'mixed', browserOnly: 3, inProcess: 1 })).toBe(
    'The next lowdefy test runs the browser-only journeys in the browser while they and the app config are unchanged; lowdefy test --thorough runs them there in this run. 1 browser-only journey also has a hold, release or call as system step, which only the headless runner takes, so no run takes it to the browser.'
  );
  expect(formatBrowserOnlyNote({ runner: 'mixed', browserOnly: 1, inProcess: 1 })).toBe(
    '1 browser-only journey also has a hold, release or call as system step, which only the headless runner takes, so no run takes it to the browser.'
  );
});
