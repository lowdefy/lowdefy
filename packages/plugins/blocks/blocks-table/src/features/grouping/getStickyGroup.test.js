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

import getStickyGroup from './getStickyGroup.js';

// Headers at list indices 0, 31 and 62 with 40px rows.
const groupIndices = Uint32Array.from([0, 31, 62]);

test('getStickyGroup shows nothing at the top of the list', () => {
  assert.deepEqual(getStickyGroup({ groupIndices, rowHeight: 40, scrollTop: 0 }), {
    index: -1,
    shift: 0,
  });
});

test('getStickyGroup shows the group whose rows are at the top', () => {
  assert.deepEqual(getStickyGroup({ groupIndices, rowHeight: 40, scrollTop: 210 }), {
    index: 0,
    shift: 0,
  });
  assert.deepEqual(getStickyGroup({ groupIndices, rowHeight: 40, scrollTop: 31 * 40 + 5 }), {
    index: 31,
    shift: 0,
  });
});

test('getStickyGroup pushes the overlay up as the next header arrives', () => {
  assert.deepEqual(getStickyGroup({ groupIndices, rowHeight: 40, scrollTop: 31 * 40 - 20 }), {
    index: 0,
    shift: -20,
  });
});

test('getStickyGroup shows nothing while a header sits exactly at the top', () => {
  assert.equal(getStickyGroup({ groupIndices, rowHeight: 40, scrollTop: 31 * 40 }).index, -1);
});

test('getStickyGroup shows nothing without groups', () => {
  assert.equal(
    getStickyGroup({ groupIndices: new Uint32Array(0), rowHeight: 40, scrollTop: 400 }).index,
    -1
  );
});

test('getStickyGroup reads item tops from rowOffsets when items differ in height', () => {
  // Items 0 (group) and 1 are one row high, item 2 is a 100px detail row, item 3 is a group.
  const rowOffsets = new Float64Array([0, 40, 80, 180, 220]);
  const indices = Uint32Array.from([0, 3]);
  assert.deepEqual(
    getStickyGroup({ groupIndices: indices, rowHeight: 40, rowOffsets, scrollTop: 100 }),
    {
      index: 0,
      shift: 0,
    }
  );
  assert.deepEqual(
    getStickyGroup({ groupIndices: indices, rowHeight: 40, rowOffsets, scrollTop: 160 }),
    {
      index: 0,
      shift: -20,
    }
  );
});
