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
import { Text, View } from 'react-native';

import createScanFilter from './createScanFilter.js';
import getDeviceFeature, { hasDeviceFeature } from '../../device/getDeviceFeature.js';
import meta from './meta.js';
import MissingFeature from '../../shared/MissingFeature.js';
import playFeedback from '../../device/playFeedback.js';

// A live camera that reads QR codes and barcodes (expo-camera's scanner, which the shell installs
// as the camera feature's ScannerView). Each kept read fires onScan; `reset` starts a single-scan
// scanner again.
function QRScanner({ blockId, methods, properties, styles = {} }) {
  const height = properties.height ?? 300;
  const continuous = properties.continuous === true;
  const [filter, setFilter] = useState(() => createScanFilter({ continuous }));
  useEffect(() => {
    setFilter(() => createScanFilter({ continuous }));
    methods.registerMethod('reset', () => setFilter(() => createScanFilter({ continuous })));
  }, [continuous, methods]);
  if (!hasDeviceFeature('camera')) {
    return (
      <MissingFeature
        blockId={blockId}
        feature="camera"
        height={height}
        style={styles.element}
        title="The scanner"
      />
    );
  }
  const { ScannerView } = getDeviceFeature({ feature: 'camera', action: 'QRScanner' });
  return (
    <View
      style={[{ borderRadius: 12, height, overflow: 'hidden' }, styles.element]}
      testID={blockId}
    >
      <ScannerView
        onScan={(read) => {
          if (!filter(read)) return;
          playFeedback('success');
          methods.triggerEvent({ name: 'onScan', event: read });
        }}
        style={{ flex: 1 }}
        torch={properties.torch === true}
        types={properties.types}
      />
      {properties.prompt ? (
        <Text
          pointerEvents="none"
          style={{
            bottom: 16,
            color: '#FFFFFF',
            left: 16,
            position: 'absolute',
            right: 16,
            textAlign: 'center',
            textShadowColor: 'rgba(0,0,0,0.6)',
            textShadowRadius: 4,
          }}
        >
          {properties.prompt}
        </Text>
      ) : null}
    </View>
  );
}

QRScanner.meta = meta;

export default QRScanner;
