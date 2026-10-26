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

import React, { useMemo, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { SvgAst } from 'react-native-svg';
import { type } from '@lowdefy/helpers';

import AvatarPhoto from './AvatarPhoto.js';
import getAvatarColor from './getAvatarColor.js';
import getAvatarImage from './getAvatarImage.js';
import getInitials from './getInitials.js';

/**
 * One round avatar: the initials of its name on a colour the name picks, under its picture when
 * it has one. An SVG data URI is drawn at once; a photo fades in over the initials once loaded.
 * A picture that fails to load leaves the initials, until `src` changes.
 *
 * @param {Object} props
 * @param {{ name?: string, src?: string, content?: string, color?: string }} props.avatar
 * @param {boolean} props.isDark
 * @param {(url: string) => Object} props.imageSource The expo-image source for a url.
 * @param {string} [props.ringColor] A ring around the avatar, as a stacked avatar has.
 * @param {number} props.size
 * @param {Object} [props.style]
 * @param {string} [props.testID]
 * @param {Object} props.tokens
 */
function AvatarCircle({ avatar, imageSource, isDark, ringColor, size, style, testID, tokens }) {
  const image = useMemo(
    () => getAvatarImage({ imageSource, src: avatar.src }),
    [avatar.src, imageSource]
  );
  // Both hold the src they are about, so a new src starts over without an effect to reset them.
  const [failedSrc, setFailedSrc] = useState(null);
  const [shownSrc, setShownSrc] = useState(null);
  const drawImage = image !== null && failedSrc !== avatar.src;
  const covered = drawImage && (image.kind === 'svg' || shownSrc === avatar.src);
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
      {covered ? null : (
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
      )}
      {drawImage && image.kind === 'svg' ? (
        <View pointerEvents="none" style={StyleSheet.absoluteFill}>
          <SvgAst ast={image.ast} override={{ height: size, width: size }} />
        </View>
      ) : null}
      {drawImage && image.kind === 'uri' ? (
        <AvatarPhoto
          key={image.source.uri}
          onError={() => setFailedSrc(avatar.src)}
          onShown={() => setShownSrc(avatar.src)}
          size={size}
          source={image.source}
        />
      ) : null}
    </View>
  );
}

export default AvatarCircle;
