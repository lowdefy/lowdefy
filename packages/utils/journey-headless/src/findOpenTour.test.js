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

import findOpenTour from './findOpenTour.js';

function tour({ id = 'tour', open, keyboard, visible = true }) {
  return {
    blockId: id,
    type: 'Tour',
    eval: { properties: { open, keyboard } },
    visibleEval: { output: visible },
  };
}

test('findOpenTour finds a shown Tour that is open, its keyboard on or off', () => {
  const open = tour({ id: 'open', open: true, keyboard: false });
  expect(findOpenTour({ blocks: [tour({ open: false }), open] })).toBe(open);
});

test('findOpenTour finds no Tour that is closed or hidden', () => {
  expect(
    findOpenTour({
      blocks: [tour({ open: false }), tour({ open: true, visible: false }), tour({})],
    })
  ).toBeUndefined();
});
