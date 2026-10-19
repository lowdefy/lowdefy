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

import assert from 'node:assert/strict';

import countGroupSelection from './countGroupSelection.js';

test('countGroupSelection counts the selected leaf rows in the group range', () => {
  const leaves = [{ id: '1' }, { id: '2' }, { id: '3' }, { id: '4' }];
  assert.deepEqual(
    countGroupSelection({ leaves, start: 1, end: 4, selection: { 1: true, 2: true, 4: true } }),
    { selected: 2, total: 3 }
  );
});
