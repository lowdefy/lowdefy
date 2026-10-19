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

import normalizeOptions from './normalizeOptions.js';

test('normalizeOptions returns undefined when there are no options', () => {
  expect(normalizeOptions(undefined)).toBeUndefined();
  expect(normalizeOptions(null)).toBeUndefined();
});

test('normalizeOptions accepts values and option objects in an array', () => {
  expect(
    normalizeOptions(['lead', 2, { value: 'won', color: 'green', icon: 'check', extra: 1 }])
  ).toEqual([
    { value: 'lead', label: 'lead' },
    { value: 2, label: '2' },
    { value: 'won', label: 'won', color: 'green', icon: 'check', extra: 1 },
  ]);
});

test('normalizeOptions accepts a map of labels or option objects keyed by value', () => {
  expect(
    normalizeOptions({ lead: 'Lead', won: { label: 'Won', color: 'green' }, lost: {}, open: null })
  ).toEqual([
    { value: 'lead', label: 'Lead' },
    { value: 'won', label: 'Won', color: 'green' },
    { value: 'lost', label: 'lost' },
    { value: 'open', label: 'open' },
  ]);
});

test('normalizeOptions throws on other values', () => {
  expect(() => normalizeOptions('lead')).toThrow(
    'Table column options must be an array or an object. Received "lead".'
  );
});
