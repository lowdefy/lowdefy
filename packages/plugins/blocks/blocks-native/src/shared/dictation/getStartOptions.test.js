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

import getStartOptions from './getStartOptions.js';

test('getStartOptions dictates on the device only, as text entry, with partial words and the level', () => {
  expect(getStartOptions({ hints: ['Sam Tolmay'], lang: 'en-ZA' })).toEqual({
    lang: 'en-ZA',
    interimResults: true,
    continuous: true,
    requiresOnDeviceRecognition: true,
    addsPunctuation: true,
    iosTaskHint: 'dictation',
    contextualStrings: ['Sam Tolmay'],
    volumeChangeEventOptions: { enabled: true },
  });
});

test('getStartOptions passes the first 100 hints', () => {
  const hints = Array.from({ length: 120 }, (_, index) => `Person ${index}`);
  const { contextualStrings } = getStartOptions({ hints, lang: 'en-US' });
  expect(contextualStrings).toHaveLength(100);
  expect(contextualStrings[99]).toBe('Person 99');
});

test('getStartOptions passes no hints without any, and drops empty ones', () => {
  expect(getStartOptions({ lang: 'en-US' }).contextualStrings).toEqual([]);
  expect(getStartOptions({ hints: ['', null, 'Ana'], lang: 'en-US' }).contextualStrings).toEqual([
    'Ana',
  ]);
});
