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

import { type } from '@lowdefy/helpers';

const PRESET_COLORS = new Set([
  'blue',
  'purple',
  'cyan',
  'green',
  'magenta',
  'pink',
  'red',
  'orange',
  'yellow',
  'volcano',
  'geekblue',
  'lime',
  'gold',
]);

// The deprecated `type` as a colour and variant, as the web Button reads it.
const TYPE_STYLES = {
  danger: { color: 'danger', variant: 'solid' },
  dashed: { color: 'default', variant: 'dashed' },
  default: { color: 'default', variant: 'outlined' },
  link: { color: 'primary', variant: 'link' },
  primary: { color: 'primary', variant: 'solid' },
  text: { color: 'default', variant: 'text' },
};

const NAMED_COLORS = new Set(['danger', 'default', 'primary', ...PRESET_COLORS]);

// Without a variant the web Button draws antd's `type`, where a preset colour has no effect and
// any other colour replaces the primary colour.
function getColorAndVariant({ properties }) {
  if (properties.variant) {
    return { color: properties.color ?? 'default', variant: properties.variant };
  }
  const typeStyle = TYPE_STYLES[properties.type ?? 'primary'];
  const customColor = type.isString(properties.color) && !NAMED_COLORS.has(properties.color);
  if (customColor && typeStyle.color === 'primary') {
    return { color: properties.color, variant: typeStyle.variant };
  }
  return typeStyle;
}

function resolveColor({ color, danger, tokens }) {
  if (danger === true || color === 'danger') return tokens.colorError;
  if (color === 'primary') return tokens.colorPrimary;
  if (color === 'default') return null;
  if (PRESET_COLORS.has(color)) return tokens[color];
  return color;
}

/**
 * The colours of a Button for its `color`, `variant` (or the deprecated `type`), `danger` and
 * `ghost`, as antd draws them: a preset name takes the theme's colour, any other colour is used
 * as written, and the `default` colour is the theme's text and border colours.
 *
 * @param {Object} params
 * @param {Object} params.properties The Button's properties.
 * @param {Object} params.tokens The block's antd tokens.
 * @returns {{ backgroundColor: string, borderColor: string, borderStyle: string, borderWidth: number, textColor: string }}
 */
function getButtonColors({ properties, tokens }) {
  const { color, variant } = getColorAndVariant({ properties });
  const main = resolveColor({ color, danger: properties.danger, tokens });
  const accent = main ?? tokens.colorText;
  const border = {
    borderColor: main ?? tokens.colorBorder,
    borderStyle: 'solid',
    borderWidth: tokens.lineWidth,
  };
  const none = { borderColor: 'transparent', borderStyle: 'solid', borderWidth: 0 };
  if (properties.ghost === true) {
    return {
      ...border,
      backgroundColor: 'transparent',
      textColor: main ?? tokens.colorTextLightSolid,
    };
  }
  switch (variant) {
    case 'solid':
      return {
        ...none,
        backgroundColor: main ?? tokens.colorText,
        textColor: tokens.colorTextLightSolid,
      };
    case 'dashed':
      return {
        ...border,
        backgroundColor: tokens.colorBgContainer,
        borderStyle: 'dashed',
        textColor: accent,
      };
    case 'filled':
      return { ...none, backgroundColor: tokens.colorFillTertiary, textColor: accent };
    case 'text':
      return { ...none, backgroundColor: 'transparent', textColor: accent };
    case 'link':
      return { ...none, backgroundColor: 'transparent', textColor: main ?? tokens.colorPrimary };
    default:
      return { ...border, backgroundColor: tokens.colorBgContainer, textColor: accent };
  }
}

export default getButtonColors;
