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

import convertAttributes from './convertAttributes.js';

// react-icons' IconBase renders every svg with these before applying the icon's own attributes.
const iconBaseAttributes = { stroke: 'currentColor', fill: 'currentColor', strokeWidth: '0' };

// lucide-react's Icon already renders these on the root svg; repeating them in attrs changes
// nothing, so they are left out to keep 50k icons of data small.
const lucideRootDefaults = {
  fill: 'none',
  stroke: 'currentColor',
  strokeLinecap: 'round',
  strokeLinejoin: 'round',
};

// Root attributes that describe the SVG document or its accessibility rather than how the icon
// paints. The renderer sets size, viewBox and aria attributes itself, and a root id would repeat
// on every rendered copy of the icon.
const documentAttributes = new Set([
  'aria-hidden',
  'baseProfile',
  'className',
  'enableBackground',
  'height',
  'id',
  'role',
  'style',
  't',
  'version',
  'viewBox',
  'width',
  'x',
  'xmlSpace',
  'xmlns',
  'xmlnsXlink',
  'y',
]);

function convertNodes(children) {
  return (children ?? []).map((child) => {
    const node = [child.tag, convertAttributes({ attributes: child.attr })];
    if ((child.child ?? []).length > 0) {
      node.push(convertNodes(child.child));
    }
    return node;
  });
}

function convertRootAttributes(rootAttributes) {
  const attrs = {};
  Object.entries(rootAttributes).forEach(([name, value]) => {
    if (documentAttributes.has(name) || name === 'strokeWidth') return;
    attrs[name] = value;
  });
  // Stroke width is an app setting, so it cannot stay in the data. A zero stroke width is the
  // only value that changes how a filled icon renders, and stroke: none renders it identically.
  if (parseFloat(rootAttributes.strokeWidth) === 0) {
    attrs.stroke = 'none';
  }
  Object.entries(lucideRootDefaults).forEach(([name, value]) => {
    if (attrs[name] === value) delete attrs[name];
  });
  return attrs;
}

function convertGenIcon({ tree, defaultViewBox }) {
  const rootAttributes = convertAttributes({
    attributes: { ...iconBaseAttributes, ...tree.attr },
  });
  const [minX, minY, width, height] = (rootAttributes.viewBox ?? defaultViewBox)
    .trim()
    .split(/[\s,]+/)
    .map(Number);

  let node = convertNodes(tree.child);
  if (minX !== 0 || minY !== 0) {
    node = [['g', { transform: `translate(${-minX} ${-minY})` }, node]];
  }

  const iconData = { node };
  if (width !== height) {
    iconData.width = width;
    iconData.height = height;
  } else if (width !== 24) {
    iconData.size = width;
  }

  const attrs = convertRootAttributes(rootAttributes);
  if (Object.keys(attrs).length > 0) {
    iconData.attrs = attrs;
  }
  return iconData;
}

export default convertGenIcon;
