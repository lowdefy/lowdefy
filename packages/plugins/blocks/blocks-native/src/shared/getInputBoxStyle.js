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

import { StyleSheet } from 'react-native';

import getControlSize from './getControlSize.js';

function getStatusColor({ status, tokens }) {
  if (status === 'error') return tokens.colorError;
  if (status === 'warning') return tokens.colorWarning;
  return null;
}

// The default (and `filled`) field is the iOS filled field, a grey fill that reads on a cell and
// on the grouped background in both modes. `outlined` is a hairline box, `borderless` the bare
// text, `underlined` a hairline under the text. A failed validation outlines the field.
function getVariantStyle({ statusColor, tokens, variant }) {
  switch (variant) {
    case 'outlined':
      return {
        backgroundColor: 'transparent',
        borderColor: statusColor ?? tokens.colorOpaqueSeparator,
        borderWidth: statusColor === null ? StyleSheet.hairlineWidth : tokens.lineWidth,
      };
    case 'borderless':
      return { backgroundColor: 'transparent', borderWidth: 0 };
    case 'underlined':
      return {
        backgroundColor: 'transparent',
        borderBottomWidth: statusColor === null ? StyleSheet.hairlineWidth : tokens.lineWidth,
        borderColor: statusColor ?? tokens.colorSeparator,
        borderRadius: 0,
        paddingHorizontal: 0,
      };
    default:
      return {
        backgroundColor: tokens.colorTertiarySystemFill,
        borderColor: statusColor ?? 'transparent',
        borderWidth: statusColor === null ? 0 : tokens.lineWidth,
      };
  }
}

/**
 * The box an input draws its value in (TextInput, TextArea, NumberInput, Selector, DateSelector):
 * a row of the control's height in the iOS field style its `variant` asks for, outlined in the
 * validation status colour, as antd colours an input with `status`.
 *
 * @param {Object} params
 * @param {boolean} params.disabled
 * @param {Object} params.properties The block's properties (`size`, `variant`, `bordered`).
 * @param {string|null} [params.status] The validation status.
 * @param {Object} params.tokens The block's theme tokens.
 * @returns {{ box: Object, text: Object }} The box style and the style of the text inside it.
 */
function getInputBoxStyle({ disabled, properties, status, tokens }) {
  const { borderRadius, fontSize, height, paddingHorizontal } = getControlSize({
    size: properties.size,
  });
  const variant = properties.bordered === false ? 'borderless' : properties.variant;
  return {
    box: {
      alignItems: 'center',
      borderRadius,
      flexDirection: 'row',
      minHeight: height,
      paddingHorizontal,
      ...getVariantStyle({
        statusColor: getStatusColor({ status, tokens }),
        tokens,
        variant,
      }),
      opacity: disabled ? 0.6 : 1,
    },
    text: {
      color: disabled ? tokens.colorSecondaryLabel : tokens.colorLabel,
      fontSize,
    },
  };
}

export default getInputBoxStyle;
