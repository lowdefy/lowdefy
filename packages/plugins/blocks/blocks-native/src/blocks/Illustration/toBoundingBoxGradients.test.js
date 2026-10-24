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

import parseIllustration from './parseIllustration.js';
import toBoundingBoxGradients from './toBoundingBoxGradients.js';

function convert(svg) {
  const { definitions, nodes } = parseIllustration({ svg });
  return toBoundingBoxGradients({ definitions, nodes });
}

const FADE =
  '<defs><linearGradient id="fade" gradientUnits="userSpaceOnUse" x1="0" y1="60" x2="0" y2="120"><stop offset="0" stop-color="#ECE6D9"/><stop offset="1" stop-color="#ECE6D9" stop-opacity="0"/></linearGradient></defs>';

test('toBoundingBoxGradients redraws a user-space fade in each element bounding box', () => {
  const { definitions, nodes } = convert(
    `<svg viewBox="0 0 240 126">${FADE}<path fill="url(#fade)" d="M0 40h100v80h-100z"/><rect fill="url(#fade)" x="10" y="90" width="20" height="30"/></svg>`
  );
  const [path, rect] = nodes;
  expect(path.props.fill).toBe('url(#fade-box-0)');
  expect(rect.props.fill).toBe('url(#fade-box-1)');
  const copies = definitions.at(-1);
  expect(copies.tag).toBe('defs');
  const [forPath, forRect] = copies.children;
  // The path spans y 40 to 120: the fade runs from a quarter of the way down to the bottom.
  expect(forPath.props).toMatchObject({
    gradientUnits: 'objectBoundingBox',
    id: 'fade-box-0',
    x1: 0,
    x2: 0,
    y1: 0.25,
    y2: 1,
  });
  // The rect spans y 90 to 120: the fade starts 30 units above it and ends at its bottom.
  expect(forRect.props).toMatchObject({ y1: -1, y2: 1 });
  expect(forRect.children.map((stop) => stop.props.stopOpacity)).toEqual([undefined, 0]);
});

test('toBoundingBoxGradients converts a fill a shape inherits from its group, once per box', () => {
  const { definitions, nodes } = convert(
    `<svg viewBox="0 0 240 126">${FADE}<g fill="url(#fade)"><path d="M0 0h10v120h-10z"/><path d="M20 0h10v120h-10z"/><path d="M40 0h10v120h-10z" fill="#000"/></g></svg>`
  );
  const [group] = nodes;
  expect(group.children.map((child) => child.props.fill)).toEqual([
    'url(#fade-box-0)',
    'url(#fade-box-1)',
    '#000',
  ]);
  expect(definitions.at(-1).children).toHaveLength(2);
});

test('toBoundingBoxGradients leaves curves, slanted fades and bounding-box gradients alone', () => {
  const svg = `<svg viewBox="0 0 240 126"><defs><linearGradient id="slant" gradientUnits="userSpaceOnUse" x1="0" y1="0" x2="10" y2="10"><stop offset="0" stop-color="#000"/></linearGradient><linearGradient id="box" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#000"/></linearGradient></defs>${FADE}<path fill="url(#fade)" d="M0 0c10 0 10 10 0 10z"/><rect fill="url(#slant)" width="10" height="10"/><rect fill="url(#box)" width="10" height="10"/></svg>`;
  const { definitions, nodes } = convert(svg);
  expect(nodes.map((node) => node.props.fill)).toEqual(['url(#fade)', 'url(#slant)', 'url(#box)']);
  expect(definitions).toHaveLength(2);
});
