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

import countKeyLeaves from './countKeyLeaves.js';
import { expect, test } from 'vitest';

test('countKeyLeaves counts the leaves on a key at any depth', () => {
  const condition = {
    and: [
      { key: 'stage', op: 'eq', value: 'won' },
      {
        or: [
          { key: 'stage', op: 'empty' },
          { key: 'amount', op: 'gt', value: 10 },
        ],
      },
    ],
  };
  expect(countKeyLeaves({ condition, key: 'stage' })).toBe(2);
  expect(countKeyLeaves({ condition, key: 'amount' })).toBe(1);
  expect(countKeyLeaves({ condition, key: 'owner' })).toBe(0);
  expect(countKeyLeaves({ condition: { key: 'stage', op: 'empty' }, key: 'stage' })).toBe(1);
  expect(countKeyLeaves({ condition: null, key: 'stage' })).toBe(0);
});
