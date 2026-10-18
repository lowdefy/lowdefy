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

import React, { useEffect, useState } from 'react';
import { Text, TextInput as RNTextInput, View } from 'react-native';
import { type } from '@lowdefy/helpers';

import formatNumber from './formatNumber.js';
import getInputBoxStyle from '../../shared/getInputBoxStyle.js';
import getLabelProperties from '../Label/getLabelProperties.js';
import getNumberKeyboardType from './getNumberKeyboardType.js';
import Label from '../Label/Label.js';
import meta from './meta.js';
import normalizeNumber from './normalizeNumber.js';
import parseNumberText from './parseNumberText.js';
import StepButton from './StepButton.js';
import useBlockTokens from '../../shared/useBlockTokens.js';

// The input keeps its own text, so text on its way to a number ("-", "1.") stays while the
// value keeps its last number. A value set from outside (SetState) replaces the text.
function NumberInput({
  blockId,
  loading,
  methods,
  properties,
  required,
  styles,
  validation,
  value,
}) {
  const { tokens } = useBlockTokens({ properties });
  const { accessibilityLabel, labelProperties } = getLabelProperties({ properties });
  const { decimalSeparator, max, min, precision } = properties;
  const step = properties.step ?? 1;
  const [text, setText] = useState(() => formatNumber({ decimalSeparator, precision, value }));
  useEffect(() => {
    if (parseNumberText({ decimalSeparator, text }).value !== value) {
      setText(formatNumber({ decimalSeparator, precision, value }));
    }
    // Only a new value from outside resets the text; typing keeps it.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value]);
  const disabled = loading === true || properties.disabled === true;
  const { box, text: textStyle } = getInputBoxStyle({
    disabled,
    properties,
    status: validation?.status,
    tokens,
  });
  const setNumber = (number) => {
    methods.setValue(number);
    methods.triggerEvent({ name: 'onChange', event: { value: number } });
  };
  const stepBy = (direction) => {
    const next = normalizeNumber({
      max,
      min,
      precision,
      value: (type.isNumber(value) ? value : 0) + direction * step,
    });
    setText(formatNumber({ decimalSeparator, precision, value: next }));
    setNumber(next);
  };
  const spinner = properties.mode === 'spinner';
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
        {spinner ? (
          <StepButton
            disabled={disabled || (type.isNumber(min) && type.isNumber(value) && value <= min)}
            label="−"
            onPress={() => stepBy(-1)}
            testID={`${blockId}_decrease`}
            tokens={tokens}
          />
        ) : null}
        {type.isString(properties.prefix) ? (
          <Text style={[textStyle, { color: tokens.colorSecondaryLabel, marginRight: 4 }]}>
            {properties.prefix}
          </Text>
        ) : null}
        <RNTextInput
          accessibilityLabel={accessibilityLabel}
          autoFocus={properties.autoFocus === true}
          editable={!disabled}
          keyboardType={getNumberKeyboardType({ min, precision })}
          onBlur={() => {
            const settled = normalizeNumber({ max, min, precision, value });
            setText(formatNumber({ decimalSeparator, precision, value: settled }));
            if (settled !== value) {
              setNumber(settled);
            }
            methods.triggerEvent({ name: 'onBlur' });
          }}
          onChangeText={(input) => {
            setText(input);
            const parsed = parseNumberText({ decimalSeparator, text: input });
            if (parsed.valid && parsed.value !== value) {
              setNumber(parsed.value);
            }
          }}
          onFocus={() => methods.triggerEvent({ name: 'onFocus' })}
          onSubmitEditing={() => methods.triggerEvent({ name: 'onPressEnter' })}
          placeholder={properties.placeholder}
          placeholderTextColor={tokens.colorTertiaryLabel}
          selectionColor={tokens.colorTint}
          style={[
            textStyle,
            { flex: 1, paddingVertical: 0, textAlign: spinner ? 'center' : 'left' },
          ]}
          testID={`${blockId}_input`}
          value={text}
        />
        {type.isString(properties.suffix) ? (
          <Text style={[textStyle, { color: tokens.colorSecondaryLabel, marginLeft: 4 }]}>
            {properties.suffix}
          </Text>
        ) : null}
        {spinner ? (
          <StepButton
            disabled={disabled || (type.isNumber(max) && type.isNumber(value) && value >= max)}
            label="+"
            onPress={() => stepBy(1)}
            testID={`${blockId}_increase`}
            tokens={tokens}
          />
        ) : null}
      </View>
    </Label>
  );
}

NumberInput.meta = meta;

export default NumberInput;
