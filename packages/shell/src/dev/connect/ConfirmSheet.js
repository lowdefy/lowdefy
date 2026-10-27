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
import { Modal, Pressable, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import devStyles from '../devStyles.js';

/**
 * "Connect to <host>?", asked before Lowdefy Dev attaches to a server from a link, a scanned code
 * or a typed address: a link can come from anyone, and the server it names sends every page the
 * app shows.
 *
 * @param {Object} props
 * @param {{ url, host, pair }|null} props.server The server to ask about; null hides the sheet.
 * @param {() => void} props.onConfirm
 * @param {() => void} props.onCancel
 */
function ConfirmSheet({ onCancel, onConfirm, server }) {
  const insets = useSafeAreaInsets();
  return (
    <Modal animationType="slide" onRequestClose={onCancel} transparent visible={server !== null}>
      <View style={devStyles.backdrop}>
        <View
          style={[devStyles.sheet, { paddingBottom: insets.bottom + 24 }]}
          testID="dev-confirm-sheet"
        >
          <Text style={devStyles.sheetTitle}>{`Connect to ${server?.host}?`}</Text>
          <Text style={devStyles.hint}>{server?.url}</Text>
          <Text style={devStyles.hint}>
            {server?.pair
              ? 'Paired with lowdefy dev --lan. Connect only to a server you started.'
              : 'Connect only to a server you started.'}
          </Text>
          <Pressable
            accessibilityRole="button"
            onPress={onConfirm}
            style={devStyles.button}
            testID="dev-confirm-connect"
          >
            <Text style={devStyles.buttonText}>Connect</Text>
          </Pressable>
          <Pressable
            accessibilityRole="button"
            onPress={onCancel}
            style={devStyles.secondaryButton}
            testID="dev-confirm-cancel"
          >
            <Text style={devStyles.secondaryButtonText}>Cancel</Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}

export default ConfirmSheet;
