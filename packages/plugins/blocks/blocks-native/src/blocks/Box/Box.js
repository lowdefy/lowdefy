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
import { type } from '@lowdefy/helpers';
import { useTheme } from '@lowdefy/client-native';

import getIosTextStyle from '../../typography/getIosTextStyle.js';
import meta from './meta.js';

// A plain container. With an onClick event it is pressable, and a content string is drawn as body
// text.
function Box({ content, events, methods, properties, styles = {} }) {
  const { tokens } = useTheme();
  const children = type.isString(properties.content) ? (
    <Text style={getIosTextStyle({ textStyle: 'body', tokens })}>{properties.content}</Text>
  ) : (
    content.content?.()
  );
  if (events.onClick) {
    return (
      <Pressable
        accessibilityRole="button"
        onPress={() => methods.triggerEvent({ name: 'onClick' })}
        style={styles.element}
      >
        {children}
      </Pressable>
    );
  }
  return <View style={styles.element}>{children}</View>;
}

Box.meta = meta;

export default Box;
