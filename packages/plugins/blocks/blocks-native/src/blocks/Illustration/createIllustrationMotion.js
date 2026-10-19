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

import { Animated } from 'react-native';

import getKeyframeRange from './getKeyframeRange.js';

const TRANSFORMS = ['translateX', 'translateY', 'rotate', 'scale', 'scaleX', 'scaleY'];
const ADDED = new Set(['translateX', 'translateY', 'rotate']);
const TRANSLATES = new Set(['translateX', 'translateY']);

function getClock({ animation, clocks }) {
  const delay = animation.delay ?? 0;
  const loop = animation.loop ?? true;
  const key = `${animation.duration}|${delay}|${loop}`;
  if (clocks[key] === undefined) {
    clocks[key] = { delay, duration: animation.duration, loop, value: new Animated.Value(0) };
  }
  return clocks[key];
}

// One animation's value along its clock. Translations are in the drawing's units, so they are
// scaled to points.
function getAnimatedValue({ animation, clock, scale }) {
  const { inputRange, outputRange } = getKeyframeRange({
    easing: animation.easing,
    keyframes: animation.keyframes,
  });
  return clock.value.interpolate({
    extrapolate: 'clamp',
    inputRange,
    outputRange: TRANSLATES.has(animation.property)
      ? outputRange.map((value) => value * scale)
      : outputRange,
  });
}

// The animations of one target and property as one value: translations and rotations add up,
// scales and opacities multiply.
function combine({ property, values }) {
  return values.reduce((total, value) =>
    ADDED.has(property) ? Animated.add(total, value) : Animated.multiply(total, value)
  );
}

function getOrigin({ animations, scale, viewBox }) {
  const [minX, minY, width, height] = viewBox;
  const origin = animations.find((animation) => animation.origin !== undefined)?.origin ?? [
    minX + width / 2,
    minY + height / 2,
  ];
  return [(origin[0] - minX) * scale, (origin[1] - minY) * scale, 0];
}

function getTargetStyle({ animations, scale, values, viewBox }) {
  const style = {};
  if (values.opacity !== undefined) {
    style.opacity = combine({ property: 'opacity', values: values.opacity });
  }
  const transform = [];
  TRANSFORMS.forEach((property) => {
    if (values[property] === undefined) return;
    const value = combine({ property, values: values[property] });
    if (property === 'rotate') {
      transform.push({
        rotate: value.interpolate({
          extrapolate: 'extend',
          inputRange: [0, 360],
          outputRange: ['0deg', '360deg'],
        }),
      });
      return;
    }
    transform.push({ [property]: value });
  });
  if (transform.length > 0) {
    style.transform = transform;
    style.transformOrigin = getOrigin({ animations, scale, viewBox });
  }
  return style;
}

/**
 * An Illustration's animations as Animated values for the native driver. Animations that share a
 * duration, delay and loop share one clock (an Animated.Value from 0 to 1 over the duration), so
 * frames that swap on the same keyframe swap on the same frame.
 *
 * @param {Object} params
 * @param {Object[]} params.animations The block's animations.
 * @param {number} params.scale Points per unit of the drawing.
 * @param {number[]} params.viewBox The drawing's `[minX, minY, width, height]`.
 * @returns {{ clocks: Object[], styles: Object }} The clocks to run (`{ delay, duration, loop,
 *   value }`), and a view style per target id: its `opacity`, its `transform` (translateX,
 *   translateY, rotate, scale, scaleX and scaleY, in that order) and the `transformOrigin` they
 *   turn and scale about, in points within the drawing.
 */
function createIllustrationMotion({ animations, scale, viewBox }) {
  const clocks = {};
  const byTarget = {};
  animations.forEach((animation) => {
    const clock = getClock({ animation, clocks });
    const target = byTarget[animation.target] ?? { animations: [], values: {} };
    target.animations.push(animation);
    target.values[animation.property] = [
      ...(target.values[animation.property] ?? []),
      getAnimatedValue({ animation, clock, scale }),
    ];
    byTarget[animation.target] = target;
  });
  const styles = {};
  Object.keys(byTarget).forEach((id) => {
    styles[id] = getTargetStyle({ ...byTarget[id], scale, viewBox });
  });
  return { clocks: Object.values(clocks), styles };
}

export default createIllustrationMotion;
