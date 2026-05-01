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

import writeI18n from './writeI18n.js';
import testContext from '../test-utils/testContext.js';

const mockWriteBuildArtifact = jest.fn();
const mockWarn = jest.fn();

const context = testContext({
  writeBuildArtifact: mockWriteBuildArtifact,
  logger: { warn: mockWarn },
});

beforeEach(() => {
  mockWriteBuildArtifact.mockReset();
  mockWarn.mockReset();
});

test('writeI18n writes empty artifact when i18n is not configured', async () => {
  const components = { config: {} };
  await writeI18n({ components, context });
  expect(mockWriteBuildArtifact.mock.calls).toEqual([['i18n.json', '{}']]);
});

test('writeI18n writes empty artifact when config is undefined', async () => {
  const components = {};
  await writeI18n({ components, context });
  expect(mockWriteBuildArtifact.mock.calls).toEqual([['i18n.json', '{}']]);
});

test('writeI18n writes the i18n config when valid', async () => {
  const components = {
    config: {
      i18n: {
        defaultLocale: 'en-US',
        locales: [
          { code: 'en-US', label: 'English', antd: 'en_US', dayjs: 'en' },
          { code: 'de-DE', label: 'Deutsch', antd: 'de_DE', dayjs: 'de' },
        ],
        messages: {
          'en-US': { hello: 'Hello' },
          'de-DE': { hello: 'Hallo' },
        },
      },
    },
  };
  await writeI18n({ components, context });
  const [[filename, json]] = mockWriteBuildArtifact.mock.calls;
  expect(filename).toBe('i18n.json');
  const parsed = JSON.parse(json);
  expect(parsed.defaultLocale).toBe('en-US');
  expect(parsed.fallbackLocale).toBe('en-US');
  expect(parsed.locales).toEqual([
    { code: 'en-US', label: 'English', antd: 'en_US', dayjs: 'en' },
    { code: 'de-DE', label: 'Deutsch', antd: 'de_DE', dayjs: 'de' },
  ]);
  expect(parsed.messages).toEqual({
    'en-US': { hello: 'Hello' },
    'de-DE': { hello: 'Hallo' },
  });
});

test('writeI18n defaults fallbackLocale to defaultLocale', async () => {
  const components = {
    config: {
      i18n: {
        defaultLocale: 'en-US',
        locales: [{ code: 'en-US' }],
      },
    },
  };
  await writeI18n({ components, context });
  const parsed = JSON.parse(mockWriteBuildArtifact.mock.calls[0][1]);
  expect(parsed.fallbackLocale).toBe('en-US');
});

test('writeI18n honors explicit fallbackLocale', async () => {
  const components = {
    config: {
      i18n: {
        defaultLocale: 'de-DE',
        fallbackLocale: 'en-US',
        locales: [{ code: 'en-US' }, { code: 'de-DE' }],
      },
    },
  };
  await writeI18n({ components, context });
  const parsed = JSON.parse(mockWriteBuildArtifact.mock.calls[0][1]);
  expect(parsed.fallbackLocale).toBe('en-US');
});

test('writeI18n throws when defaultLocale is missing', async () => {
  const components = {
    config: { i18n: { locales: [{ code: 'en-US' }] } },
  };
  await expect(writeI18n({ components, context })).rejects.toThrow(
    'App "config.i18n" requires a string "defaultLocale".'
  );
});

test('writeI18n throws when locales is empty', async () => {
  const components = {
    config: { i18n: { defaultLocale: 'en-US', locales: [] } },
  };
  await expect(writeI18n({ components, context })).rejects.toThrow(
    'App "config.i18n" requires a non-empty "locales" array.'
  );
});

test('writeI18n throws when defaultLocale is not in locales', async () => {
  const components = {
    config: { i18n: { defaultLocale: 'fr-FR', locales: [{ code: 'en-US' }] } },
  };
  await expect(writeI18n({ components, context })).rejects.toThrow(
    'App "config.i18n.defaultLocale" "fr-FR" must be present in "locales".'
  );
});

test('writeI18n throws when fallbackLocale is not in locales', async () => {
  const components = {
    config: {
      i18n: {
        defaultLocale: 'en-US',
        fallbackLocale: 'fr-FR',
        locales: [{ code: 'en-US' }],
      },
    },
  };
  await expect(writeI18n({ components, context })).rejects.toThrow(
    'App "config.i18n.fallbackLocale" "fr-FR" must be present in "locales".'
  );
});

test('writeI18n throws on duplicate locale codes', async () => {
  const components = {
    config: {
      i18n: {
        defaultLocale: 'en-US',
        locales: [{ code: 'en-US' }, { code: 'en-US' }],
      },
    },
  };
  await expect(writeI18n({ components, context })).rejects.toThrow(
    'Duplicate locale code "en-US" in "config.i18n.locales".'
  );
});

test('writeI18n warns when a declared locale has no messages', async () => {
  const components = {
    config: {
      i18n: {
        defaultLocale: 'en-US',
        locales: [{ code: 'en-US' }, { code: 'de-DE' }],
        messages: { 'en-US': { hello: 'Hello' } },
      },
    },
  };
  await writeI18n({ components, context });
  expect(mockWarn).toHaveBeenCalledWith(
    expect.stringContaining('no messages for locale "de-DE"')
  );
});

test('writeI18n warns when messages reference an undeclared locale', async () => {
  const components = {
    config: {
      i18n: {
        defaultLocale: 'en-US',
        locales: [{ code: 'en-US' }],
        messages: { 'en-US': { hello: 'Hello' }, 'fr-FR': { hello: 'Bonjour' } },
      },
    },
  };
  await writeI18n({ components, context });
  expect(mockWarn).toHaveBeenCalledWith(
    expect.stringContaining('"config.i18n.messages.fr-FR" references a locale not declared')
  );
});
