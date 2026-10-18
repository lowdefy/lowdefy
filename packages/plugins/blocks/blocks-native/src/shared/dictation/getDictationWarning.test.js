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

import getDictationWarning from './getDictationWarning.js';

test('getDictationWarning gives denied when the permission is refused', () => {
  expect(getDictationWarning({ error: 'not-allowed' })).toBe('denied');
});

test('getDictationWarning gives no warning for a cancelled or silent session', () => {
  expect(getDictationWarning({ error: 'aborted' })).toBe(null);
  expect(getDictationWarning({ error: 'no-speech' })).toBe(null);
  expect(getDictationWarning({ error: 'speech-timeout' })).toBe(null);
});

test('getDictationWarning gives failed for any other error', () => {
  ['audio-capture', 'interrupted', 'language-not-supported', 'busy', 'unknown'].forEach(
    (error) => {
      expect(getDictationWarning({ error })).toBe('failed');
    }
  );
});
