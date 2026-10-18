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
import { Image, Text, View } from 'react-native';
import { type } from '@lowdefy/helpers';

// A ListItem's round avatar: its image, or its text on a filled circle.
function ListItemAvatar({ avatar, size, styles, tokens }) {
  const shape = { borderRadius: size / 2, height: size, width: size };
  if (type.isString(avatar.src)) {
    return (
      <Image
        accessibilityIgnoresInvertColors
        source={{ uri: avatar.src }}
        style={[shape, styles.avatar]}
      />
    );
  }
  return (
    <View
      style={[
        shape,
        {
          alignItems: 'center',
          backgroundColor: avatar.color ?? tokens.colorFillSecondary,
          justifyContent: 'center',
        },
        styles.avatar,
      ]}
    >
      <Text style={{ color: tokens.colorText, fontSize: tokens.fontSize }}>{avatar.content}</Text>
    </View>
  );
}

export default ListItemAvatar;
