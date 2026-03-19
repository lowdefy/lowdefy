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

const mockWriteBuildArtifact = jest.fn();
const mockExtractIconData = jest.fn();
const mockWriteIconsDynamic = jest.fn();

jest.unstable_mockModule('./extractIconData.js', () => ({
  default: mockExtractIconData,
}));

jest.unstable_mockModule('./writeIconsDynamic.js', () => ({
  default: mockWriteIconsDynamic,
}));

beforeEach(() => {
  mockWriteBuildArtifact.mockReset();
  mockWriteBuildArtifact.mockResolvedValue(undefined);
  mockExtractIconData.mockReset();
  mockExtractIconData.mockReturnValue({});
  mockWriteIconsDynamic.mockReset();
  mockWriteIconsDynamic.mockResolvedValue(undefined);
});

test('updateIconImportsJit adds new icon to existing package entry and writes artifacts', async () => {
  const { default: updateIconImportsJit } = await import('./updateIconImportsJit.js');

  const iconImports = [
    { icons: ['AiFillHome'], package: 'react-icons/ai' },
    { icons: [], package: 'react-icons/io5' },
  ];
  const context = {
    writeBuildArtifact: mockWriteBuildArtifact,
    directories: { server: '/test/server' },
    dynamicIconData: {},
  };
  const newIcons = [{ icon: 'IoAddCircle', package: 'react-icons/io5' }];

  await updateIconImportsJit({ newIcons, iconImports, context });

  // iconImports mutated in place
  expect(iconImports[1].icons).toContain('IoAddCircle');

  // iconImports.json written
  const jsonCall = mockWriteBuildArtifact.mock.calls.find((c) => c[0] === 'iconImports.json');
  expect(jsonCall).toBeDefined();
  const written = JSON.parse(jsonCall[1]);
  expect(written[1].icons).toContain('IoAddCircle');

  // extractIconData called with the new icons
  expect(mockExtractIconData).toHaveBeenCalledWith({
    icons: newIcons,
    directories: context.directories,
  });

  // writeIconsDynamic called
  expect(mockWriteIconsDynamic).toHaveBeenCalledWith({
    newIconData: {},
    context,
  });
});

test('updateIconImportsJit adds icons for package not yet in imports', async () => {
  const { default: updateIconImportsJit } = await import('./updateIconImportsJit.js');

  const iconImports = [{ icons: [], package: 'react-icons/ai' }];
  const context = {
    writeBuildArtifact: mockWriteBuildArtifact,
    directories: { server: '/test/server' },
    dynamicIconData: {},
  };
  const newIcons = [{ icon: 'MdDelete', package: 'react-icons/md' }];

  await updateIconImportsJit({ newIcons, iconImports, context });

  const mdEntry = iconImports.find((e) => e.package === 'react-icons/md');
  expect(mdEntry).toBeDefined();
  expect(mdEntry.icons).toContain('MdDelete');
});

test('updateIconImportsJit merges multiple new icons', async () => {
  const { default: updateIconImportsJit } = await import('./updateIconImportsJit.js');

  const iconImports = [
    { icons: ['AiFillHome'], package: 'react-icons/ai' },
    { icons: [], package: 'react-icons/io5' },
  ];
  const context = {
    writeBuildArtifact: mockWriteBuildArtifact,
    directories: { server: '/test/server' },
    dynamicIconData: {},
  };
  const newIcons = [
    { icon: 'IoAddCircle', package: 'react-icons/io5' },
    { icon: 'AiFillStar', package: 'react-icons/ai' },
  ];

  await updateIconImportsJit({ newIcons, iconImports, context });

  expect(iconImports[0].icons).toContain('AiFillHome');
  expect(iconImports[0].icons).toContain('AiFillStar');
  expect(iconImports[1].icons).toContain('IoAddCircle');
});

test('updateIconImportsJit passes extracted icon data to writeIconsDynamic', async () => {
  const { default: updateIconImportsJit } = await import('./updateIconImportsJit.js');

  const iconData = { IoAddCircle: { tag: 'svg', attr: {}, child: [] } };
  mockExtractIconData.mockReturnValue(iconData);

  const iconImports = [{ icons: [], package: 'react-icons/io5' }];
  const context = {
    writeBuildArtifact: mockWriteBuildArtifact,
    directories: { server: '/test/server' },
    dynamicIconData: {},
  };
  const newIcons = [{ icon: 'IoAddCircle', package: 'react-icons/io5' }];

  await updateIconImportsJit({ newIcons, iconImports, context });

  expect(mockWriteIconsDynamic).toHaveBeenCalledWith({
    newIconData: iconData,
    context,
  });
});

test('updateIconImportsJit does not duplicate icons on concurrent calls', async () => {
  const { default: updateIconImportsJit } = await import('./updateIconImportsJit.js');

  const iconImports = [{ icons: ['IoAddCircle'], package: 'react-icons/io5' }];
  const context = {
    writeBuildArtifact: mockWriteBuildArtifact,
    directories: { server: '/test/server' },
    dynamicIconData: {},
  };
  // Simulates a concurrent JIT build trying to add the same icon
  const newIcons = [{ icon: 'IoAddCircle', package: 'react-icons/io5' }];

  await updateIconImportsJit({ newIcons, iconImports, context });

  const io5Icons = iconImports[0].icons.filter((i) => i === 'IoAddCircle');
  expect(io5Icons).toHaveLength(1);
});
