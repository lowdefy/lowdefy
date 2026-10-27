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

import { Animated, Easing } from 'react-native';

/**
 * One clock every loading placeholder shimmers by: a progress from 0 to 1 over `duration`, on a
 * loop, on the native driver. It runs while at least one placeholder holds it (acquire) and
 * stops, back at 0, when the last lets go (release), so every shape on screen sweeps in step and
 * nothing animates when no skeleton shows.
 *
 * @param {Object} params
 * @param {number} params.duration One sweep, in milliseconds.
 * @returns {{ acquire: Function, isRunning: Function, progress: Animated.Value, release: Function }}
 */
function createShimmerClock({ duration }) {
  const progress = new Animated.Value(0);
  let holders = 0;
  let loop = null;

  function acquire() {
    holders += 1;
    if (loop !== null) return;
    loop = Animated.loop(
      Animated.timing(progress, {
        duration,
        easing: Easing.inOut(Easing.quad),
        toValue: 1,
        useNativeDriver: true,
      })
    );
    loop.start();
  }

  function release() {
    holders = Math.max(0, holders - 1);
    if (holders > 0 || loop === null) return;
    loop.stop();
    loop = null;
    progress.setValue(0);
  }

  function isRunning() {
    return loop !== null;
  }

  return { acquire, isRunning, progress, release };
}

export default createShimmerClock;
