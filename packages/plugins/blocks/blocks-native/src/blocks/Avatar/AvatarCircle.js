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
import { Image, Text, View } from 'react-native';
import { type } from '@lowdefy/helpers';

import getAvatarColor from './getAvatarColor.js';
import getInitials from './getInitials.js';

/**
 * One round avatar: its image, or the initials of its name on a colour the name picks. An image
 * that fails to load falls back to the initials.
 *
 * @param {Object} props
 * @param {{ name?: string, src?: string, content?: string, color?: string }} props.avatar
 * @param {boolean} props.isDark
 * @param {string} [props.ringColor] A ring around the avatar, as a stacked avatar has.
 * @param {number} props.size
 * @param {Object} [props.style]
 * @param {string} [props.testID]
 * @param {Object} props.tokens
 */
function AvatarCircle({ avatar, isDark, ringColor, size, style, testID, tokens }) {
  const [imageFailed, setImageFailed] = useState(false);
  const ring = type.isString(ringColor) ? Math.max(1.5, size / 16) : 0;
  const shape = {
    borderColor: ringColor,
    borderRadius: (size + ring * 2) / 2,
    borderWidth: ring,
    height: size + ring * 2,
    overflow: 'hidden',
    width: size + ring * 2,
  };
  const accessibilityProps = type.isString(avatar.name)
    ? { accessible: true, accessibilityLabel: avatar.name, accessibilityRole: 'image' }
    : { accessibilityElementsHidden: true, importantForAccessibility: 'no-hide-descendants' };
  if (type.isString(avatar.src) && !imageFailed) {
    return (
      <View {...accessibilityProps} style={[shape, style]} testID={testID}>
        <Image
          accessibilityIgnoresInvertColors
          onError={() => setImageFailed(true)}
          source={{ uri: avatar.src }}
          style={{ height: size, width: size, borderRadius: size / 2 }}
        />
      </View>
    );
  }
  const { color } = getAvatarColor({ color: avatar.color, isDark, name: avatar.name, tokens });
  return (
    <View
      {...accessibilityProps}
      style={[
        shape,
        { alignItems: 'center', backgroundColor: color, justifyContent: 'center' },
        style,
      ]}
      testID={testID}
    >
      <Text
        allowFontScaling={false}
        numberOfLines={1}
        style={{
          color: tokens.colorTextLightSolid,
          fontSize: Math.round(size * 0.4),
          fontWeight: '600',
          letterSpacing: size <= 20 ? -0.2 : 0,
        }}
      >
        {getInitials({ content: avatar.content, name: avatar.name })}
      </Text>
    </View>
  );
}

export default AvatarCircle;
