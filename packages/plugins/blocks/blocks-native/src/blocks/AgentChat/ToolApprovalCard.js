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
import { Pressable, StyleSheet, Text, View } from 'react-native';

import getReadableRows from './getReadableRows.js';
import SystemIcon from '../../shared/SystemIcon.js';
import ToolDetail from './ToolDetail.js';

function ApprovalButton({ colors, label, onPress, primary, testID }) {
  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      style={({ pressed }) => [
        styles.button,
        { backgroundColor: primary ? colors.tint : colors.fillStrong },
        pressed ? { opacity: 0.7 } : null,
      ]}
      testID={testID}
    >
      <Text style={[styles.buttonLabel, { color: primary ? colors.onTint : colors.label }]}>
        {label}
      </Text>
    </Pressable>
  );
}

/**
 * A tool call the agent asks the person to allow: the tool's glyph and name, what it would be
 * called with as readable rows, and Reject and Approve. The answer goes to the agent
 * (addToolApprovalResponse), which then runs the tool or not.
 *
 * @param {Object} props
 * @param {Object} props.colors
 * @param {Object} props.components
 * @param {Object} props.description describeToolPart, with status `approval`.
 * @param {(approved: boolean) => void} props.onRespond
 * @param {(href: string) => void} props.onLinkPress
 * @param {string} props.testID
 * @param {Function} props.translate
 */
function ToolApprovalCard({
  colors,
  components,
  description,
  onLinkPress,
  onRespond,
  testID,
  translate,
}) {
  const rows = getReadableRows({ output: description.input ?? {}, translate });
  return (
    <View
      style={[styles.card, { backgroundColor: colors.cell, borderColor: colors.separator }]}
      testID={testID}
    >
      <View style={styles.header}>
        <View style={[styles.tile, { backgroundColor: colors.tintFill }]}>
          <SystemIcon
            color={colors.tint}
            components={components}
            fallback={description.icon.fallback}
            size={14}
            symbol={description.icon.symbol}
          />
        </View>
        <View style={styles.text}>
          <Text style={[styles.title, { color: colors.label }]}>{description.title}</Text>
          <Text style={[styles.summary, { color: colors.secondary }]}>{description.summary}</Text>
        </View>
      </View>
      {rows.length > 0 && description.input ? (
        <View style={[styles.input, { backgroundColor: colors.nested }]}>
          <ToolDetail
            colors={colors}
            components={components}
            detail={{ kind: 'rows', rows }}
            onLinkPress={onLinkPress}
          />
        </View>
      ) : null}
      <View style={styles.buttons}>
        <ApprovalButton
          colors={colors}
          label={translate('agent.toolApproval.reject')}
          onPress={() => onRespond(false)}
          testID={`${testID}_reject`}
        />
        <ApprovalButton
          colors={colors}
          label={translate('agent.toolApproval.approve')}
          onPress={() => onRespond(true)}
          primary
          testID={`${testID}_approve`}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderCurve: 'continuous',
    borderRadius: 14,
    borderWidth: StyleSheet.hairlineWidth,
    gap: 12,
    padding: 12,
  },
  header: { alignItems: 'center', flexDirection: 'row', gap: 10 },
  tile: {
    alignItems: 'center',
    borderCurve: 'continuous',
    borderRadius: 7,
    height: 28,
    justifyContent: 'center',
    width: 28,
  },
  text: { flex: 1, gap: 1 },
  title: { fontSize: 15, fontWeight: '600', letterSpacing: -0.24, lineHeight: 20 },
  summary: { fontSize: 13, letterSpacing: -0.08, lineHeight: 18 },
  input: { borderCurve: 'continuous', borderRadius: 10, padding: 10 },
  buttons: { flexDirection: 'row', gap: 8 },
  button: {
    alignItems: 'center',
    borderCurve: 'continuous',
    borderRadius: 10,
    flex: 1,
    height: 40,
    justifyContent: 'center',
  },
  buttonLabel: { fontSize: 15, fontWeight: '600', letterSpacing: -0.24 },
});

export default ToolApprovalCard;
