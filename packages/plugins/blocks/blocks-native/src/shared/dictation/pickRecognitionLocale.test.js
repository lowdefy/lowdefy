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

import pickRecognitionLocale from './pickRecognitionLocale.js';

test('pickRecognitionLocale picks the phone locale when it is installed', () => {
  expect(pickRecognitionLocale({ lang: 'en-ZA', locales: ['en-US', 'en-ZA', 'af-ZA'] })).toBe(
    'en-ZA'
  );
});

test('pickRecognitionLocale reads "_" as "-" and ignores case', () => {
  expect(pickRecognitionLocale({ lang: 'de_DE', locales: ['DE-de'] })).toBe('DE-de');
});

test('pickRecognitionLocale falls back to an installed locale of the same language', () => {
  expect(pickRecognitionLocale({ lang: 'en-ZA', locales: ['af-ZA', 'en-US'] })).toBe('en-US');
});

test('pickRecognitionLocale gives null when no locale of the language is installed', () => {
  expect(pickRecognitionLocale({ lang: 'af-ZA', locales: ['en-US'] })).toBe(null);
  expect(pickRecognitionLocale({ lang: 'en-US', locales: [] })).toBe(null);
});
