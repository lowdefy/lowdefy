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

import defaultIconAliases from '../buildImports/defaultIconAliases.js';
import writeIconImports from './writeIconImports.js';

test('writeIconImports writes alias keys after the imported icons', async () => {
  const context = { writeBuildArtifact: jest.fn() };
  const components = {
    imports: {
      icons: [
        { icons: ['AiFillHome'], package: 'react-icons/ai' },
        { icons: ['LuPencil', 'LuTrash2'], package: 'react-icons/lu' },
        { icons: [], package: 'react-icons/tb' },
      ],
      iconAliases: { delete: 'LuTrash2', edit: 'LuPencil' },
    },
  };
  await writeIconImports({ components, context });
  expect(context.writeBuildArtifact.mock.calls[0]).toEqual([
    'plugins/icons.js',
    `import { AiFillHome } from 'react-icons/ai';
import { LuPencil, LuTrash2 } from 'react-icons/lu';
export default {
  AiFillHome,
  LuPencil,
  LuTrash2,
  'delete': LuTrash2,
  'edit': LuPencil,
};`,
  ]);
});

test('writeIconImports writes the full alias map to iconAliases.json', async () => {
  const context = { writeBuildArtifact: jest.fn() };
  const components = {
    theme: { icons: { aliases: { invoice: 'LuReceipt' } } },
    imports: { icons: [], iconAliases: {} },
  };
  await writeIconImports({ components, context });
  expect(context.writeBuildArtifact.mock.calls[1]).toEqual([
    'iconAliases.json',
    JSON.stringify({ ...defaultIconAliases, invoice: 'LuReceipt' }),
  ]);
});

test('writeIconImports writes the same icon map as before when no aliases are used', async () => {
  const context = { writeBuildArtifact: jest.fn() };
  const components = {
    imports: {
      icons: [{ icons: ['AiFillHome'], package: 'react-icons/ai' }],
      iconAliases: {},
    },
  };
  await writeIconImports({ components, context });
  expect(context.writeBuildArtifact.mock.calls[0][1])
    .toBe(`import { AiFillHome } from 'react-icons/ai';
export default {
  AiFillHome,
};`);
});
