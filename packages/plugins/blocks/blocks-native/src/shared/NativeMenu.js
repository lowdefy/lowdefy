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

import React, { useState } from 'react';
import { View } from 'react-native';
import { MenuView } from '@expo/ui/community/menu';

/**
 * A native menu opened from a trigger of React Native views: a SwiftUI Menu (tap) or
 * ContextMenu (long press, with a lifted preview) on iOS, a Material dropdown menu on Android.
 * The platform draws the press highlight, so the trigger holds no pressable of its own.
 *
 * The native host takes the size of the trigger, so a full-width trigger is given the measured
 * width of the space it sits in.
 *
 * @param {Object} props
 * @param {Object[]} props.actions MenuView actions.
 * @param {boolean} [props.disabled] Draw the trigger dimmed, with no menu.
 * @param {boolean} [props.fullWidth] Stretch the trigger across its container.
 * @param {Object} [props.menuRef] Takes the menu's `{ show }`, for a trigger that is pressable
 *   itself: on Android the menu's own press never reaches past a pressable trigger.
 * @param {string} [props.menuTitle] A title at the top of the menu, on iOS.
 * @param {Function} props.onSelect Called with the picked action's id.
 * @param {boolean} [props.openOnLongPress]
 * @param {string} [props.testID]
 */
function NativeMenu({
  actions,
  children,
  disabled,
  fullWidth,
  menuRef,
  menuTitle,
  onSelect,
  openOnLongPress,
  testID,
}) {
  const [width, setWidth] = useState(null);
  const alignSelf = fullWidth ? 'stretch' : 'flex-start';
  if (disabled) {
    return (
      <View
        accessibilityState={{ disabled: true }}
        style={{ alignSelf, opacity: 0.5 }}
        testID={testID}
      >
        {children}
      </View>
    );
  }
  return (
    <View
      onLayout={
        fullWidth ? (event) => setWidth(Math.round(event.nativeEvent.layout.width)) : undefined
      }
      style={{ alignSelf }}
    >
      <MenuView
        actions={actions}
        onPressAction={({ nativeEvent }) => onSelect(nativeEvent.event)}
        ref={menuRef}
        shouldOpenOnLongPress={openOnLongPress === true}
        testID={testID}
        title={menuTitle}
      >
        <View style={fullWidth && width !== null ? { width } : null}>{children}</View>
      </MenuView>
    </View>
  );
}

export default NativeMenu;
