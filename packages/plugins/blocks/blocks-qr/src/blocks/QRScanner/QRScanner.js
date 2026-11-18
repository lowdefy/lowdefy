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
import { createScanFilter, withBlockDefaults } from '@lowdefy/block-utils';
import { type } from '@lowdefy/helpers';

import createScanner from './createScanner.js';
import toBoxSize from './toBoxSize.js';

function getScannerProperties(properties) {
  return {
    aspectRatio: properties.aspectRatio ?? 1,
    deviceId: properties.deviceId,
    facingMode: properties.facingMode ?? 'environment',
    fps: properties.fps ?? 10,
    qrbox: properties.qrbox,
    torch: properties.torch === true,
    types: properties.types,
  };
}

// A live camera that reads QR codes and barcodes with the browser's BarcodeDetector, or the zxing
// ponyfill where the browser has none (createDetector). Each kept read (createScanFilter, shared
// with the native QRScanner) sets the value and fires onScan with { data, type }.
function QRScanner({ blockId, classNames, methods, properties, styles }) {
  const videoRef = useRef(null);
  const filterRef = useRef(null);
  const propertiesRef = useRef(properties);
  propertiesRef.current = properties;
  const [playing, setPlaying] = useState(false);
  const [error, setError] = useState(null);
  const continuous = properties.continuous === true;

  useEffect(() => {
    filterRef.current = createScanFilter({ continuous });
    const scanner = createScanner({
      getProperties: () => getScannerProperties(propertiesRef.current),
      getVideo: () => videoRef.current,
      onError: (cameraError) => {
        setError(cameraError);
        methods.triggerEvent({ name: 'onError', event: { error: cameraError } });
      },
      onPlaying: setPlaying,
      onRead: (read) => {
        if (!filterRef.current(read)) {
          return;
        }
        methods.setValue(read);
        methods.triggerEvent({ name: 'onScan', event: read });
      },
    });
    // A start after a stop is a new scan, so a single-scan scanner that stopped itself in its
    // onScan reads again without also calling reset.
    methods.registerMethod('start', () => {
      setError(null);
      filterRef.current = createScanFilter({ continuous });
      return scanner.start();
    });
    methods.registerMethod('stop', () => scanner.stop());
    methods.registerMethod('reset', () => {
      filterRef.current = createScanFilter({ continuous });
    });
    if (!propertiesRef.current.inactiveByDefault) {
      scanner.start();
    }
    return () => scanner.stop();
  }, [continuous, methods]);

  const box =
    playing && !type.isNone(properties.qrbox) ? toBoxSize({ qrbox: properties.qrbox }) : null;
  // The video is centred in the element, and the box in the video, so the box sits over the area
  // getCropRegion reads (the centre of the frame) whatever the element's height: a taller element
  // leaves space above and below the video, a shorter one crops the video evenly at both ends.
  return (
    <div
      id={blockId}
      className={classNames?.element}
      style={{
        position: 'relative',
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        height: properties.height,
        ...styles?.element,
      }}
    >
      <div style={{ position: 'relative', flexShrink: 0 }}>
        <video
          ref={videoRef}
          autoPlay
          muted
          playsInline
          style={{ display: playing ? 'block' : 'none', width: '100%' }}
        />
        {box ? (
          <div
            style={{
              position: 'absolute',
              top: '50%',
              left: '50%',
              width: box.width,
              height: box.height,
              maxWidth: '100%',
              maxHeight: '100%',
              transform: 'translate(-50%, -50%)',
              border: '2px solid rgba(255, 255, 255, 0.9)',
              borderRadius: 8,
              boxShadow: '0 0 0 100vmax rgba(0, 0, 0, 0.45)',
              pointerEvents: 'none',
            }}
          />
        ) : null}
      </div>
      {playing && properties.prompt ? (
        <div
          style={{
            position: 'absolute',
            bottom: 16,
            left: 16,
            right: 16,
            color: '#ffffff',
            textAlign: 'center',
            textShadow: '0 0 4px rgba(0, 0, 0, 0.6)',
            pointerEvents: 'none',
          }}
        >
          {properties.prompt}
        </div>
      ) : null}
      {error ? (
        <div role="alert" style={{ padding: 16, textAlign: 'center' }}>
          {error.message}
        </div>
      ) : null}
    </div>
  );
}

export default withBlockDefaults(QRScanner);
