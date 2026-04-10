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

function createContext() {
  return {
    directories: { server: '/test/server' },
    handleWarning: jest.fn(),
  };
}

test('validateIconImports passes valid icons through unchanged', async () => {
  const { default: validateIconImports } = await import('./validateIconImports.js');

  mockRequire.mockReturnValue({
    AiFillAlert: () => null,
    AiFillBell: () => null,
  });

  const context = createContext();
  const result = validateIconImports({
    iconImports: [{ icons: ['AiFillAlert', 'AiFillBell'], package: 'react-icons/ai' }],
    context,
  });

  expect(result).toEqual([{ icons: ['AiFillAlert', 'AiFillBell'], package: 'react-icons/ai' }]);
  expect(context.handleWarning).not.toHaveBeenCalled();
});

test('validateIconImports filters out invalid icons and emits warning', async () => {
  const { default: validateIconImports } = await import('./validateIconImports.js');

  mockRequire.mockReturnValue({
    AiFillAlert: () => null,
    AiOutlineTool: () => null,
  });

  const context = createContext();
  const result = validateIconImports({
    iconImports: [
      { icons: ['AiFillAlert', 'AiOutlineToolOutlined'], package: 'react-icons/ai' },
    ],
    context,
  });

  expect(result).toEqual([{ icons: ['AiFillAlert'], package: 'react-icons/ai' }]);
  expect(context.handleWarning).toHaveBeenCalledTimes(1);
  expect(context.handleWarning.mock.calls[0][0].message).toBe(
    'Icon "AiOutlineToolOutlined" not found in "react-icons/ai". Did you mean "AiOutlineTool"?'
  );
});

test('validateIconImports emits warning without suggestion when no close match', async () => {
  const { default: validateIconImports } = await import('./validateIconImports.js');

  mockRequire.mockReturnValue({
    AiFillAlert: () => null,
  });

  const context = createContext();
  const result = validateIconImports({
    iconImports: [
      { icons: ['AiFillAlert', 'AiCompletelyWrong'], package: 'react-icons/ai' },
    ],
    context,
  });

  expect(result).toEqual([{ icons: ['AiFillAlert'], package: 'react-icons/ai' }]);
  expect(context.handleWarning).toHaveBeenCalledTimes(1);
  expect(context.handleWarning.mock.calls[0][0].message).toBe(
    'Icon "AiCompletelyWrong" not found in "react-icons/ai".'
  );
});

test('validateIconImports skips validation when package fails to load', async () => {
  const { default: validateIconImports } = await import('./validateIconImports.js');

  mockRequire.mockImplementation(() => {
    throw new Error('Module not found');
  });

  const context = createContext();
  const result = validateIconImports({
    iconImports: [{ icons: ['AiFillAlert', 'AiBadIcon'], package: 'react-icons/ai' }],
    context,
  });

  expect(result).toEqual([
    { icons: ['AiFillAlert', 'AiBadIcon'], package: 'react-icons/ai' },
  ]);
  expect(context.handleWarning).not.toHaveBeenCalled();
});

test('validateIconImports passes through empty icon lists', async () => {
  const { default: validateIconImports } = await import('./validateIconImports.js');

  const context = createContext();
  const result = validateIconImports({
    iconImports: [{ icons: [], package: 'react-icons/ai' }],
    context,
  });

  expect(result).toEqual([{ icons: [], package: 'react-icons/ai' }]);
  expect(mockRequire).not.toHaveBeenCalled();
});

test('validateIconImports handles multiple packages independently', async () => {
  const { default: validateIconImports } = await import('./validateIconImports.js');

  mockRequire.mockImplementation((pkg) => {
    if (pkg === 'react-icons/ai') return { AiFillAlert: () => null };
    if (pkg === 'react-icons/fi') return { FiHome: () => null };
    throw new Error('not found');
  });

  const context = createContext();
  const result = validateIconImports({
    iconImports: [
      { icons: ['AiFillAlert', 'AiBadIcon'], package: 'react-icons/ai' },
      { icons: ['FiHome'], package: 'react-icons/fi' },
    ],
    context,
  });

  expect(result).toEqual([
    { icons: ['AiFillAlert'], package: 'react-icons/ai' },
    { icons: ['FiHome'], package: 'react-icons/fi' },
  ]);
  expect(context.handleWarning).toHaveBeenCalledTimes(1);
});

test('validateIconImports caches package module across entries', async () => {
  const { default: validateIconImports } = await import('./validateIconImports.js');

  mockRequire.mockReturnValue({ AiFillAlert: () => null });

  const context = createContext();
  validateIconImports({
    iconImports: [
      { icons: ['AiFillAlert'], package: 'react-icons/ai' },
      { icons: ['AiBadIcon'], package: 'react-icons/ai' },
    ],
    context,
  });

  expect(mockRequire).toHaveBeenCalledTimes(1);
});
