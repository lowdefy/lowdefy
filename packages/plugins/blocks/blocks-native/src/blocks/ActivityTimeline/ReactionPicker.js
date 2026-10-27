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

/** The reaction picker: a row of the reactions to pick from, the viewer's own marked. */
function ReactionPicker({ colors, mine, onPick, reactions }) {
  return (
    <View
      accessibilityRole="menu"
      style={[styles.picker, { backgroundColor: colors.nested, borderColor: colors.separator }]}
    >
      {reactions.map((emoji) => (
        <Pressable
          accessibilityLabel={`React with ${emoji}`}
          accessibilityRole="menuitem"
          hitSlop={4}
          key={emoji}
          onPress={() => onPick(emoji)}
          style={({ pressed }) => [
            styles.pick,
            mine.has(emoji) ? { backgroundColor: colors.tintFill } : null,
            pressed ? { backgroundColor: colors.fillStrong } : null,
          ]}
        >
          <Text style={styles.pickEmoji}>{emoji}</Text>
        </Pressable>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  picker: {
    alignSelf: 'flex-start',
    borderRadius: 22,
    borderWidth: StyleSheet.hairlineWidth,
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 2,
    marginTop: 10,
    padding: 4,
  },
  pick: {
    alignItems: 'center',
    borderRadius: 18,
    height: 36,
    justifyContent: 'center',
    width: 36,
  },
  pickEmoji: { fontSize: 20 },
});

export default ReactionPicker;
