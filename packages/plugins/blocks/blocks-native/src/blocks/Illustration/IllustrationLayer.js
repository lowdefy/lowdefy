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

import React, { useMemo } from 'react';
import { Animated, StyleSheet } from 'react-native';
import Svg from 'react-native-svg';

import getLayerBounds from './getLayerBounds.js';

function renderNode(node, index) {
  if (typeof node === 'string') {
    return node;
  }
  const { Tag } = node;
  return (
    <Tag key={index} {...node.props}>
      {node.children.map(renderNode)}
    </Tag>
  );
}

// The ancestor groups keep their attributes but not their ids, which every layer split from
// them would otherwise repeat.
function wrapInAncestors({ ancestors, content }) {
  return ancestors.reduceRight((children, ancestor) => {
    const { id, ...props } = ancestor.props;
    const { Tag } = ancestor;
    return <Tag {...props}>{children}</Tag>;
  }, content);
}

// A drawn layer's SVG, over the part of the drawing its elements draw in (getLayerBounds), or the
// whole drawing.
function DrawnLayer({ definitions, drawing, layer, viewBox }) {
  const viewBoxKey = viewBox.join(' ');
  const bounds = useMemo(
    () => getLayerBounds({ layer, viewBox }) ?? viewBox,
    // viewBox is read when its key changes.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [layer, viewBoxKey]
  );
  const scale = drawing.width / viewBox[2];
  const [x, y, width, height] = bounds;
  return (
    <Svg
      height={height * scale}
      style={{
        left: (x - viewBox[0]) * scale,
        position: 'absolute',
        top: (y - viewBox[1]) * scale,
      }}
      viewBox={bounds.join(' ')}
      width={width * scale}
    >
      {definitions.map(renderNode)}
      {wrapInAncestors({ ancestors: layer.ancestors, content: layer.nodes.map(renderNode) })}
    </Svg>
  );
}

/**
 * One layer of an Illustration (getLayers), filling the drawing's place in the box: a drawn layer
 * is an SVG holding its elements in their ancestor groups, with the drawing's definitions, over
 * only the part of the drawing they draw in; an animated layer is an Animated.View with its
 * target's style, holding its own layers.
 *
 * @param {Object} props
 * @param {string} props.blockId The block id, for an animated layer's testID.
 * @param {Object[]} props.definitions The drawing's definition nodes, coloured.
 * @param {Object} props.drawing The drawing's `{ width, height }` in points.
 * @param {Object} props.layer The layer.
 * @param {Object} props.motion A view style per target id (useIllustrationMotion).
 * @param {number[]} props.viewBox The drawing's viewBox.
 */
function IllustrationLayer({ blockId, definitions, drawing, layer, motion, viewBox }) {
  if (layer.target !== undefined) {
    return (
      <Animated.View
        style={[StyleSheet.absoluteFill, motion[layer.target]]}
        testID={`${blockId}_${layer.target}`}
      >
        {layer.layers.map((child, index) => (
          <IllustrationLayer
            blockId={blockId}
            definitions={definitions}
            drawing={drawing}
            key={index}
            layer={child}
            motion={motion}
            viewBox={viewBox}
          />
        ))}
      </Animated.View>
    );
  }
  return <DrawnLayer definitions={definitions} drawing={drawing} layer={layer} viewBox={viewBox} />;
}

export default IllustrationLayer;
