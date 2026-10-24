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
import validateMobileShortcuts from './validateMobileShortcuts.js';

test('validateMobileShortcuts accepts up to four shortcuts', () => {
  expect(() =>
    validateMobileShortcuts({
      shortcuts: [
        { id: 'new-job', title: 'New job', icon: 'plus', path: '/jobs/new' },
        { id: 'scan', title: 'Scan asset', subtitle: 'Read a tag' },
      ],
    })
  ).not.toThrow();
});

test('validateMobileShortcuts refuses more than four shortcuts', () => {
  const shortcuts = [1, 2, 3, 4, 5].map((n) => ({ id: `s${n}`, title: `S${n}` }));
  expect(() => validateMobileShortcuts({ shortcuts })).toThrow(
    'App "mobile.shortcuts" should have at most 4 shortcuts. Received 5.'
  );
});

test('validateMobileShortcuts refuses a shortcut without a title', () => {
  expect(() => validateMobileShortcuts({ shortcuts: [{ id: 'a' }] })).toThrow(
    'App "mobile.shortcuts[0].title" should be a non-empty string.'
  );
});
