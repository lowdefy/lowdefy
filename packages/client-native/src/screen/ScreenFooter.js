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

import React, { useSyncExternalStore } from 'react';
import { KeyboardAvoidingView, StyleSheet, View } from 'react-native';

import useKeyboardWindowOffset from './useKeyboardWindowOffset.js';
import useTheme from '../theme/useTheme.js';

/**
 * A Screen's footer slot, pinned to the bottom of the screen below its scroll view: above the tab
 * bar and the home indicator (`bottomInset`), and above the keyboard when it is up. It is drawn on
 * the bar material with a hairline above it, as an iOS toolbar is.
 *
 * The keyboard avoidance pads the footer by the keyboard's overlap less the bottom inset, which
 * the keyboard covers: the footer's content then sits on the keyboard. Android apps are
 * edge-to-edge, so the window no longer resizes for the keyboard there either; on Android the
 * overlap also counts the footer's distance from the top of the window (useKeyboardWindowOffset),
 * as the page sits below an opaque header.
 *
 * @param {Object} props
 * @param {number} props.bottomInset The screen's bottom safe area (tab bar, home indicator).
 * @param {Object} props.footer The page's footer store (createFooterStore).
 */
function ScreenFooter({ bottomInset, footer }) {
  const { tokens } = useTheme();
  const render = useSyncExternalStore(footer.subscribe, footer.get);
  const windowOffset = useKeyboardWindowOffset();
  if (render === null) {
    return null;
  }
  return (
    <View collapsable={false} onLayout={windowOffset.onLayout} ref={windowOffset.ref}>
      <KeyboardAvoidingView
        behavior="padding"
        keyboardVerticalOffset={windowOffset.offset - bottomInset}
        style={{
          backgroundColor: tokens.colorBar,
          borderTopColor: tokens.colorSeparator,
          borderTopWidth: StyleSheet.hairlineWidth,
        }}
        testID="screen-footer"
      >
        <View style={{ paddingBottom: bottomInset }}>{render()}</View>
      </KeyboardAvoidingView>
    </View>
  );
}

export default ScreenFooter;
