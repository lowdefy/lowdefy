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

import getRubberBand from './getRubberBand.js';

test('getRubberBand follows the drag at about half speed at first', () => {
  expect(getRubberBand(0)).toBe(0);
  expect(getRubberBand(10)).toBeCloseTo(4.93, 2);
  expect(getRubberBand(-10)).toBeCloseTo(-4.93, 2);
});

test('getRubberBand resists more the further the Box is pulled, never past 48pt', () => {
  const offsets = [20, 40, 80, 160, 1000].map(getRubberBand);
  offsets.slice(1).forEach((offset, index) => {
    expect(offset).toBeGreaterThan(offsets[index]);
  });
  expect(getRubberBand(80) - getRubberBand(40)).toBeLessThan(getRubberBand(40));
  expect(getRubberBand(1000)).toBeLessThan(48);
  expect(getRubberBand(-1000)).toBeGreaterThan(-48);
});
