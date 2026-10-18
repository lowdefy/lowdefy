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

import React, { useRef } from 'react';
import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import devStyles from '../devStyles.js';

const styles = StyleSheet.create({
  camera: { flex: 1 },
  footer: { padding: 24, gap: 12, backgroundColor: '#ffffff' },
});

/**
 * Scans the QR code `lowdefy dev --lan` prints, with expo-camera. onScanned gets the code's text
 * once; the caller reads it as a link.
 *
 * @param {Object} props
 * @param {boolean} props.visible
 * @param {(text: string) => void} props.onScanned
 * @param {() => void} props.onClose
 */
function QrScanner({ onClose, onScanned, visible }) {
  const [permission, requestPermission] = useCameraPermissions();
  const scanned = useRef(false);
  const insets = useSafeAreaInsets();
  if (!visible) {
    scanned.current = false;
  }
  const granted = permission?.granted === true;
  return (
    <Modal animationType="slide" onRequestClose={onClose} visible={visible}>
      <View style={{ flex: 1, paddingTop: insets.top }} testID="dev-qr-scanner">
        {granted ? (
          <CameraView
            barcodeScannerSettings={{ barcodeTypes: ['qr'] }}
            onBarcodeScanned={({ data }) => {
              if (scanned.current) return;
              scanned.current = true;
              onScanned(data);
            }}
            style={styles.camera}
          />
        ) : (
          <View style={devStyles.screen}>
            <Text style={devStyles.hint}>
              Lowdefy Dev uses the camera only to read the code lowdefy dev prints.
            </Text>
            <Pressable
              accessibilityRole="button"
              onPress={requestPermission}
              style={devStyles.button}
              testID="dev-qr-allow"
            >
              <Text style={devStyles.buttonText}>Allow the camera</Text>
            </Pressable>
          </View>
        )}
        <View style={[styles.footer, { paddingBottom: insets.bottom + 24 }]}>
          <Pressable
            accessibilityRole="button"
            onPress={onClose}
            style={devStyles.secondaryButton}
            testID="dev-qr-close"
          >
            <Text style={devStyles.secondaryButtonText}>Close</Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}

export default QrScanner;
