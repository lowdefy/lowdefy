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
import { Platform, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import AvatarCircle from '../Avatar/AvatarCircle.js';

const ROW_HEIGHT = 44;
const MAX_ROWS = 4.5;
const monospace = Platform.select({ ios: 'Menlo', default: 'monospace' });

const DEFAULT_LINK_ICONS = {
  decision: 'Scale',
  design: 'FileText',
  document: 'FileText',
  task: 'CircleCheck',
};

function MentionRow({ colors, isDark, onPick, person, tokens }) {
  return (
    <Pressable
      accessibilityLabel={`Mention ${person.label}`}
      accessibilityRole="button"
      onPress={() => onPick(person)}
      style={({ pressed }) => [styles.row, pressed ? { backgroundColor: colors.fill } : null]}
    >
      <AvatarCircle avatar={{ name: person.label }} isDark={isDark} size={28} tokens={tokens} />
      <Text numberOfLines={1} style={[styles.name, { color: colors.label }]}>
        {person.label}
      </Text>
    </Pressable>
  );
}

function LinkRow({ colors, Icon, hit, linkIcons, onPick }) {
  return (
    <Pressable
      accessibilityLabel={`Link ${hit.key} ${hit.title ?? ''}`.trim()}
      accessibilityRole="button"
      onPress={() => onPick(hit.key)}
      style={({ pressed }) => [styles.row, pressed ? { backgroundColor: colors.fill } : null]}
    >
      <View style={styles.linkIcon}>
        <Icon
          properties={{ name: linkIcons[hit.kind] ?? 'Link', size: 18, title: '' }}
          styles={{ element: { color: colors.secondary } }}
        />
      </View>
      <Text style={[styles.key, { color: colors.secondary }]}>{hit.key}</Text>
      <Text numberOfLines={1} style={[styles.name, { color: colors.label }]}>
        {hit.title ?? ''}
      </Text>
    </Pressable>
  );
}

/**
 * The picker above the composer's input: people for an @ mention, or records for a `[[` link.
 * Taps on it never dismiss the keyboard.
 */
function SuggestionList({
  colors,
  Icon,
  isDark,
  linkIcons,
  links,
  onPickLink,
  onPickMention,
  people,
  tokens,
}) {
  const icons = { ...DEFAULT_LINK_ICONS, ...(linkIcons ?? {}) };
  const count = (people?.length ?? 0) + (links?.length ?? 0);
  return (
    <View
      style={[
        styles.list,
        {
          borderBottomColor: colors.separator,
          maxHeight: ROW_HEIGHT * Math.min(count, MAX_ROWS),
        },
      ]}
      testID="composer_suggestions"
    >
      <ScrollView keyboardShouldPersistTaps="always">
        {(people ?? []).map((person) => (
          <MentionRow
            colors={colors}
            isDark={isDark}
            key={String(person.value)}
            onPick={onPickMention}
            person={person}
            tokens={tokens}
          />
        ))}
        {(links ?? []).map((hit) => (
          <LinkRow
            colors={colors}
            hit={hit}
            Icon={Icon}
            key={hit.key}
            linkIcons={icons}
            onPick={onPickLink}
          />
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  list: {
    borderBottomWidth: StyleSheet.hairlineWidth,
    marginBottom: 8,
    marginHorizontal: -4,
  },
  row: {
    alignItems: 'center',
    borderRadius: 8,
    flexDirection: 'row',
    gap: 10,
    height: ROW_HEIGHT,
    paddingHorizontal: 8,
  },
  linkIcon: { alignItems: 'center', width: 28 },
  key: { fontFamily: monospace, fontSize: 13 },
  name: { flex: 1, fontSize: 17 },
});

export default SuggestionList;
