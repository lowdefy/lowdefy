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

import normaliseBlockId from './normaliseBlockId.js';

test.each([
  ['save', 'save'],
  ['rows.0.label', 'rows.$.label'],
  ['orders.12.lines.3.qty', 'orders.$.lines.$.qty'],
  ['step2.title', 'step2.title'],
])('normaliseBlockId(%j) is %j', (blockId, expected) => {
  expect(normaliseBlockId(blockId)).toBe(expected);
});
