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

import { Platform } from 'react-native';

// antd's Typography styles as React Native text styles. antd's code font is a CSS font stack,
// which a phone cannot read, so code text uses the platform's monospace font.
const monospace = Platform.select({ ios: 'Menlo', default: 'monospace' });

function getTypeColor({ tokens, type }) {
  switch (type) {
    case 'secondary':
      return tokens.colorTextSecondary;
    case 'success':
      return tokens.colorSuccess;
    case 'warning':
      return tokens.colorWarning;
    case 'danger':
      return tokens.colorError;
    default:
      return undefined;
  }
}

function getDecoration({ properties }) {
  const lines = [];
  if (properties.underline === true) lines.push('underline');
  if (properties.delete === true) lines.push('line-through');
  if (lines.length === 0) return {};
  return { textDecorationLine: lines.join(' ') };
}

/**
 * The text style of a Title or Paragraph from its style properties, over `baseStyle` (the
 * heading's or paragraph's size and colour): type and disabled colours, code, keyboard and mark
 * boxes, strong, italic, underline and delete.
 *
 * @param {Object} params
 * @param {Object} params.baseStyle
 * @param {Object} params.properties The block's properties.
 * @param {Object} params.tokens The block's theme tokens.
 * @returns {Object} A React Native text style.
 */
function getTextStyle({ baseStyle, properties, tokens }) {
  const style = { ...baseStyle };
  const typeColor = getTypeColor({ tokens, type: properties.type });
  if (typeColor !== undefined) style.color = typeColor;
  if (properties.disabled === true) style.color = tokens.colorTextDisabled;
  if (properties.strong === true) style.fontWeight = String(tokens.fontWeightStrong);
  if (properties.italic === true) style.fontStyle = 'italic';
  if (properties.code === true) {
    Object.assign(style, {
      backgroundColor: tokens.colorFillTertiary,
      borderColor: tokens.colorBorderSecondary,
      borderRadius: tokens.borderRadiusSM,
      borderWidth: tokens.lineWidth,
      fontFamily: monospace,
      fontSize: style.fontSize * 0.85,
    });
  }
  if (properties.keyboard === true) {
    Object.assign(style, {
      backgroundColor: tokens.colorFillQuaternary,
      borderBottomWidth: tokens.lineWidth * 2,
      borderColor: tokens.colorBorder,
      borderRadius: tokens.borderRadiusSM,
      borderWidth: tokens.lineWidth,
      fontFamily: monospace,
      fontSize: style.fontSize * 0.9,
    });
  }
  if (properties.mark === true) style.backgroundColor = tokens.gold3;
  Object.assign(style, getDecoration({ properties }));
  if (properties.color !== undefined) style.color = properties.color;
  return style;
}

export default getTextStyle;
