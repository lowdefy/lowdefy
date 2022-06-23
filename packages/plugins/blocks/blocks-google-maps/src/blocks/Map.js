/* eslint-disable react/jsx-props-no-spreading */
/*
  Copyright 2020-2022 Lowdefy, Inc

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
import { GoogleMap, Marker, InfoWindow } from '@react-google-maps/api';

const STYLE_DEFAULTS = {
  width: '100%',
  height: '300px',
};

const MAP_DEFAULTS = {
  zoom: 3,
  center: {
    lat: 0,
    lng: 0,
  },
};

// Implements https://react-google-maps-api-docs.netlify.app/#googlemap
const Map = ({ blockId, children, content, methods, properties }) => {
  const [map, setMap] = useState();
  const [bounds, setBounds] = useState();

  // by default, fit infoWindow and markers to bounds
  if (properties.autoBounds !== false && bounds && map) {
    if (properties.infoWindow) {
      bounds.extend(properties.infoWindow.position);
    }
    (properties.markers || []).map((marker) => {
      bounds.extend(marker.position);
    });
    map.fitBounds(bounds);
  }

  return (
    <GoogleMap
      {...properties.map} // https://react-google-maps-api-docs.netlify.app/#googlemap
      id={blockId}
      mapContainerClassName={methods.makeCssClass([STYLE_DEFAULTS, properties.style])}
      center={properties.map?.center || MAP_DEFAULTS.center}
      zoom={properties.map?.zoom || MAP_DEFAULTS.zoom}
      onLoad={(map) => {
        setMap(map);
        setBounds(new window.google.maps.LatLngBounds());
      }}
      onClick={(event) => {
        methods.triggerEvent({
          name: 'onClick',
          event,
        });
      }}
      onZoomChanged={(event) => {
        methods.triggerEvent({
          name: 'onClick',
          event,
        });
      }}
    >
      {(properties.markers || []).map((marker, i) => (
        <Marker
          {...marker} // https://react-google-maps-api-docs.netlify.app/#marker
          key={i}
          onClick={(event) => {
            methods.triggerEvent({
              name: 'onMarkerClick',
              event,
            });
          }}
        />
      ))}
      {properties.infoWindow && content.infoWindow && (
        <InfoWindow
          {...properties.infoWindow} // https://react-google-maps-api-docs.netlify.app/#infowindow
          onCloseClick={() => {
            methods.triggerEvent({
              name: 'onInfoWindowCloseClick',
            });
          }}
          onPositionChanged={() => {
            methods.triggerEvent({
              name: 'onInfoWindowPositionChanged',
            });
          }}
        >
          {content.infoWindow()}
        </InfoWindow>
      )}
      {children(map, bounds)}
    </GoogleMap>
  );
};

export default Map;
