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
import { Animated, PanResponder, Pressable, StyleSheet, Text, View } from 'react-native';
import { type } from '@lowdefy/helpers';

import getToneColor from './getToneColor.js';
import playFeedback from '../device/playFeedback.js';

const ACTION_WIDTH = 74;
// A horizontal drag this far, and clearly more horizontal than vertical, swipes the row rather
// than scrolling the page.
const DRAG_THRESHOLD = 10;
// Dragged this far across the row, a release runs the action at the edge, as a full swipe on iOS.
const FULL_SWIPE_RATIO = 0.6;
const FLICK_VELOCITY = 0.5;
// Wider than any phone: the trays track the drag up to the full row width.
const MAX_TRAY_WIDTH = 10000;

function ActionTray({ actions, fullSide, Icon, onPress, open, side, testID, tokens, translateX }) {
  const width =
    side === 'leading'
      ? translateX.interpolate({
          inputRange: [0, MAX_TRAY_WIDTH],
          outputRange: [0, MAX_TRAY_WIDTH],
          extrapolate: 'clamp',
        })
      : translateX.interpolate({
          inputRange: [-MAX_TRAY_WIDTH, 0],
          outputRange: [MAX_TRAY_WIDTH, 0],
          extrapolate: 'clamp',
        });
  return (
    <Animated.View
      accessibilityElementsHidden={!open}
      importantForAccessibility={open ? 'auto' : 'no-hide-descendants'}
      style={{
        bottom: 0,
        // The first action sits at the row's edge, as SwiftUI orders swipe actions.
        flexDirection: side === 'leading' ? 'row' : 'row-reverse',
        overflow: 'hidden',
        position: 'absolute',
        top: 0,
        width,
        [side === 'leading' ? 'left' : 'right']: 0,
      }}
    >
      {actions.map((action, index) => {
        const hidden = fullSide === side && index > 0;
        return (
          <Pressable
            accessibilityLabel={action.title ?? action.id}
            accessibilityRole="button"
            key={action.id}
            onPress={() => onPress(action)}
            style={{
              alignItems: 'center',
              backgroundColor: getToneColor({ action, tokens }),
              flex: hidden ? 0 : 1,
              gap: 2,
              justifyContent: 'center',
              minWidth: 0,
              overflow: 'hidden',
              width: hidden ? 0 : undefined,
            }}
            testID={`${testID}_${action.id}`}
          >
            {type.isNone(action.icon) ? null : (
              <Icon
                properties={action.icon}
                styles={{ element: { color: tokens.colorTextLightSolid, fontSize: 22 } }}
              />
            )}
            {type.isString(action.title) ? (
              <Text
                numberOfLines={1}
                style={{
                  color: tokens.colorTextLightSolid,
                  fontSize: type.isNone(action.icon) ? 15 : 13,
                  fontWeight: '500',
                  paddingHorizontal: 4,
                }}
              >
                {action.title}
              </Text>
            ) : null}
          </Pressable>
        );
      })}
    </Animated.View>
  );
}

/**
 * A row with iOS swipe actions: dragged right it shows its leading actions, dragged left its
 * trailing ones, the first action of each side at the row's edge. A release past half the
 * actions' width leaves them open; a press on an action, or on the row, closes it again. On a side
 * `fullSwipe` allows, dragging most of the way across runs the edge action, as Mail's swipe to
 * mark read does. Screen readers get every action as one of the row's accessibility actions.
 *
 * Drawn with Animated and PanResponder: a SwiftUI swipe action only works inside a SwiftUI List,
 * and a List block's items are React Native views.
 *
 * @param {Object} props
 * @param {string} props.background The row's background colour, which the content slides on.
 * @param {{ leading?: boolean, trailing?: boolean }} [props.fullSwipe] The sides on which a full
 *   swipe runs the edge action. Neither by default.
 * @param {Function} props.Icon The icon renderer (components.Icon).
 * @param {{ id: string, title?: string, icon?: string|Object, tone?: string, color?: string }[]} [props.leading]
 * @param {(action: Object) => void} props.onAction
 * @param {string} props.testID Each action is `<testID>_<id>`, the row `<testID>_row`.
 * @param {Object} props.tokens The block's theme tokens.
 * @param {Object[]} [props.trailing]
 */
function SwipeableRow({
  background,
  children,
  fullSwipe = {},
  Icon,
  leading = [],
  onAction,
  testID,
  tokens,
  trailing = [],
}) {
  const [openSide, setOpenSide] = useState(null);
  const [fullSide, setFullSide] = useState(null);
  const translateX = useRef(new Animated.Value(0)).current;
  const offset = useRef(0);
  const rowWidth = useRef(0);
  const fullSideRef = useRef(null);
  // The pan responder is made once; it reads the actions of the latest render.
  const latest = useRef({});
  latest.current = { fullSwipe, leading, onAction, trailing };

  const gesture = useMemo(() => {
    // How far the row may be dragged to a side: nowhere without actions, the actions' width, or
    // the whole row where a full swipe is allowed.
    function getReach(side) {
      const actions = latest.current[side];
      if (actions.length === 0) return 0;
      if (latest.current.fullSwipe[side] === true) {
        return Math.max(rowWidth.current, ACTION_WIDTH);
      }
      return actions.length * ACTION_WIDTH;
    }
    function getLimits() {
      return { max: getReach('leading'), min: -getReach('trailing') };
    }
    function clamp(x) {
      const { max, min } = getLimits();
      return Math.min(max, Math.max(min, x));
    }
    function isFullSwipe(x) {
      const side = x > 0 ? 'leading' : 'trailing';
      return (
        latest.current.fullSwipe[side] === true &&
        rowWidth.current > 0 &&
        Math.abs(x) > rowWidth.current * FULL_SWIPE_RATIO
      );
    }
    function markFullSide(x) {
      let side = null;
      if (isFullSwipe(x)) side = x > 0 ? 'leading' : 'trailing';
      if (side !== fullSideRef.current) {
        fullSideRef.current = side;
        setFullSide(side);
      }
    }
    function animateTo(to) {
      offset.current = to;
      Animated.spring(translateX, {
        bounciness: 0,
        speed: 20,
        toValue: to,
        useNativeDriver: false,
      }).start();
    }
    function close() {
      setOpenSide(null);
      markFullSide(0);
      animateTo(0);
    }
    function runAction(action) {
      close();
      latest.current.onAction(action);
    }
    function release(x, velocity) {
      const { leading: start, trailing: end } = latest.current;
      if (isFullSwipe(x)) {
        playFeedback('medium');
        runAction(x > 0 ? start[0] : end[0]);
        return;
      }
      const startWidth = start.length * ACTION_WIDTH;
      const endWidth = end.length * ACTION_WIDTH;
      if (x > 0 && (x > startWidth / 2 || velocity > FLICK_VELOCITY)) {
        setOpenSide('leading');
        animateTo(startWidth);
        return;
      }
      if (x < 0 && (x < -endWidth / 2 || velocity < -FLICK_VELOCITY)) {
        setOpenSide('trailing');
        animateTo(-endWidth);
        return;
      }
      close();
    }
    function isHorizontalSwipe(event, { dx, dy }) {
      return Math.abs(dx) > DRAG_THRESHOLD && Math.abs(dx) > Math.abs(dy) * 1.5;
    }
    const panResponder = PanResponder.create({
      // Capture, so a horizontal drag that starts on a pressable row still swipes it.
      onMoveShouldSetPanResponderCapture: isHorizontalSwipe,
      onMoveShouldSetPanResponder: isHorizontalSwipe,
      onPanResponderGrant: () => {
        translateX.stopAnimation((value) => {
          offset.current = value;
        });
      },
      onPanResponderMove: (event, { dx }) => {
        const x = clamp(offset.current + dx);
        translateX.setValue(x);
        markFullSide(x);
      },
      onPanResponderRelease: (event, { dx, vx }) => release(clamp(offset.current + dx), vx),
      onPanResponderTerminationRequest: () => false,
      onPanResponderTerminate: (event, { dx }) => release(clamp(offset.current + dx), 0),
    });
    return { close, panResponder, runAction };
    // translateX is a ref value; everything else is read from `latest`.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const actions = [...leading, ...trailing];
  return (
    <View
      accessibilityActions={actions.map((action) => ({
        name: action.id,
        label: action.title ?? action.id,
      }))}
      onAccessibilityAction={(event) =>
        gesture.runAction(actions.find((action) => action.id === event.nativeEvent.actionName))
      }
      onLayout={(event) => {
        rowWidth.current = event.nativeEvent.layout.width;
      }}
      style={{ backgroundColor: background, overflow: 'hidden' }}
      testID={`${testID}_row`}
    >
      {['leading', 'trailing'].map((side) => {
        const sideActions = side === 'leading' ? leading : trailing;
        if (sideActions.length === 0) return null;
        return (
          <ActionTray
            actions={sideActions}
            fullSide={fullSide}
            Icon={Icon}
            key={side}
            onPress={gesture.runAction}
            open={openSide === side}
            side={side}
            testID={testID}
            tokens={tokens}
            translateX={translateX}
          />
        );
      })}
      <Animated.View
        {...gesture.panResponder.panHandlers}
        style={{ backgroundColor: background, transform: [{ translateX }] }}
      >
        {children}
        {openSide === null ? null : (
          <Pressable
            accessibilityElementsHidden
            importantForAccessibility="no-hide-descendants"
            onPress={gesture.close}
            style={StyleSheet.absoluteFill}
            testID={`${testID}_close`}
          />
        )}
      </Animated.View>
    </View>
  );
}

export default SwipeableRow;
