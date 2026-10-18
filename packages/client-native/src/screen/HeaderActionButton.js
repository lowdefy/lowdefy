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
import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';

import useTheme from '../theme/useTheme.js';

const SIZE = 36;
const ICON_SIZE = 22;

const styles = StyleSheet.create({
  backdrop: { flex: 1 },
  menu: {
    borderRadius: 12,
    minWidth: 200,
    overflow: 'hidden',
    position: 'absolute',
    right: 8,
    top: 56,
  },
  row: { paddingHorizontal: 16, paddingVertical: 12 },
});

// An action's menu where the platform has no native bar button menu: its items in a card under
// the header's right edge. Picking an item closes the menu and runs it; a tap outside closes it.
function HeaderActionMenu({ menu, onClose, visible }) {
  const { tokens } = useTheme();
  return (
    <Modal animationType="fade" onRequestClose={onClose} transparent visible={visible}>
      <Pressable accessibilityLabel="Close menu" onPress={onClose} style={styles.backdrop}>
        <View style={[styles.menu, { backgroundColor: tokens.colorCell }]}>
          {menu.map((item, index) => (
            <Pressable
              accessibilityRole="menuitem"
              accessibilityState={{ disabled: item.disabled }}
              disabled={item.disabled}
              key={item.id}
              onPress={() => {
                onClose();
                item.onPress();
              }}
              style={({ pressed }) => [
                styles.row,
                index > 0 && {
                  borderTopColor: tokens.colorSeparator,
                  borderTopWidth: StyleSheet.hairlineWidth,
                },
                pressed && { backgroundColor: tokens.colorCellPressed },
              ]}
              testID={`header-menu-${item.id}`}
            >
              <Text
                style={{
                  color: item.destructive ? tokens.colorError : tokens.colorLabel,
                  fontSize: 17,
                  opacity: item.disabled ? 0.4 : 1,
                }}
              >
                {item.title}
              </Text>
            </Pressable>
          ))}
        </View>
      </Pressable>
    </Modal>
  );
}

/**
 * One of a Screen's header actions as an icon button at its natural size: a 36pt square holding a
 * 22pt icon, in the label colour. A native bar puts its glass background around it (iOS 26),
 * which draws the compact circular button iOS's own header buttons are. The shell draws it where
 * the platform has no native bar button for the action (Android, or an icon with no SF Symbol).
 * An action with a menu opens it in place of running.
 */
function HeaderActionButton({ action, Icon, testID }) {
  const { tokens } = useTheme();
  const [menuOpen, setMenuOpen] = useState(false);
  const hasMenu = action.menu !== null;
  return (
    <>
      <Pressable
        accessibilityLabel={action.title}
        accessibilityRole="button"
        accessibilityState={{ disabled: action.disabled, expanded: hasMenu ? menuOpen : undefined }}
        disabled={action.disabled}
        hitSlop={4}
        onPress={hasMenu ? () => setMenuOpen(true) : action.onPress}
        style={({ pressed }) => ({
          alignItems: 'center',
          height: SIZE,
          justifyContent: 'center',
          opacity: action.disabled || pressed ? 0.4 : 1,
          width: SIZE,
        })}
        testID={testID}
      >
        <Icon
          properties={{ name: action.icon, title: '' }}
          styles={{ element: { color: tokens.colorLabel, fontSize: ICON_SIZE } }}
        />
      </Pressable>
      {hasMenu ? (
        <HeaderActionMenu
          menu={action.menu}
          onClose={() => setMenuOpen(false)}
          visible={menuOpen}
        />
      ) : null}
    </>
  );
}

export default HeaderActionButton;
