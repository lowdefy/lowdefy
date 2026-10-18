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

import React, { useState, useSyncExternalStore } from 'react';
import { Modal, Pressable, ScrollView, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import BlockGallery from './BlockGallery.js';
import devStyles from '../devStyles.js';

function MenuItem({ hint, label, onPress, testID }) {
  return (
    <Pressable accessibilityRole="button" onPress={onPress} style={devStyles.row} testID={testID}>
      <Text style={devStyles.rowText}>{label}</Text>
      {hint ? <Text style={devStyles.hint}>{hint}</Text> : null}
    </Pressable>
  );
}

function LogList({ logs }) {
  const entries = useSyncExternalStore(logs.subscribe, logs.entries);
  if (entries.length === 0) {
    return <Text style={devStyles.hint}>Nothing logged yet.</Text>;
  }
  return entries.map((entry, index) => (
    <Text key={index} style={devStyles.mono}>
      {`${entry.at.toISOString().slice(11, 19)} ${entry.level} ${entry.message}`}
    </Text>
  ));
}

/**
 * The shake menu: reload, switch server, clear data, the shell's logs, the block gallery and the
 * shell's version.
 *
 * @param {Object} props
 * @param {boolean} props.visible
 * @param {() => void} props.onClose
 * @param {() => void} props.onReload
 * @param {() => void} props.onSwitchServer
 * @param {() => void} props.onClearData
 * @param {Object} props.logs The log buffer (createLogBuffer).
 * @param {string|null} props.server The host of the server Lowdefy Dev is connected to.
 * @param {Object} props.shell The shell config: name and version.
 */
function DevMenu({ logs, onClearData, onClose, onReload, onSwitchServer, server, shell, visible }) {
  const insets = useSafeAreaInsets();
  const [panel, setPanel] = useState('menu');
  function close() {
    setPanel('menu');
    onClose();
  }
  function act(action) {
    close();
    action();
  }
  return (
    <Modal animationType="slide" onRequestClose={close} transparent visible={visible}>
      <View style={devStyles.backdrop}>
        <ScrollView
          contentContainerStyle={[devStyles.sheet, { paddingBottom: insets.bottom + 24 }]}
          style={{ maxHeight: '85%', flexGrow: 0 }}
          testID="dev-menu"
        >
          {panel === 'menu' ? (
            <>
              <Text style={devStyles.sheetTitle}>{shell.name}</Text>
              <Text style={devStyles.hint} testID="dev-menu-version">
                {`Shell ${shell.version}${server ? ` · ${server}` : ''}`}
              </Text>
              <MenuItem label="Reload" onPress={() => act(onReload)} testID="dev-menu-reload" />
              <MenuItem
                hint={server ?? undefined}
                label="Switch server"
                onPress={() => act(onSwitchServer)}
                testID="dev-menu-switch"
              />
              <MenuItem
                hint="Signs out and removes this server's cached pages and storage"
                label="Clear data"
                onPress={() => act(onClearData)}
                testID="dev-menu-clear"
              />
              <MenuItem label="Show logs" onPress={() => setPanel('logs')} testID="dev-menu-logs" />
              <MenuItem
                label="Block gallery"
                onPress={() => setPanel('gallery')}
                testID="dev-menu-gallery"
              />
            </>
          ) : null}
          {panel === 'logs' ? <LogList logs={logs} /> : null}
          {panel === 'gallery' ? <BlockGallery /> : null}
          <Pressable
            accessibilityRole="button"
            onPress={panel === 'menu' ? close : () => setPanel('menu')}
            style={devStyles.secondaryButton}
            testID="dev-menu-close"
          >
            <Text style={devStyles.secondaryButtonText}>{panel === 'menu' ? 'Close' : 'Back'}</Text>
          </Pressable>
        </ScrollView>
      </View>
    </Modal>
  );
}

export default DevMenu;
