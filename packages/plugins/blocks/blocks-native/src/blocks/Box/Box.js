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

import React from 'react';
import { Animated, Pressable, Text, View } from 'react-native';
import { type } from '@lowdefy/helpers';
import { useTheme } from '@lowdefy/client-native';

import getIosTextStyle from '../../typography/getIosTextStyle.js';
import meta from './meta.js';
import useSwipeGesture from './useSwipeGesture.js';

const SWIPE_ACTIONS = [
  { direction: 'left', event: 'onSwipeLeft', label: 'Swipe left', name: 'swipeLeft' },
  { direction: 'right', event: 'onSwipeRight', label: 'Swipe right', name: 'swipeRight' },
];

// A plain container. With an onClick event it is pressable, and a content string is drawn as body
// text. With onSwipeLeft or onSwipeRight it takes clear horizontal swipes (useSwipeGesture), which
// screen readers get as the Box's accessibility actions.
function Box({ content, events, methods, properties, styles = {} }) {
  const { tokens } = useTheme();
  const swipeActions = SWIPE_ACTIONS.filter((action) => !type.isNone(events[action.event]));
  const gesture = useSwipeGesture({
    directions: swipeActions.map((action) => action.direction),
    feedback: properties.swipeFeedback === true,
    methods,
  });
  const children = type.isString(properties.content) ? (
    <Text style={getIosTextStyle({ textStyle: 'body', tokens })}>{properties.content}</Text>
  ) : (
    content.content?.()
  );
  const accessibilityProps =
    swipeActions.length === 0
      ? {}
      : {
          accessibilityActions: swipeActions.map(({ label, name }) => ({ label, name })),
          onAccessibilityAction: (event) => {
            const action = swipeActions.find(({ name }) => name === event.nativeEvent.actionName);
            gesture.swipe(action.direction);
          },
        };
  const moved = { transform: [{ translateX: gesture.translateX }] };
  if (events.onClick) {
    const button = (
      <Pressable
        {...accessibilityProps}
        accessibilityRole="button"
        onPress={() => methods.triggerEvent({ name: 'onClick' })}
        style={styles.element}
      >
        {children}
      </Pressable>
    );
    if (swipeActions.length === 0) {
      return button;
    }
    // A Pressable sets its own responder handlers, so the swipe is taken by a view around it.
    return (
      <Animated.View {...gesture.panHandlers} style={moved}>
        {button}
      </Animated.View>
    );
  }
  if (swipeActions.length === 0) {
    return <View style={styles.element}>{children}</View>;
  }
  return (
    <Animated.View {...gesture.panHandlers} {...accessibilityProps} style={[styles.element, moved]}>
      {children}
    </Animated.View>
  );
}

Box.meta = meta;

export default Box;
