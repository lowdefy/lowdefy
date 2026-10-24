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

import { G, Path } from 'react-native-svg';

import colorNodes from './colorNodes.js';
import parseIllustration from './parseIllustration.js';

const SVG = `<svg viewBox="0 0 20 10">
  <defs><linearGradient id="fade"><stop offset="0" stop-color="var(--sky)"/></linearGradient></defs>
  <g id="bird" fill="var(--ink)">
    <path id="wing" d="M1 1h2v2h-2z" stroke-width="2"/>
  </g>
</svg>`;

test('parseIllustration reads the viewBox, the definitions and the drawn elements', () => {
  const drawing = parseIllustration({ svg: SVG });
  expect(drawing.viewBox).toEqual([0, 0, 20, 10]);
  expect(drawing.definitions.map((node) => node.tag)).toEqual(['defs']);
  expect(drawing.nodes).toHaveLength(1);
  const [bird] = drawing.nodes;
  expect(bird).toMatchObject({ props: { fill: 'var(--ink)', id: 'bird' }, tag: 'g', Tag: G });
  expect(bird.children[0]).toMatchObject({
    props: { d: 'M1 1h2v2h-2z', id: 'wing', strokeWidth: 2 },
    tag: 'path',
    Tag: Path,
  });
});

test('parseIllustration takes the size as the viewBox when there is none', () => {
  expect(
    parseIllustration({ svg: '<svg width="30" height="12"><rect width="1" height="1"/></svg>' })
      .viewBox
  ).toEqual([0, 0, 30, 12]);
});

test('parseIllustration throws for markup with no viewBox or size', () => {
  expect(() => parseIllustration({ svg: '<svg><rect width="1" height="1"/></svg>' })).toThrow(
    'Illustration svg needs a viewBox, or a numeric width and height. Received viewBox undefined.'
  );
});

test('parseIllustration throws for markup that is not an svg element', () => {
  expect(() => parseIllustration({ svg: '<g><rect width="1" height="1"/></g>' })).toThrow(
    'Illustration svg must be one <svg> element.'
  );
});

test('colorNodes replaces var references with named colours, in definitions and styles too', () => {
  const drawing = parseIllustration({ svg: SVG });
  const colors = { ink: '#111111', sky: '#88AAFF' };
  const [bird] = colorNodes({ colors, nodes: drawing.nodes });
  expect(bird.props.fill).toBe('#111111');
  const [defs] = colorNodes({ colors, nodes: drawing.definitions });
  expect(defs.children[0].children[0].props.stopColor).toBe('#88AAFF');
  expect(drawing.nodes[0].props.fill).toBe('var(--ink)');
  const [styled] = colorNodes({
    colors,
    nodes: parseIllustration({
      svg: '<svg viewBox="0 0 1 1"><rect style="fill: var(--ink)" width="1" height="1"/></svg>',
    }).nodes,
  });
  expect(styled.props.style).toEqual({ fill: '#111111' });
});

test('colorNodes takes a fallback for a name with no colour, and throws without one', () => {
  const nodes = parseIllustration({
    svg: '<svg viewBox="0 0 1 1"><rect fill="var(--missing, #ABCDEF)" stroke="var(--gone)"/></svg>',
  }).nodes;
  expect(() => colorNodes({ colors: {}, nodes })).toThrow(
    'Illustration svg uses var(--gone), which is not in colors or the theme tokens.'
  );
  const [rect] = colorNodes({ colors: { gone: 'none' }, nodes });
  expect(rect.props).toMatchObject({ fill: '#ABCDEF', stroke: 'none' });
});
