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

import React, { useEffect, useState, useRef } from 'react';
import { Wrapper, Status } from '@googlemaps/react-wrapper';
import { blockDefaultProps } from '@lowdefy/block-utils';

// see which libraries to load at https://developers.google.com/maps/documentation/javascript/libraries
// properties.map{} is an interface of MapOptions: https://developers.google.com/maps/documentation/javascript/reference/map#MapOptions
// properties.heatmap{} is an interface of HeatmapLayerOptions: https://developers.google.com/maps/documentation/javascript/reference/visualization#HeatmapLayerOptions
// properties.markers[] is an interface of MarkerOptions: https://developers.google.com/maps/documentation/javascript/reference/marker#MarkerOptions

const MAP_DEFAULTS = {
  zoom: 2,
  center: {
    lat: 0,
    lng: 0,
  },
};

const render = (status) => {
  // TODO: not sure how to implement status for now.
  //   switch (status) {
  // case Status.LOADING:
  //   return <Spinner />;
  // case Status.FAILURE:
  //   return <ErrorComponent />;
  // case Status.SUCCESS:
  //   return <GoogleMaps />;
  return null;
};

const Marker = (options) => {
  const [marker, setMarker] = React.useState();

  React.useEffect(() => {
    if (!marker) {
      setMarker(new window.google.maps.Marker());
    }
    return () => {
      if (marker) {
        marker.setMap(null);
      }
    };
  }, [marker]);
  React.useEffect(() => {
    if (marker) {
      marker.setOptions(options);
    }
  }, [marker, options]);
  return null;
};

function updateHeatmap(data) {
  if (data.location) {
    const latLng = new window.google.maps.LatLng(data.location);
    latLng.weight = data.weight || 1;
    return latLng;
  }
  return new window.google.maps.LatLng(data);
}
const Map = ({ blockId, properties, methods }) => {
  const [map, setMap] = useState();
  const [heatmap, setHeatmap] = useState();
  const ref = useRef();
  const triggerOnClick = (event) => {
    methods.triggerEvent({
      name: 'onClick',
      event,
    });
  };

  useEffect(() => {
    if (ref.current) {
      if (!map) {
        const newMap = new window.google.maps.Map(ref.current, {
          ...MAP_DEFAULTS,
          ...properties.map,
        });
        setMap(newMap);
        if (properties.heatmap) {
          const newHeatmap = new window.google.maps.visualization.HeatmapLayer({
            ...properties.heatmap,
            data: properties.heatmap.data?.map(updateHeatmap),
            map: newMap,
          });
          setHeatmap(newHeatmap);
        }
      } else {
        map.setOptions({ ...MAP_DEFAULTS, ...properties.map });
        if (heatmap) {
          heatmap.setOptions({
            ...properties.heatmap,
            data: properties.heatmap.data?.map(updateHeatmap),
            map,
          });
        }
      }
    }
  });
  useEffect(() => {
    if (map) {
      ['click'].forEach((eventName) => window.google.maps.event.clearListeners(map, eventName));
      if (triggerOnClick) {
        map.addListener('click', triggerOnClick);
      }
    }
  }, [map, triggerOnClick]);

  return (
    <div
      className={methods.makeCssClass([{ height: 300 }, properties.style])}
      id={blockId}
      ref={ref}
    />
  );
};

const GoogleMaps = ({ blockId, events, methods, properties, loading }) => {
  const libraries = new Set(properties.libraries || []);
  if (properties.heatmap) {
    libraries.add('visualization');
  }
  return (
    <Wrapper apiKey={properties.apiKey} render={render} libraries={[...libraries]}>
      <Map blockId={blockId} properties={properties} methods={methods}>
        {(properties.markers || []).map((markerOptions, i) => (
          <Marker key={i} {...markerOptions} />
        ))}
        <Marker />
      </Map>
    </Wrapper>
  );
};

GoogleMaps.defaultProps = blockDefaultProps;
GoogleMaps.meta = {
  category: 'display',
  icons: [],
  styles: [],
};

export default GoogleMaps;
