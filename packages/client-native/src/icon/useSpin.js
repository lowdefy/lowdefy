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

import { useEffect, useRef } from 'react';
import { Animated, Easing } from 'react-native';

/**
 * A rotation that turns once a second while `active`, for spinning icons and loaders. It runs
 * on the native driver, so a busy JavaScript thread does not stall it.
 *
 * @param {boolean} active
 * @returns {Animated.AnimatedInterpolation} The rotation, for a `transform: [{ rotate }]`.
 */
function useSpin(active) {
  const turn = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    if (!active) return undefined;
    const loop = Animated.loop(
      Animated.timing(turn, {
        duration: 1000,
        easing: Easing.linear,
        toValue: 1,
        useNativeDriver: true,
      })
    );
    loop.start();
    return () => {
      loop.stop();
      turn.setValue(0);
    };
  }, [active, turn]);
  return turn.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '360deg'] });
}

export default useSpin;
