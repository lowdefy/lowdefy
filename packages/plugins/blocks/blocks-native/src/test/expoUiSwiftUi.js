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
import { Pressable, Text, View } from 'react-native';

// Stand-ins for the @expo/ui SwiftUI views the blocks use, which need native modules Jest does not
// have. ContextMenu draws its trigger, and its items as pressable buttons with the props the
// block passes, so a test can press an item.

function Host({ children, colorScheme, testID }) {
  return (
    <View colorScheme={colorScheme} testID={testID}>
      {children}
    </View>
  );
}

function Slot({ children }) {
  return <>{children}</>;
}

function ContextMenu({ children }) {
  return <View testID="expo-ui-context-menu">{children}</View>;
}
ContextMenu.Items = function Items({ children }) {
  return <View testID="expo-ui-context-menu-items">{children}</View>;
};
ContextMenu.Trigger = Slot;
ContextMenu.Preview = Slot;

function Button({ label, onPress, role, systemImage }) {
  return (
    <Pressable
      onPress={onPress}
      role={role}
      systemImage={systemImage}
      testID={`expo-ui-button-${label}`}
    >
      <Text>{label}</Text>
    </Pressable>
  );
}

function RNHostView({ children }) {
  return children;
}

export { Button, ContextMenu, Host, RNHostView };
