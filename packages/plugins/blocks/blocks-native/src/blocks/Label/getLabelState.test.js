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

import getLabelState from './getLabelState.js';

test('an input without a title has no label title, and a title drops a trailing colon', () => {
  expect(getLabelState({ properties: {} }).title).toBeNull();
  expect(getLabelState({ properties: { title: 'Name:' } }).title).toBe('Name');
  expect(getLabelState({ properties: { title: 'Name:', colon: false } }).title).toBe('Name:');
});

test('an empty or disabled label has no title', () => {
  expect(getLabelState({ properties: { title: '' } }).title).toBeNull();
  expect(getLabelState({ properties: { disabled: true } }).title).toBeNull();
});

test('the colon shows only beside an inline input', () => {
  expect(getLabelState({ properties: {} }).colon).toBe(false);
  expect(getLabelState({ properties: { inline: true } }).colon).toBe(true);
});

test('a failed validation shows its first message in place of the extra text', () => {
  const properties = { extra: 'Help' };
  expect(getLabelState({ properties, validation: { status: null } })).toMatchObject({
    extra: 'Help',
    feedback: null,
  });
  expect(
    getLabelState({
      properties,
      validation: { status: 'error', errors: ['Required', 'Too short'], warnings: [] },
    })
  ).toMatchObject({ extra: null, feedback: 'Required' });
  expect(
    getLabelState({
      properties,
      validation: { status: 'warning', errors: [], warnings: ['Check this'] },
    })
  ).toMatchObject({ feedback: 'Check this' });
  expect(
    getLabelState({
      properties: { hasFeedback: false },
      validation: { status: 'error', errors: ['Required'], warnings: [] },
    }).feedback
  ).toBeNull();
});
