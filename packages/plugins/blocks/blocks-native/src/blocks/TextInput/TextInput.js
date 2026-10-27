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

import React, { useRef, useState } from 'react';
import { Pressable, Text, TextInput as RNTextInput, View } from 'react-native';
import { type } from '@lowdefy/helpers';

import applyReplaceInput from './applyReplaceInput.js';
import ClearButton from '../../shared/ClearButton.js';
import CountText from '../../shared/CountText.js';
import getInputBoxStyle from '../../shared/getInputBoxStyle.js';
import getIosTextStyle from '../../typography/getIosTextStyle.js';
import getKeyboardProps from './getKeyboardProps.js';
import getLabelProperties from '../Label/getLabelProperties.js';
import getLabelState from '../Label/getLabelState.js';
import getPropertyRowTextStyles from '../../shared/getPropertyRowTextStyles.js';
import getSearchBoxStyle from './getSearchBoxStyle.js';
import Label from '../Label/Label.js';
import meta from './meta.js';
import PropertyRow from '../../shared/PropertyRow.js';
import useBlockTokens from '../../shared/useBlockTokens.js';

// A text field. `variant: search` is the iOS search field: a rounded grey fill with a magnifying
// glass, a clear button while it has text, the keyboard's Search key, and Cancel beside it while
// it is focused, which clears the text and closes the keyboard. `variant: row` is an iOS
// Settings-style row (PropertyRow): the title at the left and the one-line value right-aligned in
// the secondary label colour, "Not set" while it is empty; pressing the row focuses the field.
function TextInput({
  blockId,
  components,
  loading,
  methods,
  properties,
  required,
  styles,
  validation,
  value,
}) {
  const { tokens } = useBlockTokens({ properties });
  const inputRef = useRef(null);
  const [focused, setFocused] = useState(false);
  const { accessibilityLabel, labelProperties } = getLabelProperties({ properties });
  const disabled = loading === true || properties.disabled === true;
  const search = properties.variant === 'search';
  const { box, text } = search
    ? getSearchBoxStyle({ disabled, tokens })
    : getInputBoxStyle({ disabled, properties, status: validation?.status, tokens });
  const hasValue = !type.isNone(value) && value !== '';
  const setText = (input) => {
    methods.setValue(input);
    methods.triggerEvent({ name: 'onChange', event: { value: input } });
  };
  const clear = () => {
    setText('');
    methods.triggerEvent({ name: 'onClear' });
  };
  const showClear = (search || properties.allowClear === true) && !disabled && hasValue;
  const inputProps = {
    ...getKeyboardProps({ type: properties.type }),
    accessibilityLabel,
    autoFocus: properties.autoFocus === true,
    editable: !disabled,
    maxLength: properties.maxLength,
    onBlur: () => {
      setFocused(false);
      methods.triggerEvent({ name: 'onBlur' });
    },
    onChangeText: (input) =>
      setText(applyReplaceInput({ replaceInput: properties.replaceInput, text: input })),
    onFocus: () => {
      setFocused(true);
      methods.triggerEvent({ name: 'onFocus' });
    },
    onSubmitEditing: () => methods.triggerEvent({ name: 'onPressEnter' }),
    ref: inputRef,
    selectionColor: tokens.colorTint,
    testID: `${blockId}_input`,
    value: value ?? '',
  };
  if (properties.variant === 'row') {
    const rowText = getPropertyRowTextStyles({ tokens });
    const { title } = getLabelState({ properties: labelProperties });
    return (
      <Label
        blockId={blockId}
        properties={{ ...labelProperties, disabled: true }}
        required={required}
        styles={styles}
        tokens={tokens}
        validation={validation}
      >
        <PropertyRow
          disabled={disabled}
          onPress={() => inputRef.current?.focus()}
          required={required}
          styles={styles}
          testID={`${blockId}_row`}
          title={title}
          tokens={tokens}
        >
          {type.isString(properties.prefix) ? (
            <Text style={[rowText.value, styles.value]}>{properties.prefix}</Text>
          ) : null}
          <RNTextInput
            {...inputProps}
            placeholder={properties.placeholder ?? 'Not set'}
            placeholderTextColor={rowText.value.color}
            style={[rowText.value, { flex: 1, padding: 0, textAlign: 'right' }, styles.value]}
          />
          {showClear && focused ? (
            <ClearButton blockId={blockId} onPress={clear} tokens={tokens} />
          ) : null}
          {type.isString(properties.suffix) ? (
            <Text style={[rowText.value, styles.value]}>{properties.suffix}</Text>
          ) : null}
        </PropertyRow>
      </Label>
    );
  }
  return (
    <Label
      blockId={blockId}
      properties={labelProperties}
      required={required}
      styles={styles}
      tokens={tokens}
      validation={validation}
    >
      <View style={{ alignItems: 'center', flexDirection: 'row' }}>
        <View style={[box, { flex: 1 }, styles.element]}>
          {search ? (
            <components.Icon
              properties={{ name: 'search', title: '' }}
              styles={{
                element: { color: tokens.colorSecondaryLabel, fontSize: 17, marginRight: 6 },
              }}
              testID={`${blockId}_search_icon`}
            />
          ) : null}
          {type.isString(properties.prefix) ? (
            <Text style={[text, { color: tokens.colorSecondaryLabel, marginRight: 4 }]}>
              {properties.prefix}
            </Text>
          ) : null}
          <RNTextInput
            {...inputProps}
            {...(search
              ? { autoCapitalize: 'none', autoCorrect: false, returnKeyType: 'search' }
              : {})}
            placeholder={properties.placeholder ?? (search ? 'Search' : undefined)}
            placeholderTextColor={tokens.colorTertiaryLabel}
            style={[text, { flex: 1, paddingVertical: 0 }]}
          />
          {properties.showCount === true ? (
            <CountText maxLength={properties.maxLength} tokens={tokens} value={value} />
          ) : null}
          {showClear ? <ClearButton blockId={blockId} onPress={clear} tokens={tokens} /> : null}
          {type.isString(properties.suffix) ? (
            <Text style={[text, { color: tokens.colorSecondaryLabel, marginLeft: 4 }]}>
              {properties.suffix}
            </Text>
          ) : null}
        </View>
        {search && focused ? (
          <Pressable
            accessibilityRole="button"
            hitSlop={8}
            onPress={() => {
              if (hasValue) clear();
              inputRef.current?.blur();
            }}
            style={{ marginLeft: 12 }}
            testID={`${blockId}_cancel`}
          >
            <Text style={getIosTextStyle({ color: tokens.colorTint, textStyle: 'body', tokens })}>
              Cancel
            </Text>
          </Pressable>
        ) : null}
      </View>
    </Label>
  );
}

TextInput.meta = meta;

export default TextInput;
