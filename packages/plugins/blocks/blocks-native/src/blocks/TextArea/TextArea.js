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
import ComposerSendButton from './ComposerSendButton.js';
import CountText from '../../shared/CountText.js';
import getInputBoxStyle from '../../shared/getInputBoxStyle.js';
import getLabelProperties from '../Label/getLabelProperties.js';
import Label from '../Label/Label.js';
import meta from './meta.js';
import useBlockTokens from '../../shared/useBlockTokens.js';

const LINE_HEIGHT = 22;
const COMPOSER_PADDING = 8;
const COMPOSER_MAX_LINES = 6;

// The height of `rows` lines of body text; antd's TextArea takes two lines when `rows` is not set.
function getMinHeight({ rows }) {
  const lines = type.isInt(rows) ? rows : 2;
  return lines * LINE_HEIGHT + 2 * COMPOSER_PADDING;
}

// A multi-line text field that grows with its text. `variant: composer` is a message composer: a
// rounded field that grows from one line to six (then scrolls), with a send button when the block
// has onSend. Send fires onSend with the text and clears the field when its actions succeed.
function TextArea({
  blockId,
  components,
  events,
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
  const disabled = loading === true || properties.disabled === true;
  const composer = properties.variant === 'composer';
  const { box, text } = getInputBoxStyle({
    disabled,
    properties: composer ? { ...properties, variant: 'filled' } : properties,
    status: validation?.status,
    tokens,
  });
  const setText = (input) => {
    methods.setValue(input);
    methods.triggerEvent({ name: 'onChange', event: { value: input } });
  };
  const send = async () => {
    const result = await methods.triggerEvent({ name: 'onSend', event: { value } });
    if (result.success === true && result.bounced !== true) {
      methods.setValue('');
    }
  };
  const hasValue = !type.isNone(value) && value !== '';
  const heightStyle = composer
    ? {
        maxHeight: COMPOSER_MAX_LINES * LINE_HEIGHT + 2 * COMPOSER_PADDING,
        minHeight: LINE_HEIGHT + 2 * COMPOSER_PADDING,
      }
    : { minHeight: getMinHeight({ rows: properties.rows }) };
  return (
    <Label
      blockId={blockId}
      properties={labelProperties}
      required={required}
      styles={styles}
      tokens={tokens}
      validation={validation}
    >
      <View
        style={[
          box,
          { alignItems: 'flex-start' },
          composer ? { alignItems: 'flex-end', borderRadius: 20, paddingRight: 4 } : null,
          styles.element,
        ]}
      >
        <RNTextInput
          accessibilityLabel={accessibilityLabel}
          autoFocus={properties.autoFocus === true}
          editable={!disabled}
          maxLength={properties.maxLength}
          multiline
          numberOfLines={composer ? undefined : properties.rows}
          onBlur={() => methods.triggerEvent({ name: 'onBlur' })}
          onChangeText={setText}
          onFocus={() => methods.triggerEvent({ name: 'onFocus' })}
          placeholder={properties.placeholder}
          placeholderTextColor={tokens.colorTertiaryLabel}
          scrollEnabled={composer}
          selectionColor={tokens.colorTint}
          style={[
            text,
            heightStyle,
            {
              flex: 1,
              lineHeight: LINE_HEIGHT,
              paddingBottom: COMPOSER_PADDING,
              paddingTop: COMPOSER_PADDING,
              textAlignVertical: 'top',
            },
          ]}
          testID={`${blockId}_input`}
          value={value ?? ''}
        />
        {properties.allowClear === true && !disabled && hasValue && !composer ? (
          <View style={{ paddingTop: 11 }}>
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
        {composer && events.onSend ? (
          <ComposerSendButton
            blockId={blockId}
            components={components}
            disabled={disabled || !hasValue || value.trim() === ''}
            loading={events.onSend.loading === true}
            onPress={send}
            tokens={tokens}
          />
        ) : null}
      </View>
      {!type.isNone(properties.showCount) && properties.showCount !== false ? (
        <View style={{ alignItems: 'flex-end', marginTop: 4 }}>
          <CountText maxLength={properties.maxLength} tokens={tokens} value={value} />
        </View>
      ) : null}
    </Label>
  );
}

TextArea.meta = meta;

export default TextArea;
