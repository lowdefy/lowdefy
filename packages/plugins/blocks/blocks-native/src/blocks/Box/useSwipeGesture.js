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

import { useMemo, useRef } from 'react';
import { Animated, PanResponder } from 'react-native';

import getRubberBand from './getRubberBand.js';
import getSwipeDirection from './getSwipeDirection.js';
import isSwipeGesture from './isSwipeGesture.js';

const EVENTS = { left: 'onSwipeLeft', right: 'onSwipeRight' };

/**
 * A Box's swipe: a pan responder that takes only clear horizontal swipes in the directions the
 * Box has events for (isSwipeGesture), so vertical scrolls, the back gesture and the swipes of
 * rows inside the Box go on as they would. A release that is still a swipe fires onSwipeLeft or
 * onSwipeRight, judged on the whole drag from the touch's start. With `feedback`, the Box follows
 * the drag on a rubber band from where it took the swipe (getRubberBand), and springs back on
 * release.
 *
 * @param {Object} params
 * @param {('left'|'right')[]} params.directions The directions the Box has swipe events for.
 * @param {boolean} params.feedback Whether the Box moves with the drag.
 * @param {Object} params.methods The block's methods.
 * @returns {{ panHandlers: Object, swipe: (direction: string) => void, translateX: Object }}
 */
function useSwipeGesture({ directions, feedback, methods }) {
  const translateX = useRef(new Animated.Value(0)).current;
  // The responder is made once; it reads the props of the latest render.
  const latest = useRef({});
  latest.current = { directions, feedback, methods };
  return useMemo(() => {
    // The drag before the Box took it: the pan responder measures from where it was granted.
    const taken = { dx: 0, dy: 0 };
    function swipe(direction) {
      latest.current.methods.triggerEvent({ name: EVENTS[direction] });
    }
    function settle() {
      Animated.spring(translateX, {
        bounciness: 4,
        speed: 16,
        toValue: 0,
        useNativeDriver: true,
      }).start();
    }
    const panResponder = PanResponder.create({
      onMoveShouldSetPanResponder: (event, { dx, dy, moveX, vx }) => {
        if (!isSwipeGesture({ directions: latest.current.directions, dx, dy, moveX, vx })) {
          return false;
        }
        taken.dx = dx;
        taken.dy = dy;
        return true;
      },
      onPanResponderGrant: () => {
        translateX.stopAnimation();
      },
      // The Box moves from where it took the swipe, so it does not jump by the 40pt it took.
      onPanResponderMove: (event, { dx }) => {
        if (!latest.current.feedback) return;
        const toward = dx < 0 ? 'left' : 'right';
        translateX.setValue(latest.current.directions.includes(toward) ? getRubberBand(dx) : 0);
      },
      onPanResponderRelease: (event, { dx, dy, vx }) => {
        settle();
        const direction = getSwipeDirection({ dx: taken.dx + dx, dy: taken.dy + dy, vx });
        if (latest.current.directions.includes(direction)) {
          swipe(direction);
        }
      },
      // Once the Box has the swipe, the page does not scroll with it.
      onPanResponderTerminationRequest: () => false,
      onPanResponderTerminate: settle,
    });
    return { panHandlers: panResponder.panHandlers, swipe, translateX };
  }, [translateX]);
}

export default useSwipeGesture;
