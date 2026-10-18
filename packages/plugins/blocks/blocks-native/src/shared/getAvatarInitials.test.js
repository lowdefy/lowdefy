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

import getAvatarInitials from './getAvatarInitials.js';

const tokens = {
  blue: '#1677FF',
  purple: '#722ED1',
  cyan: '#13C2C2',
  green: '#52C41A',
  magenta: '#EB2F96',
  volcano: '#FA541C',
  geekblue: '#2F54EB',
  orange: '#FA8C16',
  colorPrimary: '#6366f1',
};

test('initials are the first letters of the first two words', () => {
  expect(getAvatarInitials({ avatar: { name: 'gerrie van wyk' }, tokens }).initials).toBe('GV');
  expect(getAvatarInitials({ avatar: { name: ' Ada ' }, tokens }).initials).toBe('A');
  expect(getAvatarInitials({ avatar: {}, tokens }).initials).toBe('');
});

test('the colour is the same for the same name, from the theme palette', () => {
  const first = getAvatarInitials({ avatar: { name: 'Sam Tolmay' }, tokens }).color;
  expect(getAvatarInitials({ avatar: { name: 'Sam Tolmay' }, tokens }).color).toBe(first);
  expect(Object.values(tokens)).toContain(first);
});

test('an avatar colour overrides the palette', () => {
  expect(getAvatarInitials({ avatar: { name: 'Ada', color: '#000' }, tokens }).color).toBe('#000');
});
