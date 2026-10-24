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
import { Animated, Pressable, StyleSheet, Text, View } from 'react-native';

import SystemIcon from '../../shared/SystemIcon.js';

/**
 * The model's reasoning, collapsed behind a disclosure as Claude's and ChatGPT's apps show it:
 * "Thinking" pulsing while it streams, "Thought process" once done, and the text in the secondary
 * label colour under a rule when opened.
 *
 * @param {Object} props
 * @param {boolean} props.active The reasoning is still streaming.
 * @param {Object} props.colors
 * @param {Object} props.components
 * @param {string} props.testID
 * @param {string} props.text
 * @param {Function} props.translate
 */
function ReasoningDisclosure({ active, colors, components, testID, text, translate }) {
  const [open, setOpen] = useState(false);
  const pulse = useRef(new Animated.Value(1)).current;
  useEffect(() => {
    if (!active) {
      pulse.setValue(1);
      return undefined;
    }
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, { duration: 700, toValue: 0.4, useNativeDriver: true }),
        Animated.timing(pulse, { duration: 700, toValue: 1, useNativeDriver: true }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, [active, pulse]);
  const label = translate(active ? 'agent.chat.thinking' : 'agent.chat.thought');
  return (
    <View>
      <Pressable
        accessibilityLabel={label}
        accessibilityRole="button"
        accessibilityState={{ expanded: open }}
        hitSlop={6}
        onPress={() => setOpen((value) => !value)}
        style={styles.header}
        testID={testID}
      >
        <Animated.Text style={[styles.label, { color: colors.secondary, opacity: pulse }]}>
          {label}
        </Animated.Text>
        <SystemIcon
          color={colors.tertiary}
          components={components}
          fallback={open ? 'ChevronDown' : 'ChevronRight'}
          size={11}
          symbol={open ? 'chevron.down' : 'chevron.right'}
        />
      </Pressable>
      {open ? (
        <View style={[styles.body, { borderLeftColor: colors.separator }]}>
          <Text
            selectable
            style={[styles.text, { color: colors.secondary }]}
            testID={`${testID}_text`}
          >
            {text.trim()}
          </Text>
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    alignItems: 'center',
    alignSelf: 'flex-start',
    flexDirection: 'row',
    gap: 6,
    paddingVertical: 2,
  },
  label: { fontSize: 15, fontWeight: '500', letterSpacing: -0.24, lineHeight: 20 },
  body: { borderLeftWidth: 2, marginBottom: 2, marginTop: 6, paddingLeft: 12 },
  text: { fontSize: 15, letterSpacing: -0.24, lineHeight: 21 },
});

export default ReasoningDisclosure;
