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

// How far past its end a strip is pulled, at release, to pass the drag on as a swipe. iOS's
// rubber band moves the content about half as far as the finger, so this is about the 40pt
// drag a Box takes as a swipe.
const OVERSCROLL_DISTANCE = 20;
// A flick this fast (points per millisecond) past the end passes on however far it is pulled.
const FLICK_VELOCITY = 0.5;

/**
 * Which way a drag released on a horizontal strip swipes, when it pulled the strip past an end it
 * could not scroll further toward: past the trailing end (the finger moving left) is a swipe left,
 * past the leading end a swipe right. A drag that only scrolled the strip swipes nowhere.
 *
 * @param {Object} params
 * @param {number} params.contentWidth The strip's content width.
 * @param {number} params.offset The strip's scroll offset at release (past the ends while pulled).
 * @param {number} params.velocity The release speed, points per millisecond; positive scrolls
 *   toward the trailing end.
 * @param {number} params.viewportWidth The strip's width.
 * @returns {'left'|'right'|null}
 */
function getOverscrollSwipe({ contentWidth, offset, velocity, viewportWidth }) {
  const maxOffset = Math.max(contentWidth - viewportWidth, 0);
  const pastEnd = offset - maxOffset;
  if (pastEnd > OVERSCROLL_DISTANCE || (pastEnd > 0 && velocity > FLICK_VELOCITY)) {
    return 'left';
  }
  if (offset < -OVERSCROLL_DISTANCE || (offset < 0 && velocity < -FLICK_VELOCITY)) {
    return 'right';
  }
  return null;
}

export default getOverscrollSwipe;
