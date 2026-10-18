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

// The furthest a swiped Box moves, however far it is dragged.
const REACH = 48;
// How stiffly the Box resists, as iOS's scroll view rubber band.
const RESISTANCE = 0.55;

/**
 * How far a Box with swipeFeedback moves for a drag: it follows the finger at first, then
 * resists more the further it is pulled, nearing 48pt, as a scroll view stretches past its edge.
 *
 * @param {number} distance The drag's distance across, negative to the left.
 * @returns {number} The Box's offset across.
 */
function getRubberBand(distance) {
  const stretch = 1 - 1 / ((Math.abs(distance) * RESISTANCE) / REACH + 1);
  return Math.sign(distance) * stretch * REACH;
}

export default getRubberBand;
