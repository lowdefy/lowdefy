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

// Small stand-ins for the native block set, with the block metas the skeleton of
// @lowdefy/blocks-native declares.
function Box({ blockId, content, events, methods }) {
  if (events.onClick) {
    return (
      <Pressable
        onPress={() => methods.triggerEvent({ name: 'onClick' })}
        testID={`${blockId}-press`}
      >
        {content.content?.()}
      </Pressable>
    );
  }
  return <View>{content.content?.()}</View>;
}
Box.meta = { category: 'container', slots: { content: 'Child blocks.' } };

function Title({ properties }) {
  return <Text accessibilityRole="header">{properties.content}</Text>;
}
Title.meta = { category: 'display' };

function Paragraph({ properties }) {
  return <Text>{properties.content}</Text>;
}
Paragraph.meta = { category: 'display' };

function Button({ methods, properties }) {
  return (
    <Pressable
      accessibilityRole="button"
      disabled={properties.disabled === true}
      onPress={() => methods.triggerEvent({ name: 'onClick' })}
    >
      <Text>{properties.title}</Text>
    </Pressable>
  );
}
Button.meta = { category: 'display' };

function TextInput({ value }) {
  return <Text testID="text-input-value">{value ?? ''}</Text>;
}
TextInput.meta = { category: 'input', valueType: 'string' };

function List({ list }) {
  return <View>{list.map((item) => item.content?.())}</View>;
}
List.meta = { category: 'list', valueType: 'array', slots: { content: 'Each item.' } };

export { Box, Button, List, Paragraph, TextInput, Title };
