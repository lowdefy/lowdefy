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

// The SVG elements icon sets draw with, as react-native-svg components. Icon data uses React's
// attribute names (strokeWidth, fillRule), which react-native-svg takes as they are.
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

// An icon's IconData node ([tag, attrs, children?] entries) as react-native-svg elements. A tag
// with no native form (a title, a style sheet) is left out, as it draws nothing.
function renderIconNodes(node) {
  return node.map(([tag, attrs, children], index) => {
    const Component = components[tag];
    if (Component === undefined) {
      return null;
    }
    const props = { ...attrs, key: index };
    if (!children) {
      return React.createElement(Component, props);
    }
    return React.createElement(Component, props, renderIconNodes(children));
  });
}

export default renderIconNodes;
