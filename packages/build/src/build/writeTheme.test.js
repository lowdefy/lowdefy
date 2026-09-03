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

import writeTheme from './writeTheme.js';
import testContext from '../test-utils/testContext.js';

const mockWriteBuildArtifact = jest.fn();

const context = testContext({ writeBuildArtifact: mockWriteBuildArtifact });

beforeEach(() => {
  mockWriteBuildArtifact.mockReset();
});

test('writeTheme writes theme.json', async () => {
  const components = {
    theme: {
      antd: {
        token: { colorPrimary: '#00b96b' },
      },
    },
  };
  await writeTheme({ components, context });
  expect(mockWriteBuildArtifact.mock.calls).toEqual([
    ['theme.json', '{"antd":{"token":{"colorPrimary":"#00b96b"}},"darkMode":"system"}'],
  ]);
});

test('writeTheme writes empty object when theme is empty', async () => {
  const components = {
    theme: {},
  };
  await writeTheme({ components, context });
  expect(mockWriteBuildArtifact.mock.calls).toEqual([['theme.json', '{"darkMode":"system"}']]);
});

test('writeTheme defaults to empty object when theme is undefined', async () => {
  const components = {};
  await writeTheme({ components, context });
  expect(mockWriteBuildArtifact.mock.calls).toEqual([['theme.json', '{"darkMode":"system"}']]);
});

test('writeTheme throws when theme is not an object', async () => {
  const components = {
    theme: 'theme',
  };
  await expect(writeTheme({ components, context })).rejects.toThrow('Theme is not an object.');
});

test('writeTheme preserves per-mode lightToken and darkToken', async () => {
  const components = {
    theme: {
      antd: {
        token: { colorPrimary: '#6366f1' },
        lightToken: { colorBgLayout: '#fafafa' },
        darkToken: { colorBgLayout: '#0f1117', colorBgContainer: '#18181b' },
      },
    },
  };
  await writeTheme({ components, context });
  expect(mockWriteBuildArtifact.mock.calls).toEqual([
    [
      'theme.json',
      '{"antd":{"token":{"colorPrimary":"#6366f1"},"lightToken":{"colorBgLayout":"#fafafa"},"darkToken":{"colorBgLayout":"#0f1117","colorBgContainer":"#18181b"}},"darkMode":"system"}',
    ],
  ]);
});

test('writeTheme maps theme.mode to darkMode', async () => {
  const components = {
    theme: { mode: 'dark' },
  };
  await writeTheme({ components, context });
  expect(mockWriteBuildArtifact.mock.calls).toEqual([['theme.json', '{"darkMode":"dark"}']]);
});

test('writeTheme mode wins over the deprecated darkMode alias', async () => {
  const components = {
    theme: { mode: 'light', darkMode: 'dark' },
  };
  await writeTheme({ components, context });
  expect(mockWriteBuildArtifact.mock.calls).toEqual([['theme.json', '{"darkMode":"light"}']]);
});

test('writeTheme maps density compact to the antd compact algorithm', async () => {
  const components = {
    theme: { density: 'compact' },
  };
  await writeTheme({ components, context });
  expect(mockWriteBuildArtifact.mock.calls).toEqual([
    ['theme.json', '{"darkMode":"system","antd":{"algorithm":"compact"}}'],
  ]);
});

test('writeTheme density default does not add an algorithm', async () => {
  const components = {
    theme: { density: 'default' },
  };
  await writeTheme({ components, context });
  expect(mockWriteBuildArtifact.mock.calls).toEqual([['theme.json', '{"darkMode":"system"}']]);
});

test('writeTheme appends compact to a configured algorithm array', async () => {
  const components = {
    theme: { density: 'compact', antd: { algorithm: ['dark'] } },
  };
  await writeTheme({ components, context });
  expect(mockWriteBuildArtifact.mock.calls).toEqual([
    ['theme.json', '{"antd":{"algorithm":["dark","compact"]},"darkMode":"system"}'],
  ]);
});

test('writeTheme does not duplicate compact when already configured', async () => {
  const components = {
    theme: { density: 'compact', antd: { algorithm: 'compact' } },
  };
  await writeTheme({ components, context });
  expect(mockWriteBuildArtifact.mock.calls).toEqual([
    ['theme.json', '{"antd":{"algorithm":"compact"},"darkMode":"system"}'],
  ]);
});

test('writeTheme maps radius to the borderRadius token', async () => {
  const components = {
    theme: { radius: 12 },
  };
  await writeTheme({ components, context });
  expect(mockWriteBuildArtifact.mock.calls).toEqual([
    ['theme.json', '{"darkMode":"system","antd":{"token":{"borderRadius":12}}}'],
  ]);
});

test('writeTheme lets an explicit borderRadius token win over radius', async () => {
  const components = {
    theme: { radius: 12, antd: { token: { borderRadius: 2, colorPrimary: '#6366f1' } } },
  };
  await writeTheme({ components, context });
  expect(mockWriteBuildArtifact.mock.calls).toEqual([
    [
      'theme.json',
      '{"antd":{"token":{"borderRadius":2,"colorPrimary":"#6366f1"}},"darkMode":"system"}',
    ],
  ]);
});

test('writeTheme composes mode, density and radius', async () => {
  const components = {
    theme: { mode: 'dark', density: 'compact', radius: 0 },
  };
  await writeTheme({ components, context });
  expect(mockWriteBuildArtifact.mock.calls).toEqual([
    ['theme.json', '{"darkMode":"dark","antd":{"algorithm":"compact","token":{"borderRadius":0}}}'],
  ]);
});
