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
import { KeyboardAvoidingView, Platform, StyleSheet, View } from 'react-native';

import useTheme from '../theme/useTheme.js';

/**
 * A Screen's footer slot, pinned to the bottom of the screen below its scroll view: above the tab
 * bar and the home indicator (`bottomInset`), and above the keyboard when it is up. It is drawn on
 * the bar material with a hairline above it, as an iOS toolbar is.
 *
 * On iOS the keyboard avoidance pads the footer by the keyboard's overlap less the bottom inset,
 * which the keyboard covers: the footer's content then sits on the keyboard. Android resizes the
 * window for the keyboard itself.
 *
 * @param {Object} props
 * @param {number} props.bottomInset The screen's bottom safe area (tab bar, home indicator).
 * @param {Object} props.footer The page's footer store (createFooterStore).
 */
function ScreenFooter({ bottomInset, footer }) {
  const { tokens } = useTheme();
  const render = useSyncExternalStore(footer.subscribe, footer.get);
  if (render === null) {
    return null;
  }
  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={-bottomInset}
      style={{
        backgroundColor: tokens.colorBar,
        borderTopColor: tokens.colorSeparator,
        borderTopWidth: StyleSheet.hairlineWidth,
      }}
      testID="screen-footer"
    >
      <View style={{ paddingBottom: bottomInset }}>{render()}</View>
    </KeyboardAvoidingView>
  );
}

export default ScreenFooter;
