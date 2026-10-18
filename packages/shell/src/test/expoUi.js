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
import { Text, View } from 'react-native';

// Stand-ins for the @expo/ui controls the native blocks use: @expo/ui draws SwiftUI and Jetpack
// Compose views through native modules Jest does not have. They keep the props the blocks pass,
// so a test fires their callbacks with fireEvent(view, 'valueChange', ...).
function Host({ children }) {
  return <View>{children}</View>;
}

function Picker({ children, onValueChange, selectedValue, testID }) {
  const items = React.Children.toArray(children).map((child) => child.props);
  return (
    <View items={items} onValueChange={onValueChange} selectedValue={selectedValue} testID={testID}>
      {items.map((item) => (
        <Text key={String(item.value)}>{item.label}</Text>
      ))}
    </View>
  );
}
Picker.Item = () => null;

function Switch({ onValueChange, testID, value }) {
  return <View onValueChange={onValueChange} testID={testID} value={value} />;
}

function Icon({ color, modifiers, name, size }) {
  return (
    <View
      color={color}
      modifiers={modifiers}
      name={name}
      size={size}
      testID={`expo-ui-icon-${name}`}
    />
  );
}

export { Host, Icon, Picker, Switch };
