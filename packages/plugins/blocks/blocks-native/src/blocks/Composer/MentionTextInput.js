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
import { Text, TextInput } from 'react-native';

const RECORD_LINK = /(\[\[[^[\]\n]+\]\])/;

// The shown text as styled children: mentions as tinted @Name chips (muted for someone who
// cannot see the record), record links in the tint.
function renderSegments({ colors, segments }) {
  return segments.map((segment, index) => {
    if (segment.kind === 'mention') {
      return (
        <Text
          key={index}
          style={{
            backgroundColor: segment.sees ? colors.tintFill : colors.fill,
            color: segment.sees ? colors.tint : colors.secondary,
            fontWeight: '600',
          }}
        >
          {`@${segment.name}`}
        </Text>
      );
    }
    return segment.text.split(RECORD_LINK).map((part, partIndex) => {
      if (part === '') return null;
      if (partIndex % 2 === 1) {
        return (
          <Text key={`${index}-${partIndex}`} style={{ color: colors.tint }}>
            {part}
          </Text>
        );
      }
      return <Text key={`${index}-${partIndex}`}>{part}</Text>;
    });
  });
}

/**
 * A multi-line text input driven by useMentionEditor: it shows the editor's segments as nested
 * styled text, which React Native draws inside the input, and reports changes and the cursor
 * back to the editor.
 */
function MentionTextInput({
  accessibilityLabel,
  autoFocus,
  colors,
  editable,
  editor,
  inputRef,
  onBlur,
  onFocus,
  placeholder,
  style,
  testID,
}) {
  return (
    <TextInput
      accessibilityLabel={accessibilityLabel}
      autoFocus={autoFocus}
      editable={editable}
      multiline
      onBlur={onBlur}
      onChangeText={editor.onChangeText}
      onFocus={onFocus}
      onSelectionChange={editor.onSelectionChange}
      placeholder={placeholder}
      placeholderTextColor={colors.tertiary}
      ref={inputRef}
      scrollEnabled
      selection={editor.selection}
      selectionColor={colors.tint}
      style={[{ color: colors.label, textAlignVertical: 'top' }, style]}
      testID={testID}
    >
      {editor.display === '' ? null : renderSegments({ colors, segments: editor.segments })}
    </TextInput>
  );
}

export default MentionTextInput;
