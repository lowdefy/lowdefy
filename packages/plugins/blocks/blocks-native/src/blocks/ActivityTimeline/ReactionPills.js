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

/**
 * A comment's reaction pills, each with its count, tinted when the viewer reacted, and a pill
 * that opens the reaction picker. Pressing a pill toggles the viewer's reaction.
 */
function ReactionPills({ canReact, colors, Icon, onAdd, onToggle, reactions }) {
  if (reactions.length === 0) return null;
  return (
    <View style={styles.pills}>
      {reactions.map((pill) => (
        <Pressable
          accessibilityLabel={`${pill.emoji} ${pill.count}${pill.mine ? ', you reacted' : ''}`}
          accessibilityRole="button"
          accessibilityState={{ selected: pill.mine, disabled: !canReact }}
          disabled={!canReact}
          key={pill.emoji}
          onPress={() => onToggle(pill.emoji)}
          style={({ pressed }) => [
            styles.pill,
            pill.mine
              ? { backgroundColor: colors.tintFill, borderColor: colors.tint }
              : { backgroundColor: colors.fill, borderColor: 'transparent' },
            pressed ? { opacity: 0.6 } : null,
          ]}
        >
          <Text style={styles.emoji}>{pill.emoji}</Text>
          <Text style={[styles.count, { color: pill.mine ? colors.tint : colors.secondary }]}>
            {pill.count}
          </Text>
        </Pressable>
      ))}
      {canReact ? (
        <Pressable
          accessibilityLabel="Add a reaction"
          accessibilityRole="button"
          onPress={onAdd}
          style={({ pressed }) => [
            styles.pill,
            { backgroundColor: colors.fill, borderColor: 'transparent' },
            pressed ? { opacity: 0.6 } : null,
          ]}
        >
          <Icon
            properties={{ name: 'FaceSlightlySmilingPlus', size: 16, title: '' }}
            styles={{ element: { color: colors.secondary } }}
          />
        </Pressable>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  pills: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 10 },
  pill: {
    alignItems: 'center',
    borderRadius: 14,
    borderWidth: 1,
    flexDirection: 'row',
    gap: 4,
    height: 28,
    minWidth: 40,
    justifyContent: 'center',
    paddingHorizontal: 9,
  },
  emoji: { fontSize: 14 },
  count: { fontSize: 13, fontVariant: ['tabular-nums'], fontWeight: '600' },
});

export default ReactionPills;
