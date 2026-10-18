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

test('the title defaults to the block id and drops a trailing colon', () => {
  expect(getLabelState({ blockId: 'name', properties: {} }).title).toBe('name');
  expect(getLabelState({ blockId: 'name', properties: { title: 'Name:' } }).title).toBe('Name');
  expect(
    getLabelState({ blockId: 'name', properties: { title: 'Name:', colon: false } }).title
  ).toBe('Name:');
});

test('an empty or disabled label has no title', () => {
  expect(getLabelState({ blockId: 'name', properties: { title: '' } }).title).toBeNull();
  expect(getLabelState({ blockId: 'name', properties: { disabled: true } }).title).toBeNull();
});

test('the colon shows only beside an inline input', () => {
  expect(getLabelState({ blockId: 'a', properties: {} }).colon).toBe(false);
  expect(getLabelState({ blockId: 'a', properties: { inline: true } }).colon).toBe(true);
});

test('a failed validation shows its first message in place of the extra text', () => {
  const properties = { extra: 'Help' };
  expect(getLabelState({ blockId: 'a', properties, validation: { status: null } })).toMatchObject({
    extra: 'Help',
    feedback: null,
  });
  expect(
    getLabelState({
      blockId: 'a',
      properties,
      validation: { status: 'error', errors: ['Required', 'Too short'], warnings: [] },
    })
  ).toMatchObject({ extra: null, feedback: 'Required' });
  expect(
    getLabelState({
      blockId: 'a',
      properties,
      validation: { status: 'warning', errors: [], warnings: ['Check this'] },
    })
  ).toMatchObject({ feedback: 'Check this' });
  expect(
    getLabelState({
      blockId: 'a',
      properties: { hasFeedback: false },
      validation: { status: 'error', errors: ['Required'], warnings: [] },
    }).feedback
  ).toBeNull();
});
