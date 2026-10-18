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

const STOP_COUNT = 7;

/**
 * The stops of a backgroundTint's vertical gradient: the colour at `opacity` at the top, easing
 * out to clear at the bottom along a half cosine. It leaves the top flat and meets clear with no
 * slope, so the fade has no visible lower edge, as a straight two-stop ramp has.
 *
 * @param {Object} params
 * @param {number} params.opacity The opacity at the top.
 * @returns {{ offset: number, opacity: number }[]} Offsets from 0 (top) to 1 (bottom).
 */
function getTintStops({ opacity }) {
  return Array.from({ length: STOP_COUNT }, (_, index) => {
    const offset = index / (STOP_COUNT - 1);
    const strength = (1 + Math.cos(Math.PI * offset)) / 2;
    return {
      offset: Math.round(offset * 1000) / 1000,
      opacity: Math.round(opacity * strength * 1000) / 1000,
    };
  });
}

export default getTintStops;
