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

import React, { useMemo, useRef, useState } from 'react';
import { Animated, PanResponder, Pressable, Text, View } from 'react-native';

const ACTION_WIDTH = 80;
// A horizontal drag this far, and further than it is vertical, opens the row rather than
// scrolling the page.
const DRAG_THRESHOLD = 10;

function getActionColor({ action, tokens }) {
  if (action.danger === true) return tokens.colorError;
  return action.color ?? tokens.colorPrimary;
}

/**
 * A List item whose swipe actions show when it is dragged to the left, as iOS mail rows do.
 * Pressing an action closes the row and calls `onAction`. Screen readers get the actions as
 * the row's accessibility actions.
 *
 * @param {Object} props
 * @param {{ title: string, event: string, color?: string, danger?: boolean }[]} props.actions
 * @param {(action: Object) => void} props.onAction
 * @param {string} props.testID The item's test id; each action is `<testID>_<event>`.
 * @param {Object} props.tokens The List's antd tokens.
 */
function SwipeableRow({ actions, children, onAction, testID, tokens }) {
  const [open, setOpen] = useState(false);
  const translateX = useRef(new Animated.Value(0)).current;
  const offset = useRef(0);
  const width = actions.length * ACTION_WIDTH;
  const settle = (to) => {
    offset.current = to;
    setOpen(to !== 0);
    Animated.spring(translateX, { toValue: to, useNativeDriver: true }).start();
  };
  const panResponder = useMemo(
    () =>
      PanResponder.create({
        onMoveShouldSetPanResponder: (event, gesture) =>
          Math.abs(gesture.dx) > DRAG_THRESHOLD && Math.abs(gesture.dx) > Math.abs(gesture.dy),
        onPanResponderMove: (event, gesture) =>
          translateX.setValue(Math.min(0, Math.max(-width, offset.current + gesture.dx))),
        onPanResponderRelease: (event, gesture) =>
          settle(offset.current + gesture.dx < -width / 2 ? -width : 0),
        onPanResponderTerminate: () => settle(offset.current),
      }),
    // settle only reads refs and state setters.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [translateX, width]
  );
  const runAction = (action) => {
    settle(0);
    onAction(action);
  };
  return (
    <View
      accessibilityActions={actions.map((action) => ({ name: action.event, label: action.title }))}
      onAccessibilityAction={(event) =>
        runAction(actions.find((action) => action.event === event.nativeEvent.actionName))
      }
      testID={`${testID}_row`}
    >
      <View
        accessibilityElementsHidden={!open}
        importantForAccessibility={open ? 'auto' : 'no-hide-descendants'}
        style={{ bottom: 0, flexDirection: 'row', position: 'absolute', right: 0, top: 0 }}
      >
        {actions.map((action) => (
          <Pressable
            accessibilityLabel={action.title}
            accessibilityRole="button"
            key={action.event}
            onPress={() => runAction(action)}
            style={{
              alignItems: 'center',
              backgroundColor: getActionColor({ action, tokens }),
              justifyContent: 'center',
              width: ACTION_WIDTH,
            }}
            testID={`${testID}_${action.event}`}
          >
            <Text style={{ color: tokens.colorTextLightSolid, fontSize: tokens.fontSize }}>
              {action.title}
            </Text>
          </Pressable>
        ))}
      </View>
      <Animated.View
        {...panResponder.panHandlers}
        style={{ backgroundColor: tokens.colorBgContainer, transform: [{ translateX }] }}
      >
        {children}
      </Animated.View>
    </View>
  );
}

export default SwipeableRow;
