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
import {
  Circle,
  ClipPath,
  Defs,
  Ellipse,
  G,
  Line,
  LinearGradient,
  Mask,
  Path,
  Polygon,
  Polyline,
  RadialGradient,
  Rect,
  Stop,
} from 'react-native-svg';

// The SVG elements icon sets draw with, as react-native-svg components.
const components = {
  circle: Circle,
  clipPath: ClipPath,
  defs: Defs,
  ellipse: Ellipse,
  g: G,
  line: Line,
  linearGradient: LinearGradient,
  mask: Mask,
  path: Path,
  polygon: Polygon,
  polyline: Polyline,
  radialGradient: RadialGradient,
  rect: Rect,
  stop: Stop,
};

const shapeTags = new Set(['circle', 'ellipse', 'line', 'path', 'polygon', 'polyline', 'rect']);
const droppedAttrs = new Set(['class', 'className', 'key', 'style']);

function toPropName(name) {
  return name.replace(/-([a-z])/g, (match, letter) => letter.toUpperCase());
}

function toProps({ attrs, index, nonScalingStroke, tag }) {
  const props = { key: index };
  if (nonScalingStroke && shapeTags.has(tag)) {
    props.vectorEffect = 'non-scaling-stroke';
  }
  Object.entries(attrs ?? {}).forEach(([name, value]) => {
    if (droppedAttrs.has(name)) return;
    props[toPropName(name)] = value;
  });
  return props;
}

// An icon's IconData node ([tag, attrs, children?] entries) as react-native-svg elements. SVG
// attribute names become React Native props (`stroke-width` to `strokeWidth`; React names such
// as `fillRule` stay as they are). A tag with no native form (a title, a style sheet) is left
// out, as it draws nothing.
function renderIconNodes({ node, nonScalingStroke = false }) {
  return node
    .filter(([tag]) => Object.hasOwn(components, tag))
    .map(([tag, attrs, children], index) => {
      const props = toProps({ attrs, index, nonScalingStroke, tag });
      if (!children) {
        return React.createElement(components[tag], props);
      }
      return React.createElement(
        components[tag],
        props,
        renderIconNodes({ node: children, nonScalingStroke })
      );
    });
}

export default renderIconNodes;
