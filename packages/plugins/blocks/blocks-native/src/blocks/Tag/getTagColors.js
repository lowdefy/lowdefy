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

const presetColors = new Set([
  'blue',
  'cyan',
  'geekblue',
  'gold',
  'green',
  'lime',
  'magenta',
  'orange',
  'purple',
  'red',
  'volcano',
]);

const statusTokens = {
  error: 'Error',
  processing: 'Info',
  success: 'Success',
  warning: 'Warning',
};

function byVariant({ variant, filled, outlined, solid }) {
  switch (variant) {
    case 'solid':
      return solid;
    case 'outlined':
      return outlined;
    default:
      return filled;
  }
}

/**
 * A Tag's background, border and text colours for its `color` and `variant`, from the computed
 * antd tokens, as antd colours tags: status colours from the status tokens, preset colours from
 * their palettes (tint 1 behind, 3 for the border, 7 for text; 6 when solid), and any other colour
 * filled with light text.
 *
 * @returns {{ backgroundColor: string, borderColor: string, color: string }}
 */
function getTagColors({ color, tokens, variant }) {
  if (Object.hasOwn(statusTokens, color)) {
    const name = statusTokens[color];
    return byVariant({
      variant,
      filled: {
        backgroundColor: tokens[`color${name}Bg`],
        borderColor: tokens[`color${name}Border`],
        color: tokens[`color${name}`],
      },
      outlined: {
        backgroundColor: 'transparent',
        borderColor: tokens[`color${name}Border`],
        color: tokens[`color${name}`],
      },
      solid: {
        backgroundColor: tokens[`color${name}`],
        borderColor: tokens[`color${name}`],
        color: tokens.colorTextLightSolid,
      },
    });
  }
  if (presetColors.has(color)) {
    return byVariant({
      variant,
      filled: {
        backgroundColor: tokens[`${color}1`],
        borderColor: tokens[`${color}3`],
        color: tokens[`${color}7`],
      },
      outlined: {
        backgroundColor: 'transparent',
        borderColor: tokens[`${color}3`],
        color: tokens[`${color}7`],
      },
      solid: {
        backgroundColor: tokens[`${color}6`],
        borderColor: tokens[`${color}6`],
        color: tokens.colorTextLightSolid,
      },
    });
  }
  if (color === undefined || color === 'default') {
    return byVariant({
      variant,
      filled: {
        backgroundColor: tokens.defaultBg ?? tokens.colorFillQuaternary,
        borderColor: tokens.colorBorder,
        color: tokens.defaultColor ?? tokens.colorText,
      },
      outlined: {
        backgroundColor: 'transparent',
        borderColor: tokens.colorBorder,
        color: tokens.defaultColor ?? tokens.colorText,
      },
      solid: {
        backgroundColor: tokens.colorText,
        borderColor: tokens.colorText,
        color: tokens.colorBgContainer,
      },
    });
  }
  return byVariant({
    variant,
    filled: { backgroundColor: color, borderColor: color, color: tokens.colorTextLightSolid },
    outlined: { backgroundColor: 'transparent', borderColor: color, color },
    solid: { backgroundColor: color, borderColor: color, color: tokens.colorTextLightSolid },
  });
}

export default getTagColors;
