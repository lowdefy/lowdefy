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

const elements = {
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

// Draws icon node data (`[tag, attrs, children?]`, as the build loads it for the web's lucide
// renderer) with react-native-svg elements. SVG attribute names become React Native props
// (`stroke-width` to `strokeWidth`); a tag react-native-svg has no element for, such as `title`,
// is left out.
function renderIconNodes({ node, nonScalingStroke }) {
  return node
    .filter(([tag]) => Object.hasOwn(elements, tag))
    .map(([tag, attrs, children], index) => {
      const props = toProps({ attrs, index, nonScalingStroke, tag });
      if (!children) {
        return React.createElement(elements[tag], props);
      }
      return React.createElement(
        elements[tag],
        props,
        renderIconNodes({ node: children, nonScalingStroke })
      );
    });
}

export default renderIconNodes;
