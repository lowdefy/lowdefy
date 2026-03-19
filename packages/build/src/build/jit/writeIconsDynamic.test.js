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
import writeIconsDynamic from './writeIconsDynamic.js';

const mockWriteBuildArtifact = jest.fn();

beforeEach(() => {
  mockWriteBuildArtifact.mockReset();
  mockWriteBuildArtifact.mockResolvedValue(undefined);
});

test('writeIconsDynamic writes icon data as self-contained JS module', async () => {
  const context = {
    writeBuildArtifact: mockWriteBuildArtifact,
    dynamicIconData: {},
  };
  const newIconData = {
    IoAddCircle: { tag: 'svg', attr: { viewBox: '0 0 512 512' }, child: [] },
  };

  await writeIconsDynamic({ newIconData, context });

  expect(mockWriteBuildArtifact).toHaveBeenCalledTimes(1);
  expect(mockWriteBuildArtifact).toHaveBeenCalledWith(
    'plugins/iconsDynamic.js',
    expect.any(String)
  );

  const content = mockWriteBuildArtifact.mock.calls[0][1];
  expect(content).toMatch(/^export default /);
  expect(content).toContain('IoAddCircle');
});

test('writeIconsDynamic output is parseable by parseJsModule pattern', async () => {
  const context = {
    writeBuildArtifact: mockWriteBuildArtifact,
    dynamicIconData: {},
  };
  const iconData = {
    tag: 'svg',
    attr: { viewBox: '0 0 512 512' },
    child: [{ tag: 'path', attr: { d: 'M1 2' }, child: [] }],
  };

  await writeIconsDynamic({ newIconData: { IoAddCircle: iconData }, context });

  const content = mockWriteBuildArtifact.mock.calls[0][1];

  // Simulate the parseJsModule pattern from usePageConfig.js
  const fn = new Function('exports', content.replace('export default', 'exports.default ='));
  const mod = {};
  fn(mod);

  expect(mod.default).toBeDefined();
  expect(mod.default.IoAddCircle).toEqual(iconData);
});

test('writeIconsDynamic accumulates icons across multiple calls', async () => {
  const context = {
    writeBuildArtifact: mockWriteBuildArtifact,
    dynamicIconData: {},
  };

  await writeIconsDynamic({
    newIconData: { IoAddCircle: { tag: 'svg', attr: {}, child: [] } },
    context,
  });
  await writeIconsDynamic({
    newIconData: { MdDelete: { tag: 'svg', attr: {}, child: [] } },
    context,
  });

  expect(mockWriteBuildArtifact).toHaveBeenCalledTimes(2);

  // Second call should contain both icons
  const content = mockWriteBuildArtifact.mock.calls[1][1];
  expect(content).toContain('IoAddCircle');
  expect(content).toContain('MdDelete');
});

test('writeIconsDynamic writes empty module when no icon data', async () => {
  const context = {
    writeBuildArtifact: mockWriteBuildArtifact,
    dynamicIconData: {},
  };

  await writeIconsDynamic({ newIconData: {}, context });

  const content = mockWriteBuildArtifact.mock.calls[0][1];
  expect(content).toBe('export default {};\n');
});
