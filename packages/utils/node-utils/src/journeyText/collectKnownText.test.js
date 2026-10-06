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

import fs from 'fs';
import os from 'os';
import path from 'path';

import parseDataSet from '../parseDataSet.js';
import collectKnownText from './collectKnownText.js';

let configDirectory;
let buildDirectory;

function writeJson(file, value) {
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, JSON.stringify(value));
}

beforeEach(() => {
  configDirectory = fs.mkdtempSync(path.join(os.tmpdir(), 'lowdefy-known-text-'));
  buildDirectory = path.join(configDirectory, '.lowdefy', 'explore', 'builds', 'head', 'build');
  writeJson(path.join(buildDirectory, 'pages', 'tickets.json'), {
    id: 'page:tickets',
    type: 'Box',
    pageId: 'tickets',
    '~k': 'x1',
    slots: {
      content: {
        blocks: {
          '~arr': [
            {
              id: 'block:tickets:assign_button:0',
              blockId: 'assign_button',
              type: 'Button',
              properties: { title: '  Assign ticket ', span: 12, '~k': 'x3' },
              '~k': 'x2',
              '~r': 'r7',
            },
          ],
          '~k': 'x4',
        },
      },
    },
  });
  writeJson(path.join(buildDirectory, 'pages', 'settings.json'), {
    id: 'page:settings',
    properties: { title: 'Billing settings' },
  });
  writeJson(path.join(buildDirectory, 'menus.json'), {
    '~arr': [
      {
        menuId: 'default',
        links: { '~arr': [{ pageId: 'tickets', properties: { title: 'Support queue' } }] },
      },
    ],
  });
  writeJson(path.join(buildDirectory, 'i18n.json'), {
    defaultLocale: 'en-US',
    locales: [{ code: 'en-US' }, { code: 'af' }],
    messages: {
      'en-US': { 'tickets.empty': 'No open tickets', nested: { save: 'Save changes' } },
      af: { 'tickets.empty': 'Geen oop kaartjies nie' },
    },
  });
  fs.mkdirSync(path.join(configDirectory, 'tests', 'data'), { recursive: true });
  fs.writeFileSync(
    path.join(configDirectory, 'tests', 'data', 'staging-sample.yaml'),
    [
      'fixtures:',
      '  tickets:',
      '    - _id: t-1',
      '      title: Printer on fire',
      '      count: 42',
      'users:',
      '  member:',
      '    id: u_member',
      '    name: Grace Hopper',
      '    roles: [member]',
      '',
    ].join('\n')
  );
});

afterEach(() => {
  fs.rmSync(configDirectory, { recursive: true, force: true });
});

test('collectKnownText holds page, menu, default-locale, fixture, user and typed text', async () => {
  const dataSet = await parseDataSet({ configDirectory, name: 'staging-sample' });
  const known = collectKnownText({
    buildDirectory,
    pageIds: ['tickets'],
    dataSet,
    typed: ['Explorer title 2'],
  });

  ['Assign ticket', 'assign_button', 'Button', 'tickets', '12'].forEach((text) =>
    expect(known.has(text)).toBe(true)
  );
  expect(known.has('Support queue')).toBe(true);
  expect(known.has('No open tickets')).toBe(true);
  expect(known.has('Save changes')).toBe(true);
  expect(known.has('Printer on fire')).toBe(true);
  expect(known.has('42')).toBe(true);
  expect(known.has('Grace Hopper')).toBe(true);
  expect(known.has('u_member')).toBe(true);
  expect(known.has('Explorer title 2')).toBe(true);
  expect(known.has(' Grace Hopper ')).toBe(true);
});

test('collectKnownText leaves out other locales, markers and unlisted pages', async () => {
  const dataSet = await parseDataSet({ configDirectory, name: 'staging-sample' });
  const known = collectKnownText({ buildDirectory, pageIds: ['tickets'], dataSet });

  expect(known.has('Geen oop kaartjies nie')).toBe(false);
  expect(known.has('x2')).toBe(false);
  expect(known.has('r7')).toBe(false);
  expect(known.has('Billing settings')).toBe(false);
  expect(known.has('staging')).toBe(false);
});

test('collectKnownText finds the longest known value inside a longer text', () => {
  const known = collectKnownText({
    buildDirectory,
    pageIds: ['tickets'],
    typed: ['Grace', 'Grace Hopper', 'ab'],
  });
  expect(known.findIn('Grace Hopper  Open  2026-09-30')).toEqual('Grace Hopper');
  expect(known.findIn('ab cd')).toBeNull();
  expect(known.findIn('Jane Staging  Open')).toBeNull();
  expect(known.findIn(null)).toBeNull();
});

test('collectKnownText works without a data set and without i18n', () => {
  writeJson(path.join(buildDirectory, 'i18n.json'), {});
  const known = collectKnownText({ buildDirectory, pageIds: ['settings'] });
  expect(known.has('Billing settings')).toBe(true);
  expect(known.has('Support queue')).toBe(true);
  expect(known.has('No open tickets')).toBe(false);
  expect(Object.isFrozen(known)).toBe(true);
});

test('collectKnownText throws for a page with no build artifact', () => {
  expect(() => collectKnownText({ buildDirectory, pageIds: ['missing'] })).toThrow(
    `Build artifact ${path.join('pages', 'missing.json')} not found in ${buildDirectory}.`
  );
});
