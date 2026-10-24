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
import { Platform } from 'react-native';
import { AppleMaps, GoogleMaps } from 'expo-maps';

const APPLE_MAP_TYPES = { standard: 'STANDARD', satellite: 'IMAGERY', hybrid: 'HYBRID' };
const GOOGLE_MAP_TYPES = { standard: 'NORMAL', satellite: 'SATELLITE', hybrid: 'HYBRID' };

function toCoordinates({ latitude, longitude }) {
  return { latitude, longitude };
}

/**
 * The map the Map block draws (profile field): Apple Maps on iOS, Google Maps on Android
 * (expo-maps), from the block's markers, lines and camera. Taps and camera moves come back in the
 * block's terms.
 */
function MapView({
  center,
  mapType,
  markerColor,
  markers,
  onMapClick,
  onMarkerClick,
  onRegionChange,
  polylines,
  showsUserLocation,
  style,
  zoom,
}) {
  const cameraPosition = center === null ? undefined : { coordinates: toCoordinates(center), zoom };
  const mapMarkers = markers.map((marker, index) => ({
    id: marker.id ?? String(index),
    coordinates: toCoordinates(marker),
    title: marker.title,
    snippet: marker.description,
    tintColor: marker.color ?? markerColor,
  }));
  const lines = polylines.map((line, index) => ({
    id: line.id ?? String(index),
    coordinates: line.coordinates.map(toCoordinates),
    color: line.color ?? markerColor,
    width: line.width ?? 4,
  }));
  const events = {
    onMapClick: ({ coordinates }) => onMapClick(coordinates),
    onMarkerClick: (clicked) => {
      const index = mapMarkers.findIndex((marker) => marker.id === clicked.id);
      onMarkerClick(markers[index] ?? clicked);
    },
    onCameraMove: ({ coordinates, zoom: nextZoom }) =>
      onRegionChange({ center: coordinates, zoom: nextZoom }),
  };
  if (Platform.OS === 'ios') {
    return (
      <AppleMaps.View
        cameraPosition={cameraPosition}
        markers={mapMarkers}
        polylines={lines}
        properties={{ isMyLocationEnabled: showsUserLocation, mapType: APPLE_MAP_TYPES[mapType] }}
        style={style}
        {...events}
      />
    );
  }
  return (
    <GoogleMaps.View
      cameraPosition={cameraPosition}
      markers={mapMarkers}
      polylines={lines}
      properties={{ isMyLocationEnabled: showsUserLocation, mapType: GOOGLE_MAP_TYPES[mapType] }}
      style={style}
      {...events}
    />
  );
}

export default MapView;
