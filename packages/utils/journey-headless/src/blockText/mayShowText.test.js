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

import mayShowText from './mayShowText.js';
import normalizeShownText from './normalizeShownText.js';

const units = (...texts) => texts.map(normalizeShownText);

test('mayShowText finds text in one unit whatever its white space and case', () => {
  expect(mayShowText({ contains: 'ACME  ltd', units: units('Acme Ltd') })).toBe(true);
  expect(mayShowText({ contains: 'Beta', units: units('Acme Ltd') })).toBe(false);
});

test('mayShowText finds text that may run across units in any order', () => {
  expect(mayShowText({ contains: 'Ltd 3 contacts', units: units('3 contacts', 'Acme Ltd') })).toBe(
    true
  );
  expect(mayShowText({ contains: 'a b c', units: units('c', 'x a', 'b') })).toBe(true);
  expect(mayShowText({ contains: 'Ltd 4 contacts', units: units('3 contacts', 'Acme Ltd') })).toBe(
    false
  );
});

test('mayShowText says an empty or all-space text may show, as a browser finds it anywhere', () => {
  expect(mayShowText({ contains: '', units: [] })).toBe(true);
  expect(mayShowText({ contains: '  ', units: units('x') })).toBe(true);
});
