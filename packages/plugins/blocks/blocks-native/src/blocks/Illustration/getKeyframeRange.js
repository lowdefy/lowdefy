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

import { Easing } from 'react-native';

const EASINGS = {
  ease: Easing.ease,
  easeIn: Easing.in(Easing.ease),
  easeInOut: Easing.inOut(Easing.ease),
  easeOut: Easing.out(Easing.ease),
};

// Points an eased segment is sampled at, so the native driver's linear interpolation follows the
// curve closely.
const SAMPLES = 12;
// How long before the next keyframe a step holds its value, as a fraction of the cycle.
const STEP_HOLD = 0.0001;
// The least an input point may follow the one before it.
const MIN_GAP = 0.000001;

function createRange() {
  const inputRange = [];
  const outputRange = [];
  function push(at, value) {
    const last = inputRange[inputRange.length - 1];
    inputRange.push(last === undefined ? at : Math.max(at, last + MIN_GAP));
    outputRange.push(value);
  }
  return { inputRange, outputRange, push };
}

/**
 * An animation's keyframes as an interpolation of its clock, which runs from 0 to 1 over each
 * cycle: the native driver interpolates linearly between points, so an eased segment is
 * sampled into points along its curve, and a step holds its value until the next keyframe and
 * jumps there. Keyframes are sorted by `at`; the first value holds from 0 and the last until 1.
 *
 * @param {Object} params
 * @param {Object[]} params.keyframes `[{ at, value, easing }]`: `at` from 0 to 1 of the cycle, and
 *   the easing from this keyframe to the next.
 * @param {string} [params.easing] The easing of segments whose keyframe sets none: `linear`,
 *   `ease`, `easeIn`, `easeOut`, `easeInOut` (the default) or `step`.
 * @returns {{ inputRange: number[], outputRange: number[] }}
 */
function getKeyframeRange({ easing = 'easeInOut', keyframes }) {
  const sorted = [...keyframes].sort((a, b) => a.at - b.at);
  const first = sorted[0];
  const last = sorted[sorted.length - 1];
  const frames = [
    ...(first.at > 0 ? [{ at: 0, value: first.value }] : []),
    ...sorted,
    ...(last.at < 1 ? [{ at: 1, value: last.value }] : []),
  ];
  const range = createRange();
  range.push(frames[0].at, frames[0].value);
  for (let index = 1; index < frames.length; index += 1) {
    const from = frames[index - 1];
    const to = frames[index];
    const segmentEasing = from.easing ?? easing;
    const span = to.at - from.at;
    if (segmentEasing === 'step' && span > 0) {
      range.push(to.at - Math.min(STEP_HOLD, span / 2), from.value);
    }
    if (EASINGS[segmentEasing] !== undefined && span > 0) {
      for (let sample = 1; sample < SAMPLES; sample += 1) {
        const t = sample / SAMPLES;
        range.push(
          from.at + span * t,
          from.value + (to.value - from.value) * EASINGS[segmentEasing](t)
        );
      }
    }
    range.push(to.at, to.value);
  }
  return { inputRange: range.inputRange, outputRange: range.outputRange };
}

export default getKeyframeRange;
