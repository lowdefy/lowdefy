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

const files = {
  'ai.json': { AiOutlineUser: { node: [['path', { d: 'user' }]], size: 1024 } },
  'fa.json': { FaWhatsapp: { node: [['path', { d: 'whatsapp' }]], width: 448, height: 512 } },
  'fa6.json': { FaXTwitter: { node: [['path', { d: 'x' }]], size: 512 } },
  'lu.json': { LuPencil: { node: [['path', { d: 'pencil' }]] } },
  'names.json': ['AiOutlineUser', 'FaWhatsapp', 'FaXTwitter', 'LuPencil'],
};

const readFile = jest.fn(async (url) => {
  const fileName = url.pathname.split('/').pop();
  if (!files[fileName]) throw new Error(`ENOENT: ${fileName}`);
  return JSON.stringify(files[fileName]);
});

jest.unstable_mockModule('fs/promises', () => ({ readFile }));

const { default: createIconSet } = await import('./createIconSet.js');

const dataDirectory = new URL('file:///icons/data/');

function readFileNames() {
  return readFile.mock.calls.map(([url]) => url.pathname.split('/').pop());
}

test('loadIcons returns only the requested names and reads only their packs', async () => {
  const iconSet = createIconSet({ dataDirectory });
  const icons = await iconSet.loadIcons({ names: ['AiOutlineUser', 'LuPencil'] });
  expect(icons).toEqual({
    AiOutlineUser: { node: [['path', { d: 'user' }]], size: 1024 },
    LuPencil: { node: [['path', { d: 'pencil' }]] },
  });
  expect(readFileNames()).toEqual(['ai.json', 'lu.json']);
});

test('loadIcons reads a shared-prefix pack only when the earlier pack lacks the name', async () => {
  const iconSet = createIconSet({ dataDirectory });
  expect(await iconSet.loadIcons({ names: ['FaWhatsapp'] })).toEqual({
    FaWhatsapp: files['fa.json'].FaWhatsapp,
  });
  expect(readFileNames()).toEqual(['fa.json']);
  expect(await iconSet.loadIcons({ names: ['FaXTwitter'] })).toEqual({
    FaXTwitter: files['fa6.json'].FaXTwitter,
  });
  expect(readFileNames()).toEqual(['fa.json', 'fa6.json']);
});

test('loadIcons leaves out names the set does not have', async () => {
  const iconSet = createIconSet({ dataDirectory });
  const icons = await iconSet.loadIcons({
    names: ['AiOutlineMissing', 'Pencil', 'edit', 'AiOutlineUser'],
  });
  expect(Object.keys(icons)).toEqual(['AiOutlineUser']);
  expect(readFileNames()).toEqual(['ai.json']);
});

test('loadIcons reads each pack once and returns copies', async () => {
  const iconSet = createIconSet({ dataDirectory });
  const first = await iconSet.loadIcons({ names: ['AiOutlineUser'] });
  first.AiOutlineUser.node.push(['path', { d: 'changed' }]);
  const second = await iconSet.loadIcons({ names: ['AiOutlineUser'] });
  expect(second.AiOutlineUser.node).toHaveLength(1);
  expect(readFileNames()).toEqual(['ai.json']);
});

test('listIcons returns every name without reading any pack', async () => {
  const iconSet = createIconSet({ dataDirectory });
  expect(await iconSet.listIcons()).toEqual(files['names.json']);
  expect(readFileNames()).toEqual(['names.json']);
});
