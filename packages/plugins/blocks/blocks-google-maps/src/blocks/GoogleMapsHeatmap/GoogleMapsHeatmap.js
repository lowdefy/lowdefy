/* eslint-disable react/jsx-props-no-spreading */
/*
  Copyright 2020-2024 Lowdefy, Inc

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
import { blockDefaultProps } from '@lowdefy/block-utils';
import { HeatmapLayer } from '@react-google-maps/api';
import Map from '../Map.js';

function updateHeatmap(data) {
  if (data.location) {
    const latLng = new window.google.maps.LatLng(data.location);
    latLng.weight = data.weight ?? 1;
    return latLng;
  }
  return new window.google.maps.LatLng(data);
}

const GoogleMapsHeatmap = ({ blockId, content, methods, properties }) => (
  <Map blockId={blockId} content={content} methods={methods} properties={properties}>
    {(map, bounds) =>
      map &&
      bounds &&
      properties.heatmap && (
        <HeatmapLayer
          {...properties.heatmap} // https://react-google-maps-api-docs.netlify.app/#heatmaplayer
          data={
            properties.heatmap?.data &&
            window.google &&
            (properties.heatmap?.data || []).map((item) => updateHeatmap(item))
          }
          onLoad={() => {
            if (properties.autoBounds !== false && bounds && map) {
              (properties.heatmap?.data || []).forEach((item) => {
                bounds.extend(item);
              });
              map.fitBounds(bounds);
            }
          }}
        />
      )
    }
  </Map>
);

GoogleMapsHeatmap.defaultProps = blockDefaultProps;
GoogleMapsHeatmap.meta = {
  category: 'container',
  icons: [],
  styles: [],
};

export default GoogleMapsHeatmap;
