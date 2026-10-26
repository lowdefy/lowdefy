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

import React, { useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';

import getSendState from '../Composer/getSendState.js';
import MentionTextInput from '../Composer/MentionTextInput.js';
import useMentionEditor from '../Composer/useMentionEditor.js';

/**
 * A comment's edit box: the composer's mention input holding the comment's markdown, with
 * Cancel and Save. Save runs onSave and closes the box when it succeeds.
 */
function EditBox({ colors, initial, maxLength, mentionFormat, onCancel, onSave, people }) {
  const [value, setValue] = useState(initial);
  const [saving, setSaving] = useState(false);
  const editor = useMentionEditor({ value, onChangeValue: setValue, people, mentionFormat });
  const { disabled } = getSendState({ value, sending: saving, maxLength });
  const save = async () => {
    if (disabled) return;
    setSaving(true);
    try {
      await onSave(value);
    } finally {
      setSaving(false);
    }
  };
  return (
    <View style={styles.box}>
      <View
        style={[styles.field, { backgroundColor: colors.nested, borderColor: colors.separator }]}
      >
        <MentionTextInput
          accessibilityLabel="Edit comment"
          autoFocus
          colors={colors}
          editor={editor}
          style={styles.input}
        />
      </View>
      <View style={styles.buttons}>
        <Pressable accessibilityRole="button" hitSlop={8} onPress={onCancel} style={styles.button}>
          <Text style={[styles.label, { color: colors.secondary }]}>Cancel</Text>
        </Pressable>
        <Pressable
          accessibilityRole="button"
          accessibilityState={{ busy: saving, disabled }}
          disabled={disabled}
          onPress={save}
          style={({ pressed }) => [
            styles.button,
            styles.save,
            { backgroundColor: disabled && !saving ? colors.fillStrong : colors.tint },
            pressed ? { opacity: 0.7 } : null,
          ]}
        >
          {saving ? (
            <ActivityIndicator color={colors.onTint} size="small" />
          ) : (
            <Text
              style={[
                styles.label,
                { color: disabled ? colors.tertiary : colors.onTint, fontWeight: '600' },
              ]}
            >
              Save
            </Text>
          )}
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  box: { gap: 8 },
  field: { borderRadius: 10, borderWidth: StyleSheet.hairlineWidth, paddingHorizontal: 10 },
  input: {
    fontSize: 15,
    lineHeight: 21,
    maxHeight: 21 * 10 + 16,
    minHeight: 21 * 2 + 16,
    paddingVertical: 8,
  },
  buttons: { alignItems: 'center', flexDirection: 'row', gap: 8, justifyContent: 'flex-end' },
  button: { alignItems: 'center', height: 32, justifyContent: 'center', paddingHorizontal: 12 },
  save: { borderRadius: 16, minWidth: 64 },
  label: { fontSize: 15 },
});

export default EditBox;
