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

// An opacity that fades between full and half while `active`, the pulse a loading placeholder
// shows. It runs on the native driver.
function usePulse(active) {
  const opacity = useRef(new Animated.Value(1)).current;
  useEffect(() => {
    if (!active) return undefined;
    const fade = (toValue) =>
      Animated.timing(opacity, {
        duration: 800,
        easing: Easing.inOut(Easing.ease),
        toValue,
        useNativeDriver: true,
      });
    const loop = Animated.loop(Animated.sequence([fade(0.5), fade(1)]));
    loop.start();
    return () => {
      loop.stop();
      opacity.setValue(1);
    };
  }, [active, opacity]);
  return opacity;
}

export default usePulse;
