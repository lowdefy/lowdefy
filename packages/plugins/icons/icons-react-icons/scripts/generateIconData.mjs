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

// Converts every react-icons icon to Lowdefy IconData, one JSON file per pack in dist/data.
// Runs after swc in the package build, so it uses the compiled converters in dist.

import fs from 'fs';
import path from 'path';
import { createRequire } from 'module';

import convertGenIcon from '../dist/convertGenIcon.js';
import iconPacks from '../dist/iconPacks.js';
import parseGenIconSource from '../dist/parseGenIconSource.js';

const require = createRequire(import.meta.url);
const reactIconsDirectory = path.dirname(require.resolve('react-icons'));
const dataDirectory = new URL('../dist/data/', import.meta.url);

function mostCommonViewBox(trees) {
  const counts = {};
  Object.values(trees).forEach((tree) => {
    if (tree.attr.viewBox) counts[tree.attr.viewBox] = (counts[tree.attr.viewBox] ?? 0) + 1;
  });
  return Object.keys(counts).sort((a, b) => counts[b] - counts[a])[0];
}

const installedPacks = fs
  .readdirSync(reactIconsDirectory)
  .filter(
    (entry) => entry !== 'lib' && fs.existsSync(path.join(reactIconsDirectory, entry, 'index.mjs'))
  );
const unknownPacks = installedPacks.filter((pack) => !iconPacks.some((p) => p.pack === pack));
if (unknownPacks.length > 0) {
  throw new Error(`react-icons packs missing from src/iconPacks.js: ${unknownPacks.join(', ')}.`);
}

fs.mkdirSync(dataDirectory, { recursive: true });

const names = [];
const claimed = new Set();
let converted = 0;
for (const { pack } of iconPacks) {
  const source = fs.readFileSync(path.join(reactIconsDirectory, pack, 'index.mjs'), 'utf8');
  const trees = parseGenIconSource({ source });
  // A few icons (vsc) have no viewBox; react-icons then draws them in their pack's grid.
  const defaultViewBox = mostCommonViewBox(trees);
  const icons = {};
  Object.entries(trees).forEach(([name, tree]) => {
    converted += 1;
    if (claimed.has(name)) return;
    claimed.add(name);
    names.push(name);
    icons[name] = convertGenIcon({ tree, defaultViewBox });
  });
  fs.writeFileSync(new URL(`${pack}.json`, dataDirectory), JSON.stringify(icons));
}
fs.writeFileSync(new URL('names.json', dataDirectory), JSON.stringify(names));

console.log(
  `Converted ${converted} react-icons icons from ${iconPacks.length} packs (${names.length} unique names).`
);
