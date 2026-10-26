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
import { Platform, StyleSheet, Text, View } from 'react-native';

import MarkdownContent from '../Markdown/MarkdownContent.js';

const monospace = Platform.select({ ios: 'Menlo', default: 'monospace' });

function Rows({ colors, onLinkPress, rows }) {
  return (
    <View style={styles.rows}>
      {rows.map((row, index) => {
        const indent = { paddingLeft: row.depth * 12 };
        if (row.kind === 'group') {
          return (
            <Text key={index} style={[styles.group, indent, { color: colors.label }]}>
              {row.label}
            </Text>
          );
        }
        if (row.kind === 'more') {
          return (
            <Text key={index} style={[styles.value, indent, { color: colors.tertiary }]}>
              {row.text}
            </Text>
          );
        }
        let color = colors.label;
        if (row.kind === 'empty') color = colors.tertiary;
        if (row.kind === 'link') color = colors.tint;
        return (
          <Text key={index} selectable style={[styles.value, indent, { color: colors.secondary }]}>
            {row.label ? <Text style={styles.label}>{`${row.label}  `}</Text> : null}
            <Text
              onPress={row.kind === 'link' ? () => onLinkPress(row.text) : undefined}
              style={{ color }}
            >
              {row.text}
            </Text>
          </Text>
        );
      })}
    </View>
  );
}

/**
 * The expanded part of a tool call's card: a markdown `display` or sub-agent answer, the output as
 * JSON (toolResultDisplay `full`), or its readable rows.
 *
 * @param {Object} props
 * @param {Object} props.colors
 * @param {Object} props.components
 * @param {{ kind: 'markdown'|'json'|'rows', text?: string, rows?: Object[] }} props.detail
 * @param {Object[]} [props.linkChips]
 * @param {(href: string) => void} props.onLinkPress
 */
function ToolDetail({ colors, components, detail, linkChips, onLinkPress }) {
  if (detail.kind === 'markdown') {
    return (
      <MarkdownContent
        components={components}
        content={detail.text}
        linkChips={linkChips}
        onLinkPress={onLinkPress}
      />
    );
  }
  if (detail.kind === 'json') {
    return (
      <Text selectable style={[styles.json, { color: colors.label }]}>
        {detail.text}
      </Text>
    );
  }
  return <Rows colors={colors} onLinkPress={onLinkPress} rows={detail.rows} />;
}

const styles = StyleSheet.create({
  rows: { gap: 4 },
  group: { fontSize: 13, fontWeight: '600', letterSpacing: -0.08, lineHeight: 18, marginTop: 2 },
  label: { fontWeight: '500' },
  value: { fontSize: 13, letterSpacing: -0.08, lineHeight: 18 },
  json: { fontFamily: monospace, fontSize: 12, lineHeight: 17 },
});

export default ToolDetail;
