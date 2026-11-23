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

import readHtmlText from './readHtmlText.js';

test('a label with no tag or entity is its own text', async () => {
  expect(await readHtmlText('No space')).toBe('No space');
  expect(await readHtmlText(' 3 > 2 ')).toBe(' 3 > 2 ');
});

test('an html label reads as the text it shows, its tags stripped and entities decoded', async () => {
  expect(await readHtmlText('<span class="dot"></span><span>No space</span>')).toBe('No space');
  expect(await readHtmlText('<b>Sales</b> &amp; <i>Ops</i>')).toBe('Sales & Ops');
  expect(await readHtmlText('<svg viewBox="0 0 8 8"><circle r="4" /></svg>Open')).toBe('Open');
});

test('text the browser never matches, a style or a script, is left out', async () => {
  expect(await readHtmlText('<style>.dot { color: red; }</style><span>Red</span>')).toBe('Red');
  expect(await readHtmlText('<script>alert(1)</script><span>Safe</span>')).toBe('Safe');
});
