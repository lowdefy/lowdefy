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
import { TextInput as RNTextInput, View } from 'react-native';
import { type } from '@lowdefy/helpers';

import ClearButton from '../../shared/ClearButton.js';
import CountText from '../../shared/CountText.js';
import getInputBoxStyle from '../../shared/getInputBoxStyle.js';
import getLabelProperties from '../Label/getLabelProperties.js';
import Label from '../Label/Label.js';
import meta from './meta.js';
import useBlockTokens from '../../shared/useBlockTokens.js';

// The height of `rows` lines of text; antd's TextArea takes two lines when `rows` is not set.
function getMinHeight({ fontSize, rows, tokens }) {
  const lines = type.isInt(rows) ? rows : 2;
  return Math.ceil(lines * fontSize * tokens.lineHeight) + 2 * tokens.paddingXS;
}

function TextArea({ blockId, loading, methods, properties, required, styles, validation, value }) {
  const { tokens } = useBlockTokens({ properties });
  const { accessibilityLabel, labelProperties } = getLabelProperties({ blockId, properties });
  const disabled = loading === true || properties.disabled === true;
  const { box, text } = getInputBoxStyle({
    disabled,
    properties,
    status: validation?.status,
    tokens,
  });
  const setText = (input) => {
    methods.setValue(input);
    methods.triggerEvent({ name: 'onChange', event: { value: input } });
  };
  return (
    <Label
      blockId={blockId}
      properties={labelProperties}
      required={required}
      styles={styles}
      tokens={tokens}
      validation={validation}
    >
      <View style={[box, { alignItems: 'flex-start' }, styles.element]}>
        <RNTextInput
          accessibilityLabel={accessibilityLabel}
          autoFocus={properties.autoFocus === true}
          editable={!disabled}
          maxLength={properties.maxLength}
          multiline
          numberOfLines={properties.rows}
          onBlur={() => methods.triggerEvent({ name: 'onBlur' })}
          onChangeText={setText}
          onFocus={() => methods.triggerEvent({ name: 'onFocus' })}
          placeholder={properties.placeholder}
          placeholderTextColor={tokens.colorTextPlaceholder}
          style={[
            text,
            {
              flex: 1,
              minHeight: getMinHeight({ fontSize: text.fontSize, rows: properties.rows, tokens }),
              paddingVertical: tokens.paddingXS,
              textAlignVertical: 'top',
            },
          ]}
          testID={`${blockId}_input`}
          value={value ?? ''}
        />
        {properties.allowClear === true && !disabled && !type.isNone(value) && value !== '' ? (
          <View style={{ paddingTop: tokens.paddingXS }}>
            <ClearButton
              blockId={blockId}
              onPress={() => {
                setText('');
                methods.triggerEvent({ name: 'onClear' });
              }}
              tokens={tokens}
            />
          </View>
        ) : null}
      </View>
      {!type.isNone(properties.showCount) && properties.showCount !== false ? (
        <View style={{ alignItems: 'flex-end' }}>
          <CountText maxLength={properties.maxLength} tokens={tokens} value={value} />
        </View>
      ) : null}
    </Label>
  );
}

TextArea.meta = meta;

export default TextArea;
