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
import { Text } from 'react-native';

import getPropertyRowTextStyles from '../../shared/getPropertyRowTextStyles.js';
import PropertyRow from '../../shared/PropertyRow.js';
import SystemIcon from '../../shared/SystemIcon.js';
import ValueSummary from './ValueSummary.js';

/**
 * The iOS Settings-style property row (PropertyRow) of a MultipleSelector with `variant: sheet`:
 * the title at the left, and at the right the chosen labels in the secondary label colour on one
 * line (ValueSummary, "agent-rules, ui +2" when they overflow), or the placeholder while nothing
 * is chosen, then the up-down chevron, as a Selector sheet row draws it.
 *
 * @param {Object} props
 * @param {string} props.blockId
 * @param {Object} props.components
 * @param {string[]} props.labels The chosen options' labels.
 * @param {string} props.placeholder
 * @param {boolean} [props.required]
 * @param {Object} props.styles The block's style slots.
 * @param {string} [props.title]
 * @param {Object} props.tokens
 */
function MultipleSelectorRow({
  blockId,
  components,
  labels,
  placeholder,
  required,
  styles,
  title,
  tokens,
}) {
  const text = getPropertyRowTextStyles({ tokens });
  return (
    <PropertyRow
      required={required}
      styles={styles}
      testID={`${blockId}_row`}
      title={title}
      tokens={tokens}
    >
      {labels.length === 0 ? (
        <Text numberOfLines={1} style={[text.value, { flexShrink: 1 }, styles.value]}>
          {placeholder}
        </Text>
      ) : (
        <ValueSummary
          align="right"
          labels={labels}
          style={[text.value, styles.value]}
          testID={`${blockId}_value`}
        />
      )}
      <SystemIcon
        color={tokens.colorTextTertiary}
        components={components}
        fallback="ChevronsUpDown"
        size={13}
        symbol="chevron.up.chevron.down"
      />
    </PropertyRow>
  );
}

export default MultipleSelectorRow;
