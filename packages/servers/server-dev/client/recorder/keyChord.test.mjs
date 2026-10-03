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

import keyChord from './keyChord.js';

function key(init) {
  return { ctrlKey: false, metaKey: false, altKey: false, shiftKey: false, ...init };
}

test('keyChord records Mod+k for Meta on macOS and for Ctrl elsewhere', () => {
  expect(keyChord(key({ key: 'k', metaKey: true }), { platform: 'MacIntel' })).toBe('Mod+k');
  expect(keyChord(key({ key: 'k', ctrlKey: true }), { platform: 'Win32' })).toBe('Mod+k');
  expect(keyChord(key({ key: 'k', ctrlKey: true }), { platform: 'Linux x86_64' })).toBe('Mod+k');
});

test('keyChord writes the other platform modifier by name', () => {
  expect(keyChord(key({ key: 'k', ctrlKey: true }), { platform: 'MacIntel' })).toBe('Control+k');
  expect(keyChord(key({ key: 'k', metaKey: true }), { platform: 'Win32' })).toBe('Meta+k');
});

test('keyChord records Enter and Escape alone, and Alt and Shift chords', () => {
  expect(keyChord(key({ key: 'Enter' }), { platform: 'Win32' })).toBe('Enter');
  expect(keyChord(key({ key: 'Escape' }), { platform: 'Win32' })).toBe('Escape');
  expect(keyChord(key({ key: 'K', ctrlKey: true, shiftKey: true }), { platform: 'Win32' })).toBe(
    'Mod+Shift+k'
  );
  expect(keyChord(key({ key: 'ArrowDown', altKey: true }), { platform: 'Win32' })).toBe(
    'Alt+ArrowDown'
  );
});

test('keyChord returns null for typing and for a modifier pressed alone', () => {
  expect(keyChord(key({ key: 'a' }), { platform: 'Win32' })).toBe(null);
  expect(keyChord(key({ key: 'A', shiftKey: true }), { platform: 'Win32' })).toBe(null);
  expect(keyChord(key({ key: 'Meta', metaKey: true }), { platform: 'MacIntel' })).toBe(null);
  expect(keyChord(key({ key: 'Tab' }), { platform: 'Win32' })).toBe(null);
});
