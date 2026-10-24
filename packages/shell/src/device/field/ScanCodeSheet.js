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

import React, { useEffect, useState } from 'react';
import { Modal, Pressable, Text, View } from 'react-native';

import ScannerView from './ScannerView.js';
import scanRequests from './scanRequests.js';

// The full-screen camera the ScanCode action opens: the first code read answers it; Cancel answers
// null. Mounted once at the root (DeviceHosts).
function ScanCodeSheet() {
  const [request, setRequest] = useState(scanRequests.get());
  const [torch, setTorch] = useState(false);
  useEffect(() => scanRequests.subscribe(setRequest), []);
  useEffect(() => setTorch(request?.params.torch === true), [request]);
  if (request === null) {
    return null;
  }
  return (
    <Modal
      animationType="slide"
      onRequestClose={() => scanRequests.finish(null)}
      presentationStyle="fullScreen"
      visible
    >
      <View style={{ backgroundColor: '#000000', flex: 1 }}>
        <ScannerView
          onScan={(read) => scanRequests.finish(read)}
          style={{ flex: 1 }}
          torch={torch}
          types={request.params.types}
        />
        {request.params.prompt ? (
          <Text
            style={{
              color: '#FFFFFF',
              fontSize: 17,
              left: 24,
              position: 'absolute',
              right: 24,
              textAlign: 'center',
              top: 80,
            }}
          >
            {request.params.prompt}
          </Text>
        ) : null}
        <View
          style={{
            bottom: 48,
            flexDirection: 'row',
            justifyContent: 'space-between',
            left: 24,
            position: 'absolute',
            right: 24,
          }}
        >
          <Pressable accessibilityRole="button" onPress={() => scanRequests.finish(null)}>
            <Text style={{ color: '#FFFFFF', fontSize: 17 }}>Cancel</Text>
          </Pressable>
          <Pressable accessibilityRole="button" onPress={() => setTorch((on) => !on)}>
            <Text style={{ color: '#FFFFFF', fontSize: 17 }}>
              {torch ? 'Torch off' : 'Torch on'}
            </Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}

export default ScanCodeSheet;
