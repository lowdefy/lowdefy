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

const shapeTags = new Set(['circle', 'ellipse', 'line', 'path', 'polygon', 'polyline', 'rect']);

// lucide-react applies vector-effect only to the top-level nodes it renders
// itself; icon data goes in as children, so shapes at every depth get it here.
function renderIconNodes({ node, nonScalingStroke }) {
  return node.map(([tag, attrs, children], index) => {
    const props =
      nonScalingStroke && shapeTags.has(tag)
        ? { vectorEffect: 'non-scaling-stroke', ...attrs, key: index }
        : { ...attrs, key: index };
    if (!children) {
      return React.createElement(tag, props);
    }
    return React.createElement(tag, props, renderIconNodes({ node: children, nonScalingStroke }));
  });
}

export default renderIconNodes;
