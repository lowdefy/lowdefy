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

import writeIconImports from './writeIconImports.js';

const mockWriteBuildArtifact = jest.fn();

const components = {
  imports: {
    icons: [
      { package: 'react-icons/ai', icons: ['AiFillHome', 'AiOutlineExclamationCircle'] },
      { package: 'react-icons/md', icons: ['MdSettings'] },
      { package: 'react-icons/bs', icons: [] },
    ],
  },
};

function written(artifactPath) {
  const call = mockWriteBuildArtifact.mock.calls.find(([path]) => path === artifactPath);
  return call?.[1];
}

beforeEach(() => {
  mockWriteBuildArtifact.mockReset();
});

test('writeIconImports writes the app-wide icon barrel', async () => {
  await writeIconImports({ components, context: { writeBuildArtifact: mockWriteBuildArtifact } });
  const barrel = written('plugins/icons.js');
  expect(barrel).toContain("from 'react-icons/ai'");
  expect(barrel).toContain('AiFillHome');
  expect(barrel).toContain('MdSettings');
});

test('writeIconImports writes the barrel icon names for the client to read', async () => {
  await writeIconImports({ components, context: { writeBuildArtifact: mockWriteBuildArtifact } });
  expect(written('plugins/iconNames.js')).toEqual(
    'export default ["AiFillHome","AiOutlineExclamationCircle","MdSettings"];\n'
  );
});

test('writeIconImports writes an empty name list when the app uses no icons', async () => {
  await writeIconImports({
    components: { imports: { icons: [] } },
    context: { writeBuildArtifact: mockWriteBuildArtifact },
  });
  expect(written('plugins/iconNames.js')).toEqual('export default [];\n');
});

test('writeIconImports lists an icon that two packages export once', async () => {
  await writeIconImports({
    components: {
      imports: {
        icons: [
          { package: 'react-icons/io', icons: ['IoIosHome'] },
          { package: 'react-icons/io5', icons: ['IoIosHome'] },
        ],
      },
    },
    context: { writeBuildArtifact: mockWriteBuildArtifact },
  });
  expect(written('plugins/iconNames.js')).toEqual('export default ["IoIosHome"];\n');
});
