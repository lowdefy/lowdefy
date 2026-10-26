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
import { type } from '@lowdefy/helpers';

import AvatarCircle from './AvatarCircle.js';
import getSemanticColors from '../../shared/getSemanticColors.js';

/**
 * Overlapping avatars, the first on top, each ringed in the surface colour so the overlaps read.
 * Past `max`, a "+n" circle counts the rest.
 *
 * @param {Object} props
 * @param {Object[]} props.avatars
 * @param {boolean} props.isDark
 * @param {number} [props.max]
 * @param {(url: string) => string} props.resolveUrl Takes a path against the app server.
 * @param {string} [props.ringColor] Defaults to the cell colour.
 * @param {number} props.size
 * @param {Object} [props.style]
 * @param {string} props.testID
 * @param {Object} props.tokens
 */
function AvatarStack({ avatars, isDark, max, resolveUrl, ringColor, size, style, testID, tokens }) {
  const colors = getSemanticColors({ tokens });
  const ring = ringColor ?? colors.cell;
  const shown = type.isNumber(max) ? avatars.slice(0, max) : avatars;
  const rest = avatars.length - shown.length;
  const overlap = -Math.round(size * 0.3);
  const names = avatars.map((avatar) => avatar.name).filter((name) => type.isString(name));
  return (
    <View
      accessible
      accessibilityLabel={names.join(', ')}
      style={[{ alignItems: 'center', flexDirection: 'row' }, style]}
      testID={testID}
    >
      {shown.map((avatar, index) => (
        <AvatarCircle
          avatar={avatar}
          isDark={isDark}
          key={`${avatar.name ?? avatar.src ?? ''}-${index}`}
          resolveUrl={resolveUrl}
          ringColor={ring}
          size={size}
          style={{ marginLeft: index === 0 ? 0 : overlap, zIndex: shown.length - index }}
          testID={`${testID}_${index}`}
          tokens={tokens}
        />
      ))}
      {rest > 0 ? (
        <View
          style={{
            alignItems: 'center',
            backgroundColor: tokens.colorFillSecondary,
            borderColor: ring,
            borderRadius: size,
            borderWidth: Math.max(1.5, size / 16),
            height: size + Math.max(1.5, size / 16) * 2,
            justifyContent: 'center',
            marginLeft: overlap,
            minWidth: size + Math.max(1.5, size / 16) * 2,
            paddingHorizontal: 2,
          }}
        >
          <Text
            allowFontScaling={false}
            style={{
              color: colors.secondaryLabel,
              fontSize: Math.round(size * 0.38),
              fontWeight: '600',
            }}
          >
            {`+${rest}`}
          </Text>
        </View>
      ) : null}
    </View>
  );
}

export default AvatarStack;
