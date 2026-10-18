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

import getSemanticColors from '../../shared/getSemanticColors.js';
import getStatusColor from './getStatusColor.js';
import iosTextStyles from '../../shared/iosTextStyles.js';
import resolveColor from '../../shared/resolveColor.js';
import StatusGlyph from './StatusGlyph.js';
import statusLabels from './statusLabels.js';

/**
 * A status glyph with an optional label beside it, as rows, section headers and the StatusIcon
 * block draw it. `status` is a glyph name or `{ name, color, size, label, title }`.
 *
 * @param {Object} props
 * @param {string|Object} props.status
 * @param {number} [props.defaultSize]
 * @param {Object} [props.labelStyle]
 * @param {Object} [props.style]
 * @param {string} [props.testID]
 * @param {Object} props.tokens
 */
function StatusMark({ defaultSize = 16, labelStyle, status, style, testID, tokens }) {
  const config = type.isString(status) ? { name: status } : status;
  const color = type.isString(config.color)
    ? resolveColor({ color: config.color, tokens })
    : getStatusColor({ name: config.name, tokens });
  const size = config.size ?? defaultSize;
  const label = config.label === true ? statusLabels[config.name] : config.label;
  const title = config.title ?? (type.isString(label) ? label : statusLabels[config.name]);
  const glyph = (
    <StatusGlyph color={color} name={config.name} size={size} testID={testID} tokens={tokens} />
  );
  const accessibilityProps = type.isString(title)
    ? { accessible: true, accessibilityLabel: title, accessibilityRole: 'image' }
    : { accessibilityElementsHidden: true, importantForAccessibility: 'no-hide-descendants' };
  return (
    <View
      {...accessibilityProps}
      style={[{ alignItems: 'center', flexDirection: 'row', gap: 6 }, style]}
    >
      {glyph}
      {type.isString(label) ? (
        <Text
          numberOfLines={1}
          style={[
            iosTextStyles.footnote,
            { color: getSemanticColors({ tokens }).secondaryLabel },
            labelStyle,
          ]}
        >
          {label}
        </Text>
      ) : null}
    </View>
  );
}

export default StatusMark;
