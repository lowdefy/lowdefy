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

import resolveControlFlag from './resolveControlFlag.js';

test('resolveControlFlag uses the compiled condition when there is one', () => {
  expect(
    resolveControlFlag({
      control: { hidden: { when: {} } },
      name: 'hidden',
      compiled: (row, value) => value === 1,
      row: {},
      value: 1,
    })
  ).toBe(true);
});

test('resolveControlFlag reads the field path, then the literal, and only counts booleans', () => {
  const row = { locked: true, note: 'yes' };
  expect(resolveControlFlag({ control: { hiddenField: 'locked' }, name: 'hidden', row })).toBe(
    true
  );
  expect(resolveControlFlag({ control: { disabled: false }, name: 'disabled', row })).toBe(false);
  expect(resolveControlFlag({ control: { disabledField: 'note' }, name: 'disabled', row })).toBe(
    undefined
  );
  expect(resolveControlFlag({ control: {}, name: 'hidden', row })).toBeUndefined();
});
