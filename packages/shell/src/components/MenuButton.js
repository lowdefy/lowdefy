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
import { Modal, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useSessionState } from '../ShellContext.js';

const styles = StyleSheet.create({
  button: {
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  buttonText: {
    fontSize: 16,
  },
  backdrop: {
    flex: 1,
    flexDirection: 'row',
    backgroundColor: 'rgba(0,0,0,0.3)',
  },
  sheet: {
    width: '80%',
    maxWidth: 360,
    backgroundColor: '#ffffff',
  },
  item: {
    paddingHorizontal: 24,
    paddingVertical: 16,
  },
  itemText: {
    fontSize: 17,
  },
});

// The drawer frame: a header button that opens the app's drawer menu over the screen. Picking an
// item replaces the stack with that page.
function MenuButton({ items }) {
  const [open, setOpen] = useState(false);
  const { root } = useSessionState();
  const insets = useSafeAreaInsets();
  function openPage(pageId) {
    setOpen(false);
    const path = root.pageIndex.find((entry) => entry.pageId === pageId)?.path;
    if (router.canDismiss()) router.dismissAll();
    router.replace(`/${path}`);
  }
  return (
    <>
      <Pressable
        accessibilityLabel="Menu"
        accessibilityRole="button"
        onPress={() => setOpen(true)}
        style={styles.button}
        testID="shell-menu"
      >
        <Text style={styles.buttonText}>Menu</Text>
      </Pressable>
      <Modal animationType="fade" onRequestClose={() => setOpen(false)} transparent visible={open}>
        <View style={styles.backdrop}>
          <ScrollView style={[styles.sheet, { paddingTop: insets.top }]}>
            {items.map((item) => (
              <Pressable
                accessibilityRole="button"
                key={item.pageId}
                onPress={() => openPage(item.pageId)}
                style={styles.item}
                testID={`menu-${item.pageId}`}
              >
                <Text style={styles.itemText}>{item.title ?? item.pageId}</Text>
              </Pressable>
            ))}
          </ScrollView>
          <Pressable
            accessibilityLabel="Close menu"
            onPress={() => setOpen(false)}
            style={{ flex: 1 }}
          />
        </View>
      </Modal>
    </>
  );
}

export default MenuButton;
