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

import useScreenFooter from '../screen/useScreenFooter.js';
import useTheme from '../theme/useTheme.js';

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

// Shows the theme tokens it is given, styled the way native blocks style themselves: its own
// defaults, then theme tokens, then the element slot's classes and style.
function Themed({ blockId, styles }) {
  const { tokens } = useTheme();
  return (
    <Text
      style={[
        { backgroundColor: tokens.colorBgContainer, color: tokens.colorText, padding: 4 },
        styles.element,
      ]}
      testID={`${blockId}-element`}
    >
      {JSON.stringify(tokens)}
    </Text>
  );
}
Themed.meta = { category: 'display' };

// The Icon block: an icon drawn through components.Icon, the native icon renderer.
function Icon({ components, properties }) {
  return <components.Icon properties={properties} />;
}
Icon.meta = { category: 'display' };

// Draws its own chrome in the page's footer (useScreenFooter), as AgentChat draws its composer, and
// calls the server through methods.streamFetch when pressed.
function FooterBar({ blockId, methods, properties }) {
  useScreenFooter(() => <Text testID={`${blockId}-footer`}>{properties.label}</Text>);
  return (
    <Pressable
      onPress={() => methods.streamFetch('/api/agent/home/assistant', { method: 'POST' })}
      testID={`${blockId}-press`}
    >
      <Text>Body of {blockId}</Text>
    </Pressable>
  );
}
FooterBar.meta = { category: 'display' };

export { Box, Button, FooterBar, Icon, List, Paragraph, TextInput, Themed, Title };
