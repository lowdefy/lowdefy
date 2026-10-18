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

import getControlSize from './getControlSize.js';

function getBorderColor({ status, tokens }) {
  if (status === 'error') return tokens.colorError;
  if (status === 'warning') return tokens.colorWarning;
  return tokens.colorBorder;
}

function getVariantStyle({ borderColor, disabled, tokens, variant }) {
  const background = disabled ? tokens.colorBgContainerDisabled : tokens.colorBgContainer;
  switch (variant) {
    case 'filled':
      return {
        backgroundColor: disabled ? tokens.colorBgContainerDisabled : tokens.colorFillTertiary,
        borderColor: borderColor === tokens.colorBorder ? 'transparent' : borderColor,
        borderWidth: tokens.lineWidth,
      };
    case 'borderless':
      return { backgroundColor: 'transparent', borderWidth: 0 };
    case 'underlined':
      return {
        backgroundColor: 'transparent',
        borderBottomWidth: tokens.lineWidth,
        borderColor,
        borderRadius: 0,
      };
    default:
      return { backgroundColor: background, borderColor, borderWidth: tokens.lineWidth };
  }
}

/**
 * The box an input draws its value in (TextInput, TextArea, NumberInput, Selector, DateSelector):
 * a row of the control's height, bordered as its `variant` asks and coloured by its validation
 * status, as antd colours an input with `status`.
 *
 * @param {Object} params
 * @param {boolean} params.disabled
 * @param {Object} params.properties The block's properties (`size`, `variant`, `bordered`).
 * @param {string|null} [params.status] The validation status.
 * @param {Object} params.tokens The block's antd tokens.
 * @returns {{ box: Object, text: Object }} The box style and the style of the text inside it.
 */
function getInputBoxStyle({ disabled, properties, status, tokens }) {
  const { height, fontSize, paddingHorizontal } = getControlSize({
    size: properties.size,
    tokens,
  });
  const variant = properties.bordered === false ? 'borderless' : properties.variant;
  return {
    box: {
      alignItems: 'center',
      borderRadius: tokens.borderRadius,
      flexDirection: 'row',
      minHeight: height,
      paddingHorizontal,
      ...getVariantStyle({
        borderColor: getBorderColor({ status, tokens }),
        disabled,
        tokens,
        variant,
      }),
    },
    text: {
      color: disabled ? tokens.colorTextDisabled : tokens.colorText,
      fontSize,
    },
  };
}

export default getInputBoxStyle;
