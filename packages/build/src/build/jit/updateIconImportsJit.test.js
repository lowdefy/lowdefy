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

import { icons as lucideIcons } from 'lucide';

import createIconContext from '../icons/createIconContext.js';
import updateIconImportsJit from './updateIconImportsJit.js';

test('updateIconImportsJit adds IconData keyed by the names as used', async () => {
  const icons = await createIconContext({ context: { typesMap: { iconSets: {} } } });
  const context = { dynamicIconData: { check: { node: lucideIcons.Check } } };
  await updateIconImportsJit({ names: ['edit', 'lucide:House'], icons, context });
  expect(context.dynamicIconData).toEqual({
    check: { node: lucideIcons.Check },
    edit: { node: lucideIcons.Pencil },
    'lucide:House': { node: lucideIcons.House },
  });
});

test('updateIconImportsJit delivers qualified and semantic names from an icon set plugin', async () => {
  const { default: createIconSemanticMap } = await import('../icons/createIconSemanticMap.js');
  const { default: createLucideIconLayer } = await import('../icons/createLucideIconLayer.js');
  const { default: createTestIconLayer } = await import('../../test-utils/createTestIconLayer.js');
  const node = [['path', { d: 'M0 0' }]];
  const sets = {
    lucide: [createLucideIconLayer()],
    tabler: [
      createTestIconLayer({
        icons: { TablerPencil: { node } },
        attrs: { fill: 'none' },
        semantic: { edit: 'TablerPencil' },
      }),
    ],
  };
  const icons = {
    sets,
    defaultSet: 'tabler',
    semantic: createIconSemanticMap({ sets, defaultSet: 'tabler' }),
  };
  const context = { dynamicIconData: {} };
  await updateIconImportsJit({ names: ['edit', 'tabler:TablerPencil', 'Bell'], icons, context });
  expect(context.dynamicIconData).toEqual({
    edit: { node, attrs: { fill: 'none' } },
    'tabler:TablerPencil': { node, attrs: { fill: 'none' } },
    Bell: { node: lucideIcons.Bell },
  });
});
