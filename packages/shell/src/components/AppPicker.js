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
import { Pressable, ScrollView, StyleSheet, Text } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const styles = StyleSheet.create({
  list: {
    padding: 24,
    gap: 12,
  },
  heading: {
    fontSize: 24,
    fontWeight: '600',
    marginBottom: 12,
  },
  item: {
    padding: 16,
    borderRadius: 12,
    backgroundColor: '#f0f0f0',
  },
  name: {
    fontSize: 18,
  },
  hint: {
    fontSize: 13,
    color: '#8c8c8c',
  },
});

// The apps a shell opens, for a shell with several. The app opened last is listed first.
function AppPicker({ apps, lastAppId, onPick, shellName }) {
  const insets = useSafeAreaInsets();
  const ordered = [
    ...apps.filter((app) => app.id === lastAppId),
    ...apps.filter((app) => app.id !== lastAppId),
  ];
  return (
    <ScrollView contentContainerStyle={[styles.list, { paddingTop: insets.top + 24 }]}>
      <Text style={styles.heading}>{shellName}</Text>
      {ordered.map((app) => (
        <Pressable
          accessibilityRole="button"
          key={app.id}
          onPress={() => onPick(app.id)}
          style={styles.item}
          testID={`app-${app.id}`}
        >
          <Text style={styles.name}>{app.name}</Text>
          {app.id === lastAppId ? <Text style={styles.hint}>Opened last</Text> : null}
        </Pressable>
      ))}
    </ScrollView>
  );
}

export default AppPicker;
