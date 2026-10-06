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

import parseDuration from './parseDuration.js';
import parseExploreOptions from './parseExploreOptions.js';

test('parseExploreOptions defaults 5 walks, 15 steps and a 20 minute budget', () => {
  expect(parseExploreOptions({ against: 'origin/main' })).toEqual({
    pr: null,
    against: 'origin/main',
    charter: null,
    chartersFile: null,
    data: null,
    liveData: false,
    pages: [],
    roles: [],
    walks: 5,
    steps: 15,
    budgetMs: 20 * 60 * 1000,
    allowExternal: [],
    seed: 0,
    scopeOnly: false,
    json: false,
    url: null,
  });
});

test('parseExploreOptions needs one of --pr, --against, --charter or --charters, and whole counts', () => {
  expect(() => parseExploreOptions({})).toThrow(
    'Pass one of --pr <number>, --against <ref>, --charter <text> or --charters <file>.'
  );
  expect(() => parseExploreOptions({ pr: '1', against: 'x' })).toThrow(
    'Pass one of --pr <number> or --against <ref>, not both.'
  );
  expect(() => parseExploreOptions({ pr: '1', against: 'x', charter: 'try edge input' })).toThrow(
    'not both'
  );
  expect(() => parseExploreOptions({ pr: '1', walks: '0' })).toThrow(
    '--walks should be a whole number of at least 1. Received "0".'
  );
  expect(parseExploreOptions({ pr: '7', page: ['a', 'b'], seed: '3' })).toEqual(
    expect.objectContaining({ pr: '7', pages: ['a', 'b'], seed: 3 })
  );
});

test('parseExploreOptions takes --charter alone as a head-only run', () => {
  expect(parseExploreOptions({ charter: '  try edge input on the invoice form ' })).toEqual(
    expect.objectContaining({
      pr: null,
      against: null,
      charter: { goal: 'try edge input on the invoice form' },
    })
  );
});

test('parseExploreOptions takes --charter with --pr or --against', () => {
  expect(parseExploreOptions({ pr: '7', charter: 'try error paths' })).toEqual(
    expect.objectContaining({ pr: '7', charter: { goal: 'try error paths' } })
  );
  expect(parseExploreOptions({ against: 'origin/v7', charter: 'try error paths' })).toEqual(
    expect.objectContaining({ against: 'origin/v7', charter: { goal: 'try error paths' } })
  );
});

test('parseExploreOptions refuses an empty --charter', () => {
  expect(() => parseExploreOptions({ charter: '   ' })).toThrow(
    '--charter should be a sentence saying what to try. Received "   ".'
  );
});

test('parseExploreOptions takes --charters alone, or with --pr, as the path to read', () => {
  expect(parseExploreOptions({ charters: 'bash.yaml' })).toEqual(
    expect.objectContaining({ pr: null, against: null, charter: null, chartersFile: 'bash.yaml' })
  );
  expect(parseExploreOptions({ pr: '7', charters: 'bash.yaml' })).toEqual(
    expect.objectContaining({ pr: '7', chartersFile: 'bash.yaml' })
  );
});

test('parseExploreOptions refuses --charter with --charters', () => {
  expect(() => parseExploreOptions({ charter: 'try edge input', charters: 'bash.yaml' })).toThrow(
    'Pass one of --charter <text> or --charters <file>, not both.'
  );
});

test('parseDuration reads seconds, minutes and hours, a bare number as minutes', () => {
  expect(parseDuration({ value: '90s', flag: '--budget' })).toBe(90000);
  expect(parseDuration({ value: '20m', flag: '--budget' })).toBe(1200000);
  expect(parseDuration({ value: '1h', flag: '--budget' })).toBe(3600000);
  expect(parseDuration({ value: '5', flag: '--budget' })).toBe(300000);
  expect(() => parseDuration({ value: 'soon', flag: '--budget' })).toThrow(
    '--budget should be a duration such as 20m, 90s or 1h. Received "soon".'
  );
});
