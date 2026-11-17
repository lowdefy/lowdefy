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

import SelectOption from './SelectOption.js';

test('SelectOption renders the label alone for an option without a description', () => {
  const label = 'Won';
  expect(SelectOption({ data: { value: 'won' }, label })).toBe(label);
});

test('SelectOption renders the description on a second line under the label', () => {
  const element = SelectOption({
    data: { value: 'lead', description: 'Not yet spoken to.' },
    label: 'Lead',
  });
  expect(element.props.className).toBe('lf-table-option');
  const [label, description] = element.props.children;
  expect(label).toBe('Lead');
  expect(description.props.className).toBe('lf-table-option-description');
  expect(description.props.children).toBe('Not yet spoken to.');
});
