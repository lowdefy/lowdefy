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
import { Platform } from 'react-native';
import { Host, Icon } from '@expo/ui';
import { font } from '@expo/ui/swift-ui/modifiers';
import { type } from '@lowdefy/helpers';

/**
 * A system glyph a block draws as part of its own chrome, such as a chevron or a close mark: the
 * SF Symbol on iOS, where the system draws it as the native controls do, and the matching icon
 * from the app's icon data elsewhere. The block lists the fallback icon in its meta.icons, so the
 * page carries its data. Either name may be missing: with neither for the platform, nothing is
 * drawn.
 *
 * @param {Object} props
 * @param {Object} props.components The block's components, for the icon renderer.
 * @param {string} props.color
 * @param {string} [props.fallback] The icon name drawn where there are no SF Symbols.
 * @param {number} props.size The glyph size in points.
 * @param {string} [props.symbol] The SF Symbol name.
 * @param {string} [props.testID]
 * @param {string} [props.weight] The SF Symbol weight (`semibold`, `bold`, ...), as a font weight
 *   sets it in SwiftUI; the symbol's regular weight without it.
 */
function SystemIcon({ components, color, fallback, size, symbol, testID, weight }) {
  if (Platform.OS === 'ios' && type.isString(symbol)) {
    // SwiftUI sizes a symbol by its font once a font modifier is set, so the size goes with it.
    const modifiers = type.isString(weight) ? [font({ size, weight })] : undefined;
    return (
      <Host matchContents testID={testID}>
        <Icon color={color} modifiers={modifiers} name={symbol} size={size} />
      </Host>
    );
  }
  if (!type.isString(fallback)) {
    return null;
  }
  return (
    <components.Icon
      properties={{ name: fallback, title: '' }}
      styles={{ element: { color, fontSize: size } }}
      testID={testID}
    />
  );
}

export default SystemIcon;
