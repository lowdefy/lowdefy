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

// A drag this far across, and more than twice as far across as down, is a swipe.
const SWIPE_DISTANCE = 40;
// A shorter drag is a swipe when it is a flick this fast (points per millisecond) the same way.
const FLICK_VELOCITY = 0.5;
const FLICK_DISTANCE = 10;

/**
 * Which way a drag swipes, if it is a clear horizontal swipe: across more than 40pt and more than
 * twice as far across as down, or a flick across faster than 0.5pt/ms past 10pt. A drag that is
 * not clearly horizontal is a scroll, and swipes nowhere.
 *
 * @param {Object} params
 * @param {number} params.dx The drag's distance across since the touch began.
 * @param {number} params.dy The drag's distance down since the touch began.
 * @param {number} params.vx The drag's speed across, in points per millisecond.
 * @returns {'left'|'right'|null}
 */
function getSwipeDirection({ dx, dy, vx }) {
  const across = Math.abs(dx);
  if (across <= 2 * Math.abs(dy)) {
    return null;
  }
  const direction = dx < 0 ? 'left' : 'right';
  if (across > SWIPE_DISTANCE) {
    return direction;
  }
  const flick = Math.abs(vx) > FLICK_VELOCITY && Math.sign(vx) === Math.sign(dx);
  if (across > FLICK_DISTANCE && flick) {
    return direction;
  }
  return null;
}

export default getSwipeDirection;
