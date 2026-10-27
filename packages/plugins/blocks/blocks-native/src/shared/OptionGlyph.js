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
import { resolveColor } from '@lowdefy/client-native';
import { type } from '@lowdefy/helpers';

import AvatarCircle from '../blocks/Avatar/AvatarCircle.js';
import SystemIcon from './SystemIcon.js';

/**
 * The leading glyph of a menu option drawn in React Native, as in a Selector menu row: its
 * avatar, drawn as the Avatar block draws it (the same initials and colour for a person
 * everywhere), or its SF Symbol on iOS, or else its icon from the app's icon data. Nothing when
 * the option has none of them for the platform.
 *
 * @param {Object} props
 * @param {Object} [props.avatar] `{ name, src, color }`, drawn as the Avatar block draws it.
 * @param {string} [props.color] The glyph colour, resolved through the theme (a palette hue such
 *   as `amber`, a token such as `colorTint`, or a hex); secondary text by default.
 * @param {Object} props.components
 * @param {string} [props.icon] An icon name from the app's icon data.
 * @param {boolean} props.isDark
 * @param {number} props.size
 * @param {string} [props.symbol] An SF Symbol name.
 * @param {Object} props.tokens
 */
function OptionGlyph({ avatar, color, components, icon, isDark, size, symbol, testID, tokens }) {
  if (type.isObject(avatar)) {
    return (
      <AvatarCircle
        avatar={avatar}
        isDark={isDark}
        imageSource={components.imageSource}
        size={size}
        testID={testID}
        tokens={tokens}
      />
    );
  }
  return (
    <SystemIcon
      color={type.isString(color) ? resolveColor({ color, tokens }) : tokens.colorTextSecondary}
      components={components}
      fallback={icon}
      size={size}
      symbol={symbol}
      testID={testID}
    />
  );
}

export default OptionGlyph;
