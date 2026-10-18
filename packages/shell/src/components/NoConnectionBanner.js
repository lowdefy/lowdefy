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

import React, { useSyncExternalStore } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import networkStatus from '../host/networkStatus.js';

const styles = StyleSheet.create({
  banner: {
    backgroundColor: '#434343',
    paddingBottom: 6,
    alignItems: 'center',
  },
  text: {
    color: '#ffffff',
    fontSize: 13,
  },
});

// Shown in the frame while the shell is offline (networkStatus: the phone's network, or Lowdefy
// Dev's network injection). Cached pages still open; requests fail with the core's network
// error, as in a browser that lost its connection.
function NoConnectionBanner() {
  const online = useSyncExternalStore(networkStatus.subscribe, networkStatus.isOnline);
  const insets = useSafeAreaInsets();
  if (online) {
    return null;
  }
  return (
    <View style={[styles.banner, { paddingTop: insets.top + 6 }]} testID="NoConnection">
      <Text style={styles.text}>No connection</Text>
    </View>
  );
}

export default NoConnectionBanner;
