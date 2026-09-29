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


import formatCost from './formatCost.js';

test('formatCost shows micro-USD as dollars', () => {
  expect(formatCost(4000)).toBe('$0.004');
  expect(formatCost(1250000)).toBe('$1.25');
  expect(formatCost(1)).toBe('$0.000001');
  expect(formatCost(0)).toBe('$0');
});

test('formatCost returns null for a cell without a cost', () => {
  expect(formatCost(undefined)).toBeNull();
  expect(formatCost(null)).toBeNull();
  expect(formatCost(-1)).toBeNull();
  expect(formatCost(0.5)).toBeNull();
});
