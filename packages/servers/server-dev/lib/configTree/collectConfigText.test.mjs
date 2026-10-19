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

import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

import collectConfigText from './collectConfigText.mjs';

let buildDirectory;
beforeEach(() => {
  buildDirectory = fs.mkdtempSync(path.join(os.tmpdir(), 'lowdefy-config-text-'));
  fs.mkdirSync(path.join(buildDirectory, 'pages'));
});
afterEach(() => {
  fs.rmSync(buildDirectory, { recursive: true, force: true });
});

function writeArtifact(name, value) {
  fs.writeFileSync(path.join(buildDirectory, name), JSON.stringify(value));
}

const homePage = {
  id: 'home',
  type: 'Box',
  '~k': 'k:1',
  blocks: [
    {
      id: 'assign_button',
      type: 'Button',
      properties: { title: '  Assign\n  to me ', size: 42 },
      '~r': 'r:1',
    },
    {
      id: 'status_title',
      type: 'Title',
      properties: {
        content: { _if: { test: { _state: 'open' }, then: 'Open items', else: 'Closed items' } },
      },
    },
  ],
};

test('collectConfigText collects page strings, both _if branches, menus and every locale', async () => {
  writeArtifact('pages/home.json', homePage);
  writeArtifact('menus.json', [
    {
      id: 'default',
      links: [{ id: 'home', type: 'MenuLink', properties: { title: 'Home page' } }],
    },
  ]);
  writeArtifact('i18n.json', {
    defaultLocale: 'en-US',
    locales: [
      { code: 'en-US', label: 'English', antd: 'en_US' },
      { code: 'de-DE', label: 'Deutsch', antd: 'de_DE' },
    ],
    messages: { 'en-US': { save: 'Save' }, 'de-DE': { save: 'Speichern' } },
  });
  const texts = await collectConfigText({
    buildDirectory,
    messagesMap: {
      '@acme/blocks': { 'en-US': { clear: 'Clear all' }, 'fr-FR': { clear: 'Tout effacer' } },
    },
  });
  expect(texts).toEqual(expect.arrayContaining(['Assign to me', 'Open items', 'Closed items']));
  expect(texts).toEqual(expect.arrayContaining(['Home page', 'Save', 'Speichern', 'Deutsch']));
  expect(texts).toEqual(expect.arrayContaining(['Clear all', 'Tout effacer']));
  expect(texts).toEqual([...texts].sort());
  expect(new Set(texts).size).toEqual(texts.length);
});

test('collectConfigText leaves out numbers, build markers and empty strings', async () => {
  writeArtifact('pages/home.json', { ...homePage, empty: '   ' });
  writeArtifact('menus.json', []);
  writeArtifact('i18n.json', {});
  const texts = await collectConfigText({ buildDirectory, messagesMap: {} });
  expect(texts).not.toContain('42');
  expect(texts).not.toContain('k:1');
  expect(texts).not.toContain('r:1');
  expect(texts).not.toContain('');
});

test("collectConfigText adds antd's en_US strings for an app with no i18n", async () => {
  writeArtifact('pages/home.json', homePage);
  writeArtifact('menus.json', []);
  writeArtifact('i18n.json', {});
  const texts = await collectConfigText({ buildDirectory, messagesMap: {} });
  expect(texts).toEqual(expect.arrayContaining(['OK', 'Cancel', 'Next Page']));
});

test("collectConfigText adds antd's strings for each declared locale's antd name", async () => {
  writeArtifact('pages/home.json', homePage);
  writeArtifact('menus.json', []);
  writeArtifact('i18n.json', {
    defaultLocale: 'de-DE',
    locales: [{ code: 'de-DE', antd: 'de_DE' }],
    messages: { 'de-DE': { save: 'Speichern' } },
  });
  const texts = await collectConfigText({ buildDirectory, messagesMap: {} });
  expect(texts).toContain('Abbrechen');
  expect(texts).not.toContain('Next Page');
});
