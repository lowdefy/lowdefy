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

const DURATION = 1400;

// A progress that sweeps from 0 to 1 and starts again, the light a loading placeholder shimmers
// with. Every shape starts its own sweep on mount, at the same pace, so a screen of rows shimmers
// together. It runs on the native driver.
function useShimmer() {
  const progress = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    const loop = Animated.loop(
      Animated.timing(progress, {
        duration: DURATION,
        easing: Easing.inOut(Easing.ease),
        toValue: 1,
        useNativeDriver: true,
      })
    );
    loop.start();
    return () => loop.stop();
  }, [progress]);
  return progress;
}

export default useShimmer;
