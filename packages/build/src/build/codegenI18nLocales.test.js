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

import codegenI18nLocales from './codegenI18nLocales.js';
import testContext from '../test-utils/testContext.js';

const mockWriteBuildArtifact = jest.fn();
const context = testContext({ writeBuildArtifact: mockWriteBuildArtifact });

beforeEach(() => {
  mockWriteBuildArtifact.mockReset();
});

test('codegenI18nLocales writes empty loaders when i18n is not configured', async () => {
  const components = {};
  await codegenI18nLocales({ components, context });
  const calls = Object.fromEntries(mockWriteBuildArtifact.mock.calls);
  expect(calls['i18n/antdLocales.js']).toContain('const loaders = {');
  expect(calls['i18n/antdLocales.js']).toContain('export default loaders;');
  expect(calls['i18n/dayjsLocales.js']).toContain('const localeMap = {');
});

test('codegenI18nLocales emits dynamic antd imports for declared locales', async () => {
  const components = {
    config: {
      i18n: {
        locales: [
          { code: 'en-US', antd: 'en_US', dayjs: 'en' },
          { code: 'de-DE', antd: 'de_DE', dayjs: 'de' },
        ],
      },
    },
  };
  await codegenI18nLocales({ components, context });
  const calls = Object.fromEntries(mockWriteBuildArtifact.mock.calls);
  expect(calls['i18n/antdLocales.js']).toContain(
    "'en-US': () => import('antd/locale/en_US.js')"
  );
  expect(calls['i18n/antdLocales.js']).toContain(
    "'de-DE': () => import('antd/locale/de_DE.js')"
  );
});

test('codegenI18nLocales emits dayjs imports and code-to-id map', async () => {
  const components = {
    config: {
      i18n: {
        locales: [
          { code: 'en-US', antd: 'en_US', dayjs: 'en' },
          { code: 'de-DE', antd: 'de_DE', dayjs: 'de' },
          { code: 'zh-CN', antd: 'zh_CN', dayjs: 'zh-cn' },
        ],
      },
    },
  };
  await codegenI18nLocales({ components, context });
  const calls = Object.fromEntries(mockWriteBuildArtifact.mock.calls);
  expect(calls['i18n/dayjsLocales.js']).toContain("import 'dayjs/locale/en.js';");
  expect(calls['i18n/dayjsLocales.js']).toContain("import 'dayjs/locale/de.js';");
  expect(calls['i18n/dayjsLocales.js']).toContain("import 'dayjs/locale/zh-cn.js';");
  expect(calls['i18n/dayjsLocales.js']).toContain("'zh-CN': 'zh-cn',");
});

test('codegenI18nLocales skips locales without antd or dayjs fields', async () => {
  const components = {
    config: {
      i18n: {
        locales: [
          { code: 'en-US', antd: 'en_US' },
          { code: 'xx-YY' },
        ],
      },
    },
  };
  await codegenI18nLocales({ components, context });
  const calls = Object.fromEntries(mockWriteBuildArtifact.mock.calls);
  expect(calls['i18n/antdLocales.js']).toContain("'en-US'");
  expect(calls['i18n/antdLocales.js']).not.toContain("'xx-YY'");
  expect(calls['i18n/dayjsLocales.js']).not.toContain("'xx-YY'");
});

test('codegenI18nLocales dedupes dayjs imports', async () => {
  const components = {
    config: {
      i18n: {
        locales: [
          { code: 'en-US', dayjs: 'en' },
          { code: 'en-GB', dayjs: 'en' },
        ],
      },
    },
  };
  await codegenI18nLocales({ components, context });
  const calls = Object.fromEntries(mockWriteBuildArtifact.mock.calls);
  const importCount = (calls['i18n/dayjsLocales.js'].match(/import 'dayjs\/locale\/en\.js';/g) ?? [])
    .length;
  expect(importCount).toBe(1);
});
