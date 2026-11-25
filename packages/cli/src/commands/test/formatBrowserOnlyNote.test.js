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

import path from 'path';
import { expect, test } from 'vitest';

import formatBrowserOnlyNote from './formatBrowserOnlyNote.js';

const base = path.join('/', 'app');

function browserOnlyResult({ name, file = 'a.yaml', remembered = false }) {
  return {
    name,
    filePath: path.join(base, 'tests', 'journeys', file),
    browserOnly: { index: 2, step: { click: 'next' }, reason: 'needs a browser here' },
    ...(remembered ? { remembered: true } : {}),
  };
}

test('names each browser-only journey with its step, and the command that runs them in the browser', () => {
  const first = browserOnlyResult({ name: 'goes next' });
  const second = browserOnlyResult({ name: 'reads the title', file: 'b.yaml', remembered: true });
  const third = browserOnlyResult({ name: 'goes back' });
  expect(formatBrowserOnlyNote({ browserOnly: [first, second, third], base })).toBe(
    [
      'Not run, needs a browser:',
      '  goes next (tests/journeys/a.yaml)  step 2 (click "next"): needs a browser here',
      '  reads the title (tests/journeys/b.yaml)  step 2 (click "next"): needs a browser here  (found by an earlier run)',
      '  goes back (tests/journeys/a.yaml)  step 2 (click "next"): needs a browser here',
      'Run them in the browser: lowdefy test --thorough tests/journeys/a.yaml tests/journeys/b.yaml',
    ].join('\n')
  );
});

test('says nothing when the run left none', () => {
  expect(formatBrowserOnlyNote({ browserOnly: [], base })).toBeUndefined();
});

test('names the files from the working directory, quoted when a shell would split them', () => {
  const result = browserOnlyResult({ name: 'goes next', file: "my journeys/it's.yaml" });
  expect(
    formatBrowserOnlyNote({ browserOnly: [result], base: path.join(base, 'tests') }).split('\n')[2]
  ).toBe(`Run them in the browser: lowdefy test --thorough 'journeys/my journeys/it'\\''s.yaml'`);
});

test('names the lowdefy_run_tests tool and its arguments for the MCP answer', () => {
  const result = browserOnlyResult({ name: 'goes next' });
  expect(formatBrowserOnlyNote({ browserOnly: [result], base, tool: true }).split('\n')[2]).toBe(
    'Run them in the browser: lowdefy_run_tests with thorough: true and paths: ["tests/journeys/a.yaml"]'
  );
});

test('leaves the journeys no run takes to the browser out of the command, and says why', () => {
  const held = browserOnlyResult({ name: 'holds a call', file: 'held.yaml' });
  const other = browserOnlyResult({ name: 'goes next' });
  const lines = formatBrowserOnlyNote({
    browserOnly: [held, other],
    inProcess: [held],
    base,
  }).split('\n');
  expect(lines.slice(3)).toEqual([
    'Run them in the browser: lowdefy test --thorough tests/journeys/a.yaml',
    '1 of them has a hold, release or call as system step, which only the headless runner takes, so no run takes it to the browser.',
  ]);
  // A thorough run leaves only those browser-only: there is no command to give.
  expect(
    formatBrowserOnlyNote({ browserOnly: [held], inProcess: [held], base })
      .split('\n')
      .slice(2)
  ).toEqual([
    'It has a hold, release or call as system step, which only the headless runner takes, so no run takes it to the browser.',
  ]);
  const another = browserOnlyResult({ name: 'releases a call', file: 'held.yaml' });
  expect(
    formatBrowserOnlyNote({ browserOnly: [held, another], inProcess: [held, another], base })
      .split('\n')
      .slice(3)
  ).toEqual([
    'They have a hold, release or call as system step, which only the headless runner takes, so no run takes them to the browser.',
  ]);
});
