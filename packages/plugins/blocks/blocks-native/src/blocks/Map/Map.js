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
import { View } from 'react-native';
import { useTheme } from '@lowdefy/client-native';

import getDeviceFeature, { hasDeviceFeature } from '../../device/getDeviceFeature.js';
import meta from './meta.js';
import MissingFeature from '../../shared/MissingFeature.js';

// A native map: the shell's maps feature draws it (expo-maps: Apple Maps on iOS, Google Maps on
// Android) from the block's markers, lines and camera, and reports taps and moves as events.
function Map({ blockId, methods, properties, styles = {} }) {
  const { tokens } = useTheme();
  const height = properties.height ?? 300;
  if (!hasDeviceFeature('maps')) {
    return (
      <MissingFeature
        blockId={blockId}
        feature="maps"
        height={height}
        style={styles.element}
        title="The map"
      />
    );
  }
  const { MapView } = getDeviceFeature({ feature: 'maps', action: 'Map' });
  const markers = properties.markers ?? [];
  return (
    <View
      style={[{ borderRadius: 12, height, overflow: 'hidden' }, styles.element]}
      testID={blockId}
    >
      <MapView
        center={properties.center ?? markers[0] ?? null}
        mapType={properties.mapType ?? 'standard'}
        markerColor={tokens.colorTint}
        markers={markers}
        onMapClick={(event) => methods.triggerEvent({ name: 'onMapClick', event })}
        onMarkerClick={(marker) =>
          methods.triggerEvent({ name: 'onMarkerClick', event: { marker } })
        }
        onRegionChange={(event) => methods.triggerEvent({ name: 'onRegionChange', event })}
        polylines={properties.polylines ?? []}
        showsUserLocation={properties.showsUserLocation === true}
        style={{ flex: 1 }}
        zoom={properties.zoom ?? 12}
      />
    </View>
  );
}

Map.meta = meta;

export default Map;
