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

import { useEffect, useMemo } from 'react';
import { Animated, Easing } from 'react-native';

import createIllustrationMotion from './createIllustrationMotion.js';

function startClock(clock) {
  const timing = Animated.timing(clock.value, {
    duration: clock.duration,
    easing: Easing.linear,
    isInteraction: false,
    toValue: 1,
    useNativeDriver: true,
  });
  const run = clock.loop ? Animated.loop(timing) : timing;
  const animation = clock.delay > 0 ? Animated.sequence([Animated.delay(clock.delay), run]) : run;
  animation.start();
  return animation;
}

/**
 * Runs an Illustration's animations on the native driver while it is mounted, and returns each
 * target's view style. With Reduce Motion on nothing runs, and the drawing holds the pose of each
 * animation's start.
 *
 * @param {Object} params
 * @param {Object[]} params.animations The block's animations.
 * @param {boolean} params.reduceMotion Whether Reduce Motion is on.
 * @param {number} params.scale Points per unit of the drawing.
 * @param {number[]} params.viewBox The drawing's `[minX, minY, width, height]`.
 * @returns {Object} A view style per target id (createIllustrationMotion).
 */
function useIllustrationMotion({ animations, reduceMotion, scale, viewBox }) {
  const animationsKey = JSON.stringify(animations);
  const viewBoxKey = viewBox.join(' ');
  const motion = useMemo(
    () => createIllustrationMotion({ animations, scale, viewBox }),
    // animations and viewBox are read when their keys change.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [animationsKey, scale, viewBoxKey]
  );
  useEffect(() => {
    if (reduceMotion) return undefined;
    const running = motion.clocks.map(startClock);
    return () => {
      running.forEach((animation) => animation.stop());
      motion.clocks.forEach((clock) => clock.value.setValue(0));
    };
  }, [motion, reduceMotion]);
  return motion.styles;
}

export default useIllustrationMotion;
