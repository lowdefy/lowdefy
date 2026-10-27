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

import React, { useEffect, useRef } from 'react';
import { Animated } from 'react-native';

import useReduceMotion from './useReduceMotion.js';

const DURATION = 200;

/**
 * A view that fades its content in over 200ms when it mounts, as content does when it replaces
 * a loading skeleton. With Reduce Motion on, the content shows at once. It takes a View's props,
 * so BlockLayout draws it in place of its own View and the block's placement is unchanged.
 *
 * @param {Object} props View props.
 */
function FadeInView({ ref, style, ...props }) {
  const reduceMotion = useReduceMotion();
  const opacity = useRef(new Animated.Value(reduceMotion ? 1 : 0)).current;
  useEffect(() => {
    if (reduceMotion) {
      opacity.setValue(1);
      return undefined;
    }
    const animation = Animated.timing(opacity, {
      duration: DURATION,
      toValue: 1,
      useNativeDriver: true,
    });
    animation.start();
    return () => animation.stop();
  }, [opacity, reduceMotion]);
  return <Animated.View {...props} ref={ref} style={[style, { opacity }]} />;
}

export default FadeInView;
