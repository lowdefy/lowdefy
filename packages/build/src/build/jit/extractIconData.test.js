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

const mockRequire = jest.fn();

jest.unstable_mockModule('module', () => ({
  createRequire: () => mockRequire,
}));

beforeEach(() => {
  mockRequire.mockReset();
});

// Helper: create a mock icon function whose toString() matches the react-icons GenIcon pattern.
function mockIconFn(name, data) {
  // eslint-disable-next-line no-new-func
  const fn = new Function(
    'GenIcon',
    `return function ${name}(props) { return GenIcon(${JSON.stringify(data)})(props); }`
  )(function GenIcon() {
    return () => null;
  });
  return fn;
}

test('extractIconData extracts SVG tree data for a single icon', async () => {
  const { default: extractIconData } = await import('./extractIconData.js');

  const iconData = { tag: 'svg', attr: { viewBox: '0 0 512 512' }, child: [] };
  mockRequire.mockReturnValue({ IoAddCircle: mockIconFn('IoAddCircle', iconData) });

  const result = extractIconData({
    icons: [{ icon: 'IoAddCircle', package: 'react-icons/io5' }],
    directories: { server: '/test/server' },
  });

  expect(result).toEqual({ IoAddCircle: iconData });
});

test('extractIconData extracts multiple icons from the same package', async () => {
  const { default: extractIconData } = await import('./extractIconData.js');

  const data1 = { tag: 'svg', attr: { viewBox: '0 0 512 512' }, child: [] };
  const data2 = {
    tag: 'svg',
    attr: { viewBox: '0 0 512 512' },
    child: [{ tag: 'path', attr: { d: 'M1 2' }, child: [] }],
  };
  mockRequire.mockReturnValue({
    IoAddCircle: mockIconFn('IoAddCircle', data1),
    IoTrash: mockIconFn('IoTrash', data2),
  });

  const result = extractIconData({
    icons: [
      { icon: 'IoAddCircle', package: 'react-icons/io5' },
      { icon: 'IoTrash', package: 'react-icons/io5' },
    ],
    directories: { server: '/test/server' },
  });

  expect(result).toEqual({ IoAddCircle: data1, IoTrash: data2 });
  // Module should only be loaded once (cached)
  expect(mockRequire).toHaveBeenCalledTimes(1);
});

test('extractIconData handles icons from different packages', async () => {
  const { default: extractIconData } = await import('./extractIconData.js');

  const ioData = { tag: 'svg', attr: { viewBox: '0 0 512 512' }, child: [] };
  const mdData = { tag: 'svg', attr: { viewBox: '0 0 24 24' }, child: [] };
  mockRequire.mockImplementation((pkg) => {
    if (pkg === 'react-icons/io5') return { IoAddCircle: mockIconFn('IoAddCircle', ioData) };
    if (pkg === 'react-icons/md') return { MdDelete: mockIconFn('MdDelete', mdData) };
    throw new Error('not found');
  });

  const result = extractIconData({
    icons: [
      { icon: 'IoAddCircle', package: 'react-icons/io5' },
      { icon: 'MdDelete', package: 'react-icons/md' },
    ],
    directories: { server: '/test/server' },
  });

  expect(result).toEqual({ IoAddCircle: ioData, MdDelete: mdData });
});

test('extractIconData skips icons when package fails to load', async () => {
  const { default: extractIconData } = await import('./extractIconData.js');

  mockRequire.mockImplementation(() => {
    throw new Error('Module not found');
  });

  const result = extractIconData({
    icons: [{ icon: 'IoAddCircle', package: 'react-icons/io5' }],
    directories: { server: '/test/server' },
  });

  expect(result).toEqual({});
});

test('extractIconData skips icons not exported by the package', async () => {
  const { default: extractIconData } = await import('./extractIconData.js');

  mockRequire.mockReturnValue({});

  const result = extractIconData({
    icons: [{ icon: 'IoNonExistent', package: 'react-icons/io5' }],
    directories: { server: '/test/server' },
  });

  expect(result).toEqual({});
});

test('extractIconData returns empty object for empty icons list', async () => {
  const { default: extractIconData } = await import('./extractIconData.js');

  const result = extractIconData({
    icons: [],
    directories: { server: '/test/server' },
  });

  expect(result).toEqual({});
  expect(mockRequire).not.toHaveBeenCalled();
});
