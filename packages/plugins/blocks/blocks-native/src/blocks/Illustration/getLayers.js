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

function isTarget({ node, targets }) {
  return typeof node !== 'string' && targets.has(node.props.id);
}

function holdsTarget({ node, targets }) {
  if (typeof node === 'string' || node.tag !== 'g') {
    return false;
  }
  return node.children.some(
    (child) => isTarget({ node: child, targets }) || holdsTarget({ node: child, targets })
  );
}

/**
 * Splits a drawing into the layers it is drawn as, in paint order, so each animated element is
 * a view of its own that the native driver moves: React Native's native driver animates a view's
 * transform and opacity, not an SVG element's attributes.
 *
 * - A drawn layer, `{ ancestors, nodes }`: neighbouring elements with no animated element among
 *   them, drawn in one SVG inside their ancestor groups (whose transforms, fills and strokes
 *   they keep).
 * - An animated layer, `{ target, layers }`: the element whose id an animation targets, drawn in
 *   its own view, its own layers inside it. A group holding animated elements is split around
 *   them, so an animated element inside an animated group moves with the group.
 *
 * Only groups (`g`) are looked into for animated elements.
 *
 * @param {Object} params
 * @param {Array} params.nodes Parsed nodes, in paint order.
 * @param {Set<string>} params.targets The element ids animations target.
 * @param {Object[]} [params.ancestors] The groups the nodes sit in.
 * @returns {Object[]} The layers.
 */
function getLayers({ ancestors = [], nodes, targets }) {
  const layers = [];
  let fragment = [];
  function flush() {
    if (fragment.length > 0) {
      layers.push({ ancestors, nodes: fragment });
      fragment = [];
    }
  }
  nodes.forEach((node) => {
    if (typeof node === 'string') {
      return;
    }
    if (isTarget({ node, targets })) {
      flush();
      layers.push({
        target: node.props.id,
        layers: holdsTarget({ node, targets })
          ? getLayers({ ancestors: [...ancestors, node], nodes: node.children, targets })
          : [{ ancestors, nodes: [node] }],
      });
      return;
    }
    if (holdsTarget({ node, targets })) {
      flush();
      layers.push(...getLayers({ ancestors: [...ancestors, node], nodes: node.children, targets }));
      return;
    }
    fragment.push(node);
  });
  flush();
  return layers;
}

export default getLayers;
