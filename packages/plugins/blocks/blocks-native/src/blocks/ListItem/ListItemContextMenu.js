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
import { View } from 'react-native';

import getSfSymbol from './getSfSymbol.js';

/**
 * iOS's native context menu around a row: a long press lifts the row and shows its items, as
 * Mail and Linear rows do. The row is React Native content hosted in the SwiftUI menu's trigger.
 * iOS only; Android shows a Material menu on long press (NativeMenu).
 *
 * @param {Object} props
 * @param {boolean} props.isDark
 * @param {{ id: string, title: string, icon?: string|Object, destructive?: boolean }[]} props.items
 * @param {(item: Object) => void} props.onSelect
 * @param {string} props.testID
 */
function ListItemContextMenu({ children, isDark, items, onSelect, testID }) {
  // Required when drawn, not imported: SwiftUI views exist only on iOS, and ListItem draws this
  // menu only there (as @expo/ui's universal components load @expo/ui/swift-ui only on iOS).
  // eslint-disable-next-line global-require
  const { Button, ContextMenu, Host, RNHostView } = require('@expo/ui/swift-ui');
  return (
    <Host
      colorScheme={isDark ? 'dark' : 'light'}
      matchContents={{ vertical: true }}
      style={{ alignSelf: 'stretch' }}
      testID={testID}
    >
      <ContextMenu>
        <ContextMenu.Items>
          {items.map((item) => (
            <Button
              key={item.id}
              label={item.title}
              onPress={() => onSelect(item)}
              role={item.destructive === true ? 'destructive' : undefined}
              systemImage={getSfSymbol(item.icon)}
            />
          ))}
        </ContextMenu.Items>
        <ContextMenu.Trigger>
          <RNHostView matchContents={{ vertical: true }}>
            {/* The row is as wide as the menu's trigger, never as wide as its title would like. */}
            <View style={{ width: '100%' }}>{children}</View>
          </RNHostView>
        </ContextMenu.Trigger>
      </ContextMenu>
    </Host>
  );
}

export default ListItemContextMenu;
