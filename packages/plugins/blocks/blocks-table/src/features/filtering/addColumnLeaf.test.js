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

import addColumnLeaf from './addColumnLeaf.js';

const columns = [
  { key: 'stage', type: 'status', filterable: true, options: [{ value: 'won', label: 'Won' }] },
  { key: 'closeDate', type: 'date', filterable: true },
  { key: 'notes', type: 'text', filterable: false },
];

test('addColumnLeaf keeps the top group and its operator', () => {
  const column = columns[0];
  expect(addColumnLeaf({ condition: null, column })).toEqual({
    and: [{ key: 'stage', op: 'in' }],
  });
  expect(addColumnLeaf({ condition: { or: [{ key: 'closeDate', op: 'empty' }] }, column })).toEqual(
    {
      or: [
        { key: 'closeDate', op: 'empty' },
        { key: 'stage', op: 'in' },
      ],
    }
  );
});
