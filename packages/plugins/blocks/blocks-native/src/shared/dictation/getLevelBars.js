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

// One level drives all eight bars. Each bar has its own share of it, so the meter reads as a
// waveform rather than a block that grows.
const SHAPE = [0.3, 0.6, 1, 0.55, 0.8, 0.4, 0.7, 0.25];
const MIN_HEIGHT = 4;
const MAX_HEIGHT = 22;

/**
 * The heights, in points, of the level meter's eight bars for an input level.
 *
 * @param {Object} params
 * @param {number} params.level The input level, from 0 to 1.
 * @returns {number[]}
 */
function getLevelBars({ level }) {
  return SHAPE.map((share) => Math.round(MIN_HEIGHT + (MAX_HEIGHT - MIN_HEIGHT) * share * level));
}

export default getLevelBars;
