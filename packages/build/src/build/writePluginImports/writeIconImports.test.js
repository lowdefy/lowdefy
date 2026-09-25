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

import { jest } from '@jest/globals';
import { icons as lucideIcons } from 'lucide';

import createIconContext from '../icons/createIconContext.js';
import createLucideIconLayer from '../icons/createLucideIconLayer.js';
import createIconSemanticMap from '../icons/createIconSemanticMap.js';
import createTestIconLayer from '../../test-utils/createTestIconLayer.js';
import writeIconImports from './writeIconImports.js';

async function write({ names, icons }) {
  const context = {
    icons: icons ?? (await createIconContext({ context: { typesMap: { iconSets: {} } } })),
    writeBuildArtifact: jest.fn(),
  };
  await writeIconImports({ components: { imports: { icons: names } }, context });
  return context.writeBuildArtifact;
}

test('writeIconImports writes icon data with each node array once, in code point order', async () => {
  const writeBuildArtifact = await write({ names: ['edit', 'Home', 'House', 'Pencil'] });
  expect(writeBuildArtifact.mock.calls[0]).toEqual([
    'plugins/icons.js',
    `const n0 = ${JSON.stringify(lucideIcons.House)};
const n1 = ${JSON.stringify(lucideIcons.Pencil)};
export default {
  "Home": { node: n0 },
  "House": { node: n0 },
  "Pencil": { node: n1 },
  "edit": { node: n1 },
};
`,
  ]);
});

test('writeIconImports writes size, width, height and attrs when the data has them', async () => {
  const node = [['path', { d: 'M0 0' }]];
  const sets = {
    lucide: [createLucideIconLayer()],
    acme: [
      createTestIconLayer({
        icons: {
          Square: { node, size: 1024 },
          Wide: { node, width: 16, height: 20 },
        },
        attrs: { fill: 'currentColor', stroke: 'none' },
      }),
    ],
  };
  const icons = {
    sets,
    defaultSet: 'lucide',
    semantic: createIconSemanticMap({ sets, defaultSet: 'lucide' }),
  };
  const writeBuildArtifact = await write({ names: ['acme:Square', 'acme:Wide'], icons });
  expect(writeBuildArtifact.mock.calls[0][1]).toBe(`const n0 = [["path",{"d":"M0 0"}]];
export default {
  "acme:Square": { node: n0, size: 1024, attrs: {"fill":"currentColor","stroke":"none"} },
  "acme:Wide": { node: n0, width: 16, height: 20, attrs: {"fill":"currentColor","stroke":"none"} },
};
`);
});

test('writeIconImports output is a module that evaluates to IconData', async () => {
  const writeBuildArtifact = await write({ names: ['check', 'close'] });
  const source = writeBuildArtifact.mock.calls[0][1];
  const url = `data:text/javascript;base64,${Buffer.from(source).toString('base64')}`;
  const { default: iconMap } = await import(url);
  expect(iconMap).toEqual({
    check: { node: lucideIcons.Check },
    close: { node: lucideIcons.X },
  });
});

test('writeIconImports writes the full semantic map for icon search', async () => {
  const icons = await createIconContext({
    context: { typesMap: { iconSets: {} } },
    iconsConfig: { aliases: { invoice: 'Receipt' } },
  });
  const writeBuildArtifact = await write({ names: ['check'], icons });
  const [name, content] = writeBuildArtifact.mock.calls[1];
  expect(name).toBe('iconAliases.json');
  expect(JSON.parse(content)).toMatchObject({ edit: 'Pencil', invoice: 'Receipt' });
});
