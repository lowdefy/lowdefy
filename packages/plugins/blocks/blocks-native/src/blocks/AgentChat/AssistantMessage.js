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

import React, { memo } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';

import describeToolPart from './describeToolPart.js';
import getMessageSegments from './getMessageSegments.js';
import MarkdownContent from '../Markdown/MarkdownContent.js';
import ReasoningDisclosure from './ReasoningDisclosure.js';
import SystemIcon from '../../shared/SystemIcon.js';
import ToolApprovalCard from './ToolApprovalCard.js';
import ToolCallRow from './ToolCallRow.js';

function ToolSegment({
  colors,
  components,
  config,
  linkChips,
  onApprove,
  onLinkPress,
  parts,
  testID,
  translate,
}) {
  const descriptions = parts.map((part) => describeToolPart({ config, part, translate }));
  const approvals = descriptions.filter((description) => description.status === 'approval');
  const calls = descriptions.filter((description) => description.status !== 'approval');
  return (
    <View style={styles.tools}>
      {calls.length > 0 ? (
        <View
          style={[
            styles.toolGroup,
            { backgroundColor: colors.cell, borderColor: colors.separator },
          ]}
        >
          {calls.map((description, index) => (
            <View
              key={description.id}
              style={
                index > 0
                  ? { borderTopColor: colors.separator, borderTopWidth: StyleSheet.hairlineWidth }
                  : null
              }
            >
              <ToolCallRow
                colors={colors}
                components={components}
                description={description}
                linkChips={linkChips}
                onLinkPress={onLinkPress}
                testID={`${testID}_tool_${description.id}`}
              />
            </View>
          ))}
        </View>
      ) : null}
      {approvals.map((description) => (
        <ToolApprovalCard
          colors={colors}
          components={components}
          description={description}
          key={description.id}
          onLinkPress={onLinkPress}
          onRespond={(approved) => onApprove({ approved, id: description.approvalId })}
          testID={`${testID}_approval_${description.id}`}
          translate={translate}
        />
      ))}
    </View>
  );
}

function FileSegment({ colors, components, parts }) {
  return (
    <View style={styles.files}>
      {parts.map((part, index) => (
        <View key={index} style={[styles.file, { backgroundColor: colors.fill }]}>
          <SystemIcon
            color={colors.secondary}
            components={components}
            fallback="Paperclip"
            size={13}
            symbol="paperclip"
          />
          <Text numberOfLines={1} style={[styles.fileName, { color: colors.label }]}>
            {part.filename ?? 'File'}
          </Text>
        </View>
      ))}
    </View>
  );
}

/**
 * A reply from the agent, full width as the chat apps draw it, its parts in the order they came:
 * reasoning behind a disclosure, tool calls as compact rows (and approvals as cards), files, the
 * agent's status updates while it works, and its text as markdown in the iOS typography. A long
 * press opens its actions (Copy, Regenerate).
 *
 * @param {Object} props
 * @param {Object} props.colors
 * @param {Object} props.components
 * @param {Object} [props.config] The messageDisplay property.
 * @param {boolean} props.isStreaming This reply is still streaming.
 * @param {Object[]} [props.linkChips] Links drawn as inline chips (the linkChips property).
 * @param {Object} props.message
 * @param {({ id, approved }) => void} props.onApprove
 * @param {(href: string) => void} props.onLinkPress
 * @param {(message: Object) => void} props.onLongPress
 * @param {string} props.testID
 * @param {Function} props.translate
 */
function AssistantMessage({
  colors,
  components,
  config,
  isStreaming,
  linkChips,
  message,
  onApprove,
  onLinkPress,
  onLongPress,
  testID,
  translate,
}) {
  const segments = getMessageSegments({ config, parts: message.parts });
  return (
    <Pressable
      delayLongPress={350}
      disabled={isStreaming}
      onLongPress={() => onLongPress(message)}
      style={styles.message}
      testID={testID}
    >
      {segments.map((segment) => {
        const key = `${testID}_${segment.key}`;
        switch (segment.category) {
          case 'reasoning': {
            const text = segment.parts.map((part) => part.text ?? '').join('');
            const active = isStreaming && segment.parts.some((part) => part.state === 'streaming');
            if (text.trim() === '' && !active) return null;
            return (
              <ReasoningDisclosure
                active={active}
                colors={colors}
                components={components}
                key={key}
                testID={key}
                text={text}
                translate={translate}
              />
            );
          }
          case 'tool':
            return (
              <ToolSegment
                colors={colors}
                components={components}
                config={config}
                key={key}
                linkChips={linkChips}
                onApprove={onApprove}
                onLinkPress={onLinkPress}
                parts={segment.parts}
                testID={testID}
                translate={translate}
              />
            );
          case 'file':
            return (
              <FileSegment
                colors={colors}
                components={components}
                key={key}
                parts={segment.parts}
              />
            );
          case 'status': {
            if (!isStreaming) return null;
            const last = segment.parts[segment.parts.length - 1];
            return (
              <View key={key} style={styles.status} testID={key}>
                <ActivityIndicator color={colors.secondary} size="small" />
                <Text style={[styles.statusText, { color: colors.secondary }]}>
                  {last.data?.message ?? translate('agent.toolResult.processing')}
                </Text>
              </View>
            );
          }
          case 'text': {
            const text = segment.parts.map((part) => part.text ?? '').join('');
            if (text === '') return null;
            return (
              <MarkdownContent
                components={components}
                content={text}
                key={key}
                linkChips={linkChips}
                onLinkPress={onLinkPress}
              />
            );
          }
          default:
            return null;
        }
      })}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  message: { gap: 10 },
  tools: { gap: 8 },
  toolGroup: {
    borderCurve: 'continuous',
    borderRadius: 14,
    borderWidth: StyleSheet.hairlineWidth,
    overflow: 'hidden',
  },
  files: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  file: {
    alignItems: 'center',
    borderRadius: 10,
    flexDirection: 'row',
    gap: 6,
    maxWidth: 240,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  fileName: { flexShrink: 1, fontSize: 13, lineHeight: 18 },
  status: { alignItems: 'center', flexDirection: 'row', gap: 8 },
  statusText: { fontSize: 13, letterSpacing: -0.08, lineHeight: 18 },
});

export default memo(AssistantMessage);
