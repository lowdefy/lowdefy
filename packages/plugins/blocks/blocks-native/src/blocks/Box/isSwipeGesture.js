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

import getSwipeDirection from './getSwipeDirection.js';

// iOS's back gesture starts within this far of the screen's left edge.
const BACK_GESTURE_EDGE = 20;

/**
 * Whether a Box takes a drag as its swipe: a clear horizontal swipe (getSwipeDirection) in a
 * direction the Box has an event for, that did not start at the screen's left edge, where it is
 * iOS's back gesture. Anything else is left to the scroll view and the views around the Box.
 *
 * @param {Object} params
 * @param {('left'|'right')[]} params.directions The directions the Box has swipe events for.
 * @param {number} params.dx The drag's distance across since the touch began.
 * @param {number} params.dy The drag's distance down since the touch began.
 * @param {number} params.moveX Where the touch is across the screen now.
 * @param {number} params.vx The drag's speed across, in points per millisecond.
 * @returns {boolean}
 */
function isSwipeGesture({ directions, dx, dy, moveX, vx }) {
  const startX = moveX - dx;
  if (startX < BACK_GESTURE_EDGE) {
    return false;
  }
  return directions.includes(getSwipeDirection({ dx, dy, vx }));
}

export default isSwipeGesture;
