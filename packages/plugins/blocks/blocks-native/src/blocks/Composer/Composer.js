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

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { type } from '@lowdefy/helpers';
import { useElementRef } from '@lowdefy/client-native';

import getSendState from './getSendState.js';
import getTimelineColors from '../ActivityTimeline/getTimelineColors.js';
import MentionTextInput from './MentionTextInput.js';
import meta from './meta.js';
import rankMentions from './rankMentions.js';
import SuggestionList from './SuggestionList.js';
import useComponentTokens from '../../useComponentTokens.js';
import useMentionEditor from './useMentionEditor.js';

const LINK_SEARCH_MS = 200;
const LINE_HEIGHT = 22;
const FIELD_PADDING = 8;
const MAX_LINES = 8;
const DEFAULT_MAX_LENGTH = 4000;

function ReplyBanner({ colors, Icon, name, onCancel }) {
  return (
    <View style={styles.banner}>
      <Icon
        properties={{ name: 'CornerUpLeft', size: 14, title: '' }}
        styles={{ element: { color: colors.secondary } }}
      />
      <Text numberOfLines={1} style={[styles.bannerText, { color: colors.secondary }]}>
        Replying to <Text style={{ color: colors.label, fontWeight: '600' }}>{name}</Text>
      </Text>
      <Pressable
        accessibilityLabel="Cancel reply"
        accessibilityRole="button"
        hitSlop={10}
        onPress={onCancel}
        style={[styles.bannerClose, { backgroundColor: colors.fillStrong }]}
      >
        <Icon
          properties={{ name: 'X', size: 11, strokeWidth: 3, title: '' }}
          styles={{ element: { color: colors.secondary } }}
        />
      </Pressable>
    </View>
  );
}

function WarningLine({ colors, Icon, text }) {
  return (
    <View accessibilityRole="alert" style={styles.banner}>
      <Icon
        properties={{ name: 'TriangleAlert', size: 14, title: '' }}
        styles={{ element: { color: colors.warning } }}
      />
      <Text style={[styles.bannerText, { color: colors.warningText }]}>{text}</Text>
    </View>
  );
}

function SendButton({ colors, disabled, Icon, onPress, sending }) {
  return (
    <Pressable
      accessibilityLabel="Send"
      accessibilityRole="button"
      accessibilityState={{ busy: sending, disabled }}
      disabled={disabled}
      hitSlop={6}
      onPress={onPress}
      style={({ pressed }) => [
        styles.send,
        { backgroundColor: disabled && !sending ? colors.fillStrong : colors.tint },
        pressed ? { opacity: 0.7 } : null,
      ]}
      testID="composer_send"
    >
      {sending ? (
        <ActivityIndicator color={colors.onTint} size="small" />
      ) : (
        <Icon
          properties={{ name: 'ArrowUp', size: 18, strokeWidth: 2.75, title: '' }}
          styles={{ element: { color: disabled ? colors.tertiary : colors.onTint } }}
        />
      )}
    </Pressable>
  );
}

/**
 * A comment composer, as in GitHub's and Linear's iOS apps: a growing input (one to eight
 * lines) with a round send button, a reply-to banner and a warning line above it. Its value is
 * markdown. Typing @ at a word start opens a picker of the people who see the record; a pick
 * stores a mention token (`[[user:<id>]]` by default) and shows "@Name" in the input. Typing `[[`
 * opens a record picker fed by onLinkSearch and the `links` property, and a pick writes
 * `[[KEY]]`. The text clears once onSubmit's actions succeed.
 */
function Composer({
  blockId,
  components,
  loading,
  methods,
  properties,
  styles: blockStyles = {},
  value,
}) {
  const { isDark, tokens } = useComponentTokens(properties.theme);
  const colors = useMemo(() => getTimelineColors({ isDark, tokens }), [isDark, tokens]);
  const { Icon } = components;
  const maxLength = properties.maxLength ?? DEFAULT_MAX_LENGTH;
  const disabled = loading === true || properties.disabled === true;
  const [sending, setSending] = useState(false);

  const setText = useCallback(
    (next) => {
      methods.setValue(next);
      methods.triggerEvent({ name: 'onChange', event: { value: next } });
    },
    [methods]
  );
  const editor = useMentionEditor({
    value,
    onChangeValue: setText,
    people: properties.mentions,
    mentionFormat: properties.mentionFormat,
  });

  const inputRef = useRef(null);
  const registerElement = useElementRef({ blockId, kind: 'input' });
  const setInputRef = useCallback(
    (element) => {
      inputRef.current = element;
      return registerElement(element);
    },
    [registerElement]
  );
  useEffect(() => {
    methods.registerMethod('focus', () => inputRef.current?.focus());
  }, [methods]);

  const trigger = editor.trigger;
  const linkQuery = trigger?.kind === 'link' ? trigger.query : null;
  useEffect(() => {
    if (linkQuery === null) return undefined;
    const timer = setTimeout(() => {
      methods.triggerEvent({ name: 'onLinkSearch', event: { query: linkQuery } });
    }, LINK_SEARCH_MS);
    return () => clearTimeout(timer);
  }, [linkQuery, methods]);

  const people =
    trigger?.kind === 'mention'
      ? rankMentions({ people: properties.mentions, query: trigger.query })
      : [];
  const links = trigger?.kind === 'link' ? (properties.links ?? []).slice(0, 8) : [];

  const send = async () => {
    const body = editor.text;
    if (getSendState({ value: body, sending, maxLength }).disabled) return;
    setSending(true);
    try {
      const result = await methods.triggerEvent({
        name: 'onSubmit',
        event: { body, reply_to: properties.replyTo?.id ?? null },
      });
      if (result?.success === true && result.bounced !== true) {
        setText('');
      }
    } finally {
      setSending(false);
    }
  };

  const sendState = getSendState({ value: editor.text, sending, maxLength });
  const hasReply = type.isObject(properties.replyTo) && !type.isNone(properties.replyTo.id);
  const hasWarning = type.isString(properties.warning) && properties.warning !== '';

  const bar = (
    <View
      style={[
        styles.bar,
        { backgroundColor: colors.cell, borderTopColor: colors.separator },
        blockStyles.element,
      ]}
      testID={blockId}
    >
      {people.length > 0 || links.length > 0 ? (
        <SuggestionList
          colors={colors}
          Icon={Icon}
          isDark={isDark}
          linkIcons={properties.linkIcons}
          links={links}
          onPickLink={editor.pickLink}
          onPickMention={editor.pickMention}
          people={people}
          tokens={tokens}
        />
      ) : null}
      {hasReply ? (
        <ReplyBanner
          colors={colors}
          Icon={Icon}
          name={properties.replyTo.name ?? 'comment'}
          onCancel={() => methods.triggerEvent({ name: 'onCancelReply' })}
        />
      ) : null}
      {hasWarning ? <WarningLine colors={colors} Icon={Icon} text={properties.warning} /> : null}
      <View style={styles.inputRow}>
        <View
          style={[
            styles.field,
            { backgroundColor: colors.nested, borderColor: colors.separator },
            blockStyles.input,
          ]}
        >
          <MentionTextInput
            accessibilityLabel={properties.title ?? properties.placeholder ?? 'Comment'}
            autoFocus={properties.autoFocus === true}
            colors={colors}
            editable={!disabled}
            editor={editor}
            inputRef={setInputRef}
            onBlur={() => methods.triggerEvent({ name: 'onBlur' })}
            onFocus={() => methods.triggerEvent({ name: 'onFocus' })}
            placeholder={properties.placeholder ?? 'Add a comment…'}
            style={styles.input}
            testID={`${blockId}_input`}
          />
        </View>
        <View style={styles.sendColumn}>
          {sendState.counter ? (
            <Text
              style={[
                styles.counter,
                { color: sendState.counter.over ? colors.danger : colors.tertiary },
              ]}
            >
              {sendState.counter.text}
            </Text>
          ) : null}
          <SendButton
            colors={colors}
            disabled={sendState.disabled || disabled}
            Icon={Icon}
            onPress={send}
            sending={sending}
          />
        </View>
      </View>
    </View>
  );

  if (properties.sticky === false) {
    return bar;
  }
  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={properties.keyboardOffset ?? 0}
    >
      {bar}
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  bar: {
    borderTopWidth: StyleSheet.hairlineWidth,
    paddingBottom: 8,
    paddingHorizontal: 12,
    paddingTop: 8,
  },
  banner: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 6,
    marginBottom: 8,
    paddingHorizontal: 4,
  },
  bannerText: { flex: 1, fontSize: 13, lineHeight: 18 },
  bannerClose: {
    alignItems: 'center',
    borderRadius: 10,
    height: 20,
    justifyContent: 'center',
    width: 20,
  },
  inputRow: { alignItems: 'flex-end', flexDirection: 'row', gap: 8 },
  field: {
    borderRadius: 19,
    borderWidth: StyleSheet.hairlineWidth,
    flex: 1,
    paddingHorizontal: 14,
  },
  input: {
    fontSize: 17,
    lineHeight: LINE_HEIGHT,
    maxHeight: LINE_HEIGHT * MAX_LINES + FIELD_PADDING * 2,
    minHeight: LINE_HEIGHT + FIELD_PADDING * 2,
    paddingBottom: FIELD_PADDING,
    paddingHorizontal: 0,
    paddingTop: FIELD_PADDING,
  },
  sendColumn: { alignItems: 'center', gap: 4, paddingBottom: 3 },
  counter: { fontSize: 11, fontVariant: ['tabular-nums'] },
  send: {
    alignItems: 'center',
    borderRadius: 16,
    height: 32,
    justifyContent: 'center',
    width: 32,
  },
});

Composer.meta = meta;

export default Composer;
