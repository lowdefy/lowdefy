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
