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
import { type } from '@lowdefy/helpers';

import SystemIcon from '../../shared/SystemIcon.js';
import ToolDetail from './ToolDetail.js';

const TILE = 28;

function StatusGlyph({ colors, components, expanded, status, hasDetail }) {
  if (status === 'running' || status === 'approval') {
    return <ActivityIndicator color={colors.secondary} size="small" />;
  }
  if (status === 'error') {
    return (
      <SystemIcon
        color={colors.danger}
        components={components}
        fallback="CircleAlert"
        size={16}
        symbol="exclamationmark.circle.fill"
      />
    );
  }
  if (status === 'denied') {
    return (
      <SystemIcon
        color={colors.tertiary}
        components={components}
        fallback="CircleX"
        size={16}
        symbol="xmark.circle.fill"
      />
    );
  }
  if (!hasDetail) {
    return (
      <SystemIcon
        color={colors.success}
        components={components}
        fallback="CircleCheck"
        size={16}
        symbol="checkmark.circle.fill"
      />
    );
  }
  return (
    <SystemIcon
      color={colors.tertiary}
      components={components}
      fallback={expanded ? 'ChevronUp' : 'ChevronDown'}
      size={12}
      symbol={expanded ? 'chevron.up' : 'chevron.down'}
    />
  );
}

/**
 * One tool call, as a compact row: the tool's glyph on a tile, its readable name, a one-line
 * summary, and its status at the end (a spinner while it runs, a check when it finished with
 * nothing to show, a chevron when it can open). Pressing a finished call opens its output.
 *
 * @param {Object} props
 * @param {Object} props.colors
 * @param {Object} props.components
 * @param {Object} props.description describeToolPart.
 * @param {Object[]} [props.linkChips]
 * @param {(href: string) => void} props.onLinkPress
 * @param {string} props.testID
 */
function ToolCallRow({ colors, components, description, linkChips, onLinkPress, testID }) {
  const [expanded, setExpanded] = useState(false);
  const hasDetail = !type.isNone(description.detail);
  return (
    <View>
      <Pressable
        accessibilityHint={description.summary}
        accessibilityLabel={description.title}
        accessibilityRole={hasDetail ? 'button' : undefined}
        accessibilityState={hasDetail ? { expanded } : undefined}
        disabled={!hasDetail}
        onPress={() => setExpanded((open) => !open)}
        style={({ pressed }) => [styles.row, pressed ? { backgroundColor: colors.pressed } : null]}
        testID={testID}
      >
        <View style={[styles.tile, { backgroundColor: colors.fill }]}>
          <SystemIcon
            color={colors.secondary}
            components={components}
            fallback={description.icon.fallback}
            size={14}
            symbol={description.icon.symbol}
          />
        </View>
        <View style={styles.text}>
          <Text numberOfLines={1} style={[styles.title, { color: colors.label }]}>
            {description.title}
          </Text>
          <Text
            numberOfLines={1}
            style={[
              styles.summary,
              { color: description.status === 'error' ? colors.danger : colors.secondary },
            ]}
          >
            {description.summary}
          </Text>
        </View>
        <StatusGlyph
          colors={colors}
          components={components}
          expanded={expanded}
          hasDetail={hasDetail}
          status={description.status}
        />
      </Pressable>
      {expanded && hasDetail ? (
        <View
          style={[styles.detail, { borderTopColor: colors.separator }]}
          testID={`${testID}_detail`}
        >
          <ToolDetail
            colors={colors}
            components={components}
            detail={description.detail}
            linkChips={linkChips}
            onLinkPress={onLinkPress}
          />
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 10,
    minHeight: 48,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  tile: {
    alignItems: 'center',
    borderCurve: 'continuous',
    borderRadius: 7,
    height: TILE,
    justifyContent: 'center',
    width: TILE,
  },
  text: { flex: 1, gap: 1 },
  title: { fontSize: 15, fontWeight: '600', letterSpacing: -0.24, lineHeight: 20 },
  summary: { fontSize: 13, letterSpacing: -0.08, lineHeight: 18 },
  detail: {
    borderTopWidth: StyleSheet.hairlineWidth,
    marginLeft: 12 + TILE + 10,
    paddingBottom: 10,
    paddingRight: 12,
    paddingTop: 8,
  },
});

export default ToolCallRow;
