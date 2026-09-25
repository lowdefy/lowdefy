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
import path from 'path';
import { createRequire } from 'module';

import convertGenIcon from './convertGenIcon.js';
import iconPacks from './iconPacks.js';
import parseGenIconSource from './parseGenIconSource.js';

const require = createRequire(import.meta.url);
const reactIconsDirectory = path.dirname(require.resolve('react-icons'));

function readPack(pack) {
  return fs.readFileSync(path.join(reactIconsDirectory, pack, 'index.mjs'), 'utf8');
}

function declaredNames(pack) {
  const declarations = fs.readFileSync(path.join(reactIconsDirectory, pack, 'index.d.ts'), 'utf8');
  return [...declarations.matchAll(/export declare const (\w+): IconType;/g)].map(
    ([, name]) => name
  );
}

test('parseGenIconSource parses every icon of every react-icons pack under its exported name', () => {
  let total = 0;
  const unique = new Set();
  iconPacks.forEach(({ pack }) => {
    const trees = parseGenIconSource({ source: readPack(pack) });
    expect(Object.keys(trees).sort()).toEqual(declaredNames(pack).sort());
    Object.entries(trees).forEach(([name, tree]) => {
      expect(tree.tag).toBe('svg');
      const iconData = convertGenIcon({ tree, defaultViewBox: '0 0 24 24' });
      expect(Array.isArray(iconData.node)).toBe(true);
      expect(iconData.attrs?.strokeWidth).toBeUndefined();
      unique.add(name);
    });
    total += Object.keys(trees).length;
  });
  expect(total).toBe(50389);
  expect(unique.size).toBe(48958);
});

test('iconPacks lists every react-icons pack', () => {
  const installed = fs
    .readdirSync(reactIconsDirectory)
    .filter(
      (entry) =>
        entry !== 'lib' && fs.existsSync(path.join(reactIconsDirectory, entry, 'index.mjs'))
    );
  expect(iconPacks.map(({ pack }) => pack).sort()).toEqual(installed.sort());
});

test('parseGenIconSource returns an empty object for a source without icons', () => {
  expect(parseGenIconSource({ source: '// nothing here' })).toEqual({});
});
