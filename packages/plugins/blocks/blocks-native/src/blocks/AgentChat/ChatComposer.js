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

import React, { useEffect, useRef, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { type } from '@lowdefy/helpers';

import SystemIcon from '../../shared/SystemIcon.js';

const LINE_HEIGHT = 22;
const MAX_LINES = 6;
const FIELD_PADDING = 8;
const BUTTON = 32;

function RoundButton({
  accessibilityLabel,
  children,
  colors,
  disabled,
  filled,
  onPress,
  style,
  testID,
}) {
  return (
    <Pressable
      accessibilityLabel={accessibilityLabel}
      accessibilityRole="button"
      accessibilityState={{ disabled }}
      disabled={disabled}
      hitSlop={6}
      onPress={onPress}
      style={({ pressed }) => [
        styles.round,
        style,
        { backgroundColor: filled ? colors.tint : colors.fillStrong },
        disabled && filled ? { backgroundColor: colors.fillStrong } : null,
        pressed ? { opacity: 0.7 } : null,
      ]}
      testID={testID}
    >
      {children}
    </Pressable>
  );
}

function PromptChips({ blockId, colors, onPress, prompts }) {
  return (
    <ScrollView
      contentContainerStyle={styles.chips}
      horizontal
      keyboardShouldPersistTaps="handled"
      showsHorizontalScrollIndicator={false}
      style={styles.chipStrip}
    >
      {prompts.map((prompt, index) => (
        <Pressable
          accessibilityHint={prompt.description}
          accessibilityRole="button"
          key={prompt.key ?? `${index}`}
          onPress={() => onPress(prompt)}
          style={({ pressed }) => [
            styles.chip,
            {
              backgroundColor: pressed ? colors.pressed : colors.cell,
              borderColor: colors.separator,
            },
          ]}
          testID={`${blockId}_prompt_${index}`}
        >
          <Text numberOfLines={1} style={[styles.chipLabel, { color: colors.label }]}>
            {prompt.label}
          </Text>
          {type.isString(prompt.description) ? (
            <Text numberOfLines={1} style={[styles.chipDescription, { color: colors.secondary }]}>
              {prompt.description}
            </Text>
          ) : null}
        </Pressable>
      ))}
    </ScrollView>
  );
}

/**
 * The chat's composer, as ChatGPT's and Claude's iOS apps draw it: a rounded field that grows
 * with its text up to six lines, the send button inside it (a stop button while a reply streams),
 * and a new-chat button beside it. Prompt chips sit above it when there are any, and a "jump to
 * latest" control while the person reads back through a conversation.
 *
 * The text is held here, in the footer's own tree, so typing renders the composer and not the
 * conversation. `fill` ({ text, nonce }) replaces it (the setInput method).
 *
 * @param {Object} props
 * @param {string} props.blockId
 * @param {boolean} props.busy A reply is on its way: the send button stops it.
 * @param {Object} props.colors getTimelineColors.
 * @param {Object} props.components The block's components.
 * @param {boolean} props.disabled Nothing can be sent (the transcript is loading).
 * @param {{ text: string, nonce: number }|null} props.fill
 * @param {boolean} props.newChat Show the new-chat button.
 * @param {() => void} props.onJumpToLatest
 * @param {() => void} props.onNewChat
 * @param {(prompt: Object) => void} props.onPrompt
 * @param {(text: string) => Promise<boolean>} props.onSend Resolves true once sent.
 * @param {() => void} props.onStop
 * @param {string} props.placeholder
 * @param {Object[]} props.prompts Chips above the field.
 * @param {boolean} props.showJump
 * @param {Object} [props.style] The bar's style, from the block's `composer` style slot.
 * @param {Function} props.translate
 */
function ChatComposer({
  blockId,
  busy,
  colors,
  components,
  disabled,
  fill,
  newChat,
  onJumpToLatest,
  onNewChat,
  onPrompt,
  onSend,
  onStop,
  placeholder,
  prompts,
  showJump,
  style,
  translate,
}) {
  const [text, setText] = useState('');
  const [sending, setSending] = useState(false);
  const inputRef = useRef(null);
  const fillNonce = fill?.nonce;
  useEffect(() => {
    if (type.isNone(fill)) return;
    setText(fill.text);
    if (fill.text !== '') inputRef.current?.focus();
  }, [fillNonce]); // eslint-disable-line react-hooks/exhaustive-deps

  const empty = text.trim() === '';
  const send = async () => {
    if (empty || sending || disabled) return;
    setSending(true);
    try {
      const sent = await onSend(text);
      if (sent) setText('');
    } finally {
      setSending(false);
    }
  };

  return (
    <View style={[styles.bar, style]} testID={`${blockId}_composer`}>
      {showJump ? (
        <Pressable
          accessibilityLabel={translate('agent.chat.jumpToLatest')}
          accessibilityRole="button"
          hitSlop={8}
          onPress={onJumpToLatest}
          style={({ pressed }) => [
            styles.jump,
            { backgroundColor: colors.cell, borderColor: colors.separator },
            pressed ? { opacity: 0.7 } : null,
          ]}
          testID={`${blockId}_jump`}
        >
          <SystemIcon
            color={colors.label}
            components={components}
            fallback="ArrowDown"
            size={14}
            symbol="arrow.down"
          />
        </Pressable>
      ) : null}
      {prompts.length > 0 ? (
        <PromptChips blockId={blockId} colors={colors} onPress={onPrompt} prompts={prompts} />
      ) : null}
      <View style={styles.row}>
        {newChat ? (
          <RoundButton
            accessibilityLabel={translate('agent.chat.newChat')}
            colors={colors}
            onPress={onNewChat}
            style={styles.newChat}
            testID={`${blockId}_new_chat`}
          >
            <SystemIcon
              color={colors.label}
              components={components}
              fallback="SquarePen"
              size={15}
              symbol="square.and.pencil"
            />
          </RoundButton>
        ) : null}
        <View
          style={[styles.field, { backgroundColor: colors.nested, borderColor: colors.separator }]}
        >
          <TextInput
            accessibilityLabel={placeholder}
            editable={!disabled}
            multiline
            onChangeText={setText}
            placeholder={placeholder}
            placeholderTextColor={colors.tertiary}
            ref={inputRef}
            style={[styles.input, { color: colors.label }]}
            testID={`${blockId}_input`}
            value={text}
          />
          {busy ? (
            <RoundButton
              accessibilityLabel={translate('agent.chat.stop')}
              colors={colors}
              filled
              onPress={onStop}
              testID={`${blockId}_stop`}
            >
              <View style={[styles.stopSquare, { backgroundColor: colors.onTint }]} />
            </RoundButton>
          ) : (
            <RoundButton
              accessibilityLabel={translate('agent.chat.send')}
              colors={colors}
              disabled={empty || sending || disabled}
              filled
              onPress={send}
              testID={`${blockId}_send`}
            >
              <SystemIcon
                color={empty || disabled ? colors.tertiary : colors.onTint}
                components={components}
                fallback="ArrowUp"
                size={15}
                symbol="arrow.up"
              />
            </RoundButton>
          )}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  bar: { paddingBottom: 8, paddingTop: 8 },
  chipStrip: { flexGrow: 0, marginBottom: 8 },
  chips: { gap: 8, paddingHorizontal: 12 },
  chip: {
    borderCurve: 'continuous',
    borderRadius: 14,
    borderWidth: StyleSheet.hairlineWidth,
    maxWidth: 260,
    paddingHorizontal: 14,
    paddingVertical: 9,
  },
  chipLabel: { fontSize: 15, fontWeight: '600', letterSpacing: -0.24, lineHeight: 20 },
  chipDescription: { fontSize: 13, letterSpacing: -0.08, lineHeight: 18 },
  jump: {
    alignItems: 'center',
    alignSelf: 'center',
    borderRadius: 16,
    borderWidth: StyleSheet.hairlineWidth,
    height: 32,
    justifyContent: 'center',
    marginBottom: 8,
    width: 32,
  },
  row: { alignItems: 'flex-end', flexDirection: 'row', gap: 8, paddingHorizontal: 12 },
  field: {
    alignItems: 'flex-end',
    borderCurve: 'continuous',
    borderRadius: 20,
    borderWidth: StyleSheet.hairlineWidth,
    flex: 1,
    flexDirection: 'row',
    paddingBottom: 4,
    paddingLeft: 14,
    paddingRight: 4,
    paddingTop: 4,
  },
  input: {
    flex: 1,
    fontSize: 17,
    lineHeight: LINE_HEIGHT,
    maxHeight: LINE_HEIGHT * MAX_LINES + FIELD_PADDING * 2,
    minHeight: BUTTON,
    paddingBottom: 5,
    paddingTop: 5,
  },
  round: {
    alignItems: 'center',
    borderRadius: BUTTON / 2,
    height: BUTTON,
    justifyContent: 'center',
    width: BUTTON,
  },
  // Level with the send button inside the field.
  newChat: { marginBottom: 4 },
  stopSquare: { borderRadius: 3, height: 11, width: 11 },
});

export default ChatComposer;
