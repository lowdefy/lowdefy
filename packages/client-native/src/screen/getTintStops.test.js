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

import getTintStops from './getTintStops.js';

test('getTintStops runs from the full opacity at the top to clear at the bottom', () => {
  const stops = getTintStops({ opacity: 0.35 });
  expect(stops[0]).toEqual({ offset: 0, opacity: 0.35 });
  expect(stops.at(-1)).toEqual({ offset: 1, opacity: 0 });
  expect(stops.map((stop) => stop.offset)).toEqual([0, 0.167, 0.333, 0.5, 0.667, 0.833, 1]);
});

test('getTintStops eases out, falling slowly at the top and the bottom and fastest midway', () => {
  const opacities = getTintStops({ opacity: 1 }).map((stop) => stop.opacity);
  expect(opacities).toEqual([1, 0.933, 0.75, 0.5, 0.25, 0.067, 0]);
  const drops = opacities.slice(1).map((opacity, index) => opacities[index] - opacity);
  expect(drops[0]).toBeLessThan(drops[2]);
  expect(drops.at(-1)).toBeLessThan(drops[3]);
});

test('getTintStops scales with the top opacity', () => {
  expect(getTintStops({ opacity: 0.45 })[3]).toEqual({ offset: 0.5, opacity: 0.225 });
});
