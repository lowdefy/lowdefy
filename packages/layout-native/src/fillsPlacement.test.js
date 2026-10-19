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

import fillsPlacement from './fillsPlacement.js';
import layoutStyles from './layoutStyles.js';

function fills({ area, block }) {
  const { container } = layoutStyles(area);
  const { child } = layoutStyles(block, 'xs', 8);
  return fillsPlacement({ container, child });
}

test('fillsPlacement fills a placement a row stretches to its line height', () => {
  expect(fills({ area: { gap: 8 }, block: {} })).toBe(true);
  expect(fills({ area: { gap: 8, align: 'stretch' }, block: { span: 12 } })).toBe(true);
  expect(fills({ area: { gap: 8, align: 'middle' }, block: { selfAlign: 'stretch' } })).toBe(true);
});

test('fillsPlacement does not fill a placement aligned in a wrapping row', () => {
  // The design hero's chips: small tags and a footnote in a centred wrapping row.
  expect(
    fills({ area: { direction: 'row', wrap: 'wrap', gap: 8, align: 'middle' }, block: {} })
  ).toBe(false);
  expect(fills({ area: { gap: 8, align: 'top' }, block: { flex: '0 1 auto' } })).toBe(false);
  expect(fills({ area: { gap: 8 }, block: { selfAlign: 'bottom' } })).toBe(false);
});

test('fillsPlacement fills a placement in a column only when the block grows', () => {
  expect(fills({ area: { direction: 'column', gap: 8 }, block: {} })).toBe(false);
  expect(fills({ area: { direction: 'column', gap: 8 }, block: { grow: 1 } })).toBe(true);
  expect(fills({ area: { direction: 'column', gap: 8 }, block: { flex: 1 } })).toBe(true);
  expect(
    fills({ area: { direction: 'column-reverse', gap: 8 }, block: { flex: '0 1 auto' } })
  ).toBe(false);
});

test('fillsPlacement treats a missing area style as a stacked column', () => {
  expect(fillsPlacement({ child: { width: '100%' } })).toBe(false);
});
