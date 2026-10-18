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

import getAvatarInitials from './getAvatarInitials.js';

/**
 * A round avatar: the image at `src`, or the person's initials on their colour.
 *
 * @param {Object} props
 * @param {Object} props.avatar `{ name, src, color }`.
 * @param {number} props.size
 * @param {Object} props.tokens
 */
function InitialsAvatar({ avatar, size, testID, tokens }) {
  const shape = { borderRadius: size / 2, height: size, width: size };
  if (type.isString(avatar.src)) {
    return (
      <Image
        accessibilityIgnoresInvertColors
        source={{ uri: avatar.src }}
        style={shape}
        testID={testID}
      />
    );
  }
  const { color, initials } = getAvatarInitials({ avatar, tokens });
  return (
    <View
      style={[shape, { alignItems: 'center', backgroundColor: color, justifyContent: 'center' }]}
      testID={testID}
    >
      <Text
        allowFontScaling={false}
        style={{ color: '#fff', fontSize: Math.round(size * 0.42), fontWeight: '600' }}
      >
        {initials}
      </Text>
    </View>
  );
}

export default InitialsAvatar;
