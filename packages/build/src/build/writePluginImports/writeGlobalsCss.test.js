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

const mockExistsSync = jest.fn();

jest.unstable_mockModule('fs', () => ({
  default: { existsSync: mockExistsSync },
  existsSync: mockExistsSync,
}));

let writeGlobalsCss;

beforeAll(async () => {
  writeGlobalsCss = (await import('./writeGlobalsCss.js')).default;
});

beforeEach(() => {
  mockExistsSync.mockReset();
  mockExistsSync.mockReturnValue(false);
});

function createContext() {
  return {
    directories: { config: '/app' },
    handleWarning: jest.fn(),
    writeBuildArtifact: jest.fn(),
  };
}

test('writeGlobalsCss generates default bridge variables', async () => {
  const context = createContext();
  await writeGlobalsCss({ components: {}, context });

  const css = context.writeBuildArtifact.mock.calls[0][1];

  expect(css).toContain('--color-primary: var(--ant-color-primary);');
  expect(css).toContain('--color-primary-hover: var(--ant-color-primary-hover);');
  expect(css).toContain('--color-primary-active: var(--ant-color-primary-active);');
  expect(css).toContain('--color-primary-bg: var(--ant-color-primary-bg);');
  expect(css).toContain('--color-success: var(--ant-color-success);');
  expect(css).toContain('--color-warning: var(--ant-color-warning);');
  expect(css).toContain('--color-error: var(--ant-color-error);');
  expect(css).toContain('--color-info: var(--ant-color-info);');
  expect(css).toContain('--color-text-primary: var(--ant-color-text);');
  expect(css).toContain('--color-text-secondary: var(--ant-color-text-secondary);');
  expect(css).toContain('--color-bg-container: var(--ant-color-bg-container);');
  expect(css).toContain('--color-bg-layout: var(--ant-color-bg-layout);');
  expect(css).toContain('--color-border: var(--ant-color-border);');
  expect(css).toContain('--radius-DEFAULT: var(--ant-border-radius);');
  expect(css).toContain('--radius-sm: var(--ant-border-radius-sm);');
  expect(css).toContain('--radius-lg: var(--ant-border-radius-lg);');
  expect(css).toContain('--font-size-DEFAULT: var(--ant-font-size);');
  expect(css).toContain('--font-size-sm: var(--ant-font-size-sm);');
  expect(css).toContain('--font-size-lg: var(--ant-font-size-lg);');
  expect(css).toContain('--font-family-sans: var(--ant-font-family);');
});

test('writeGlobalsCss includes layer order and tailwind import', async () => {
  const context = createContext();
  await writeGlobalsCss({ components: {}, context });

  const css = context.writeBuildArtifact.mock.calls[0][1];
  expect(css).toContain('@layer theme, base, antd, components, utilities;');
  expect(css).toContain('@import "tailwindcss";');
  expect(css).toContain('@source "../node_modules/@lowdefy/blocks-*/dist/**/*.js";');
});

test('writeGlobalsCss deep merges theme.tailwind overrides with defaults', async () => {
  const context = createContext();
  const components = {
    theme: {
      tailwind: {
        color: {
          primary: '#ff0000',
        },
      },
    },
  };

  await writeGlobalsCss({ components, context });

  const css = context.writeBuildArtifact.mock.calls[0][1];
  expect(css).toContain('--color-primary: #ff0000;');
  expect(css).toContain('--color-success: var(--ant-color-success);');
  expect(css).toContain('--radius-DEFAULT: var(--ant-border-radius);');
});

test('writeGlobalsCss adds new tailwind entries alongside defaults', async () => {
  const context = createContext();
  const components = {
    theme: {
      tailwind: {
        color: {
          accent: '#9333ea',
        },
        spacing: {
          lg: '2rem',
        },
      },
    },
  };

  await writeGlobalsCss({ components, context });

  const css = context.writeBuildArtifact.mock.calls[0][1];
  expect(css).toContain('--color-accent: #9333ea;');
  expect(css).toContain('--spacing-lg: 2rem;');
  expect(css).toContain('--color-primary: var(--ant-color-primary);');
});

test('writeGlobalsCss emits deprecation warning for styles.less', async () => {
  mockExistsSync.mockImplementation((filePath) => filePath.endsWith('styles.less'));
  const context = createContext();

  await writeGlobalsCss({ components: {}, context });

  expect(context.handleWarning).toHaveBeenCalledTimes(1);
  const warning = context.handleWarning.mock.calls[0][0];
  expect(warning.message).toContain('styles.less is deprecated');
  expect(warning.prodError).toBe(true);
});

test('writeGlobalsCss does not emit warning when styles.less does not exist', async () => {
  const context = createContext();
  await writeGlobalsCss({ components: {}, context });
  expect(context.handleWarning).not.toHaveBeenCalled();
});

test('writeGlobalsCss includes styles.css import when file exists', async () => {
  mockExistsSync.mockImplementation((filePath) => filePath.endsWith('styles.css'));
  const context = createContext();

  await writeGlobalsCss({ components: {}, context });

  const css = context.writeBuildArtifact.mock.calls[0][1];
  expect(css).toContain('@import "../../public/styles.css" layer(components);');
});

test('writeGlobalsCss omits styles.css import when file does not exist', async () => {
  const context = createContext();
  await writeGlobalsCss({ components: {}, context });

  const css = context.writeBuildArtifact.mock.calls[0][1];
  expect(css).not.toContain('styles.css');
});
