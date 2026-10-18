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
import { Text, TextInput as RNTextInput, View } from 'react-native';
import { type } from '@lowdefy/helpers';

import applyReplaceInput from './applyReplaceInput.js';
import ClearButton from '../../shared/ClearButton.js';
import CountText from '../../shared/CountText.js';
import getInputBoxStyle from '../../shared/getInputBoxStyle.js';
import getKeyboardProps from './getKeyboardProps.js';
import getLabelProperties from '../Label/getLabelProperties.js';
import Label from '../Label/Label.js';
import meta from './meta.js';
import useBlockTokens from '../../shared/useBlockTokens.js';

function TextInput({ blockId, loading, methods, properties, required, styles, validation, value }) {
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
      <View style={[box, styles.element]}>
        {type.isString(properties.prefix) ? (
          <Text style={[text, { marginRight: tokens.marginXXS }]}>{properties.prefix}</Text>
        ) : null}
        <RNTextInput
          {...getKeyboardProps({ type: properties.type })}
          accessibilityLabel={accessibilityLabel}
          autoFocus={properties.autoFocus === true}
          editable={!disabled}
          maxLength={properties.maxLength}
          onBlur={() => methods.triggerEvent({ name: 'onBlur' })}
          onChangeText={(input) =>
            setText(applyReplaceInput({ replaceInput: properties.replaceInput, text: input }))
          }
          onFocus={() => methods.triggerEvent({ name: 'onFocus' })}
          onSubmitEditing={() => methods.triggerEvent({ name: 'onPressEnter' })}
          placeholder={properties.placeholder}
          placeholderTextColor={tokens.colorTextPlaceholder}
          style={[text, { flex: 1, paddingVertical: tokens.paddingXXS }]}
          testID={`${blockId}_input`}
          value={value ?? ''}
        />
        {properties.showCount === true ? (
          <CountText maxLength={properties.maxLength} tokens={tokens} value={value} />
        ) : null}
        {properties.allowClear === true && !disabled && !type.isNone(value) && value !== '' ? (
          <ClearButton
            blockId={blockId}
            onPress={() => {
              setText('');
              methods.triggerEvent({ name: 'onClear' });
            }}
            tokens={tokens}
          />
        ) : null}
        {type.isString(properties.suffix) ? (
          <Text style={[text, { marginLeft: tokens.marginXXS }]}>{properties.suffix}</Text>
        ) : null}
      </View>
    </Label>
  );
}

TextInput.meta = meta;

export default TextInput;
