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
import { Pressable, ScrollView, Text, TextInput } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import devStyles from '../devStyles.js';
import parseServerInput from '../connection/parseServerInput.js';
import QrScanner from './QrScanner.js';

/**
 * Lowdefy Dev with no server: scan the code `lowdefy dev --lan` prints, type or paste its address,
 * or pick one of the last 5 servers.
 *
 * @param {Object} props
 * @param {Array<{ url, host, pair }>} props.recent The servers connected to before, last first.
 * @param {(server) => void} props.onOffer A server to confirm, from a code or a typed address.
 * @param {(server) => void} props.onPick A server connected to before.
 * @param {(text: string) => void} props.onScanned The text of a scanned code.
 * @param {string} props.scheme The shell's URL scheme.
 * @param {string|null} props.message A note to show, such as why a link could not be used.
 */
function ConnectScreen({ message, onOffer, onPick, onScanned, recent, scheme }) {
  const insets = useSafeAreaInsets();
  const [input, setInput] = useState('');
  const [error, setError] = useState(null);
  const [scanning, setScanning] = useState(false);

  function submit() {
    const parsed = parseServerInput({ input, scheme });
    if (parsed.error) {
      setError(parsed.error);
      return;
    }
    setError(null);
    onOffer(parsed);
  }

  return (
    <ScrollView
      contentContainerStyle={[devStyles.screen, { paddingTop: insets.top + 24 }]}
      keyboardShouldPersistTaps="handled"
      testID="dev-connect"
    >
      <Text style={devStyles.heading}>Lowdefy Dev</Text>
      <Text style={devStyles.hint}>
        Run lowdefy dev --lan and scan the code it prints, or enter the address it shows.
      </Text>
      {message ? <Text style={devStyles.error}>{message}</Text> : null}
      <Pressable
        accessibilityRole="button"
        onPress={() => setScanning(true)}
        style={devStyles.button}
        testID="dev-connect-scan"
      >
        <Text style={devStyles.buttonText}>Scan code</Text>
      </Pressable>
      <TextInput
        autoCapitalize="none"
        autoCorrect={false}
        inputMode="url"
        onChangeText={setInput}
        onSubmitEditing={submit}
        placeholder="http://192.168.1.20:3000"
        style={devStyles.input}
        testID="dev-connect-url"
        value={input}
      />
      {error ? <Text style={devStyles.error}>{error}</Text> : null}
      <Pressable
        accessibilityRole="button"
        onPress={submit}
        style={devStyles.secondaryButton}
        testID="dev-connect-submit"
      >
        <Text style={devStyles.secondaryButtonText}>Connect</Text>
      </Pressable>
      {recent.length > 0 ? <Text style={devStyles.hint}>Recent servers</Text> : null}
      {recent.map((server) => (
        <Pressable
          accessibilityRole="button"
          key={server.url}
          onPress={() => onPick(server)}
          style={devStyles.row}
          testID={`dev-recent-${server.host}`}
        >
          <Text style={devStyles.rowText}>{server.host}</Text>
          <Text style={devStyles.hint}>{server.url}</Text>
        </Pressable>
      ))}
      <QrScanner
        onClose={() => setScanning(false)}
        onScanned={(text) => {
          setScanning(false);
          onScanned(text);
        }}
        visible={scanning}
      />
    </ScrollView>
  );
}

export default ConnectScreen;
