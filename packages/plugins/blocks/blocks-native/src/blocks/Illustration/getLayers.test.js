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

import getLayers from './getLayers.js';

function node(tag, props = {}, children = []) {
  return { children, props, tag, Tag: tag };
}

function describe(layers) {
  return layers.map((layer) => {
    if (layer.target !== undefined) {
      return { target: layer.target, layers: describe(layer.layers) };
    }
    return {
      ancestors: layer.ancestors.map((ancestor) => ancestor.props.id ?? ancestor.tag),
      nodes: layer.nodes.map((item) => item.props.id),
    };
  });
}

test('getLayers draws a drawing with no animations as one layer', () => {
  const nodes = [node('rect', { id: 'a' }), node('g', { id: 'b' }, [node('path', { id: 'c' })])];
  expect(describe(getLayers({ nodes, targets: new Set() }))).toEqual([
    { ancestors: [], nodes: ['a', 'b'] },
  ]);
});

test('getLayers gives each animated element a layer, between the drawn ones around it', () => {
  const nodes = [
    node('rect', { id: 'sky' }),
    node('g', { id: 'bird' }),
    node('rect', { id: 'sea' }),
  ];
  expect(describe(getLayers({ nodes, targets: new Set(['bird']) }))).toEqual([
    { ancestors: [], nodes: ['sky'] },
    { target: 'bird', layers: [{ ancestors: [], nodes: ['bird'] }] },
    { ancestors: [], nodes: ['sea'] },
  ]);
});

test('getLayers splits a group around an animated element, keeping the group as an ancestor', () => {
  const nodes = [
    node('g', { id: 'scene', transform: 'translate(4 0)' }, [
      node('rect', { id: 'ground' }),
      node('path', { id: 'wave' }),
      node('rect', { id: 'rock' }),
    ]),
  ];
  expect(describe(getLayers({ nodes, targets: new Set(['wave']) }))).toEqual([
    { ancestors: ['scene'], nodes: ['ground'] },
    { target: 'wave', layers: [{ ancestors: ['scene'], nodes: ['wave'] }] },
    { ancestors: ['scene'], nodes: ['rock'] },
  ]);
});

test('getLayers nests an animated element inside an animated group, so it moves with the group', () => {
  const nodes = [
    node('g', { id: 'bird' }, [node('path', { id: 'body' }), node('g', { id: 'blink' })]),
  ];
  expect(describe(getLayers({ nodes, targets: new Set(['bird', 'blink']) }))).toEqual([
    {
      target: 'bird',
      layers: [
        { ancestors: ['bird'], nodes: ['body'] },
        { target: 'blink', layers: [{ ancestors: ['bird'], nodes: ['blink'] }] },
      ],
    },
  ]);
});

test('getLayers skips text between elements', () => {
  const nodes = ['\n', node('rect', { id: 'a' })];
  expect(describe(getLayers({ nodes, targets: new Set() }))).toEqual([
    { ancestors: [], nodes: ['a'] },
  ]);
});
