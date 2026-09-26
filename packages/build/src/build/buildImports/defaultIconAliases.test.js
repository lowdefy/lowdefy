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

import { icons } from 'lucide';

import defaultIconAliases from './defaultIconAliases.js';
import getLucideIconNames from '../icons/getLucideIconNames.js';
import { semanticNamePattern } from '../icons/iconNamePatterns.js';

// Lucide renames icons and keeps the old name as an alias (Trash2 -> Trash,
// Filter -> Funnel). Built-in targets are canonical so the map names the icons
// Lucide documents, and an alias removal in a Lucide upgrade cannot break one.
// Canonical names come from lucide's type declarations, which declare each
// icon once and export aliases as renames (getLucideIconNames).
test('every built-in semantic name targets a canonical Lucide name', () => {
  const canonical = new Set(getLucideIconNames().canonical);
  const notCanonical = Object.entries(defaultIconAliases).filter(
    ([, target]) => !canonical.has(target)
  );
  expect(notCanonical).toEqual([]);
});

test('every built-in semantic name is lowercase kebab-case', () => {
  const invalid = Object.keys(defaultIconAliases).filter((name) => !semanticNamePattern.test(name));
  expect(invalid).toEqual([]);
});

test('the built-in semantic map holds the names blocks and antd chrome render', () => {
  expect(defaultIconAliases).toMatchObject({
    delete: 'Trash',
    filter: 'Funnel',
    help: 'CircleQuestionMark',
    history: 'RotateCcwClock',
    'icon-missing': 'CircleAlert',
    loading: 'LoaderCircle',
    'sidebar-collapse': 'PanelLeftClose',
    'rating-low': 'FaceSlightlyFrowning',
  });
});

test('getLucideIconNames splits lucide names into canonical names and aliases', () => {
  const { canonical, aliases } = getLucideIconNames();
  expect(canonical).toContain('House');
  expect(canonical).not.toContain('Home');
  expect(aliases).toContain('Home');
  expect(aliases).not.toContain('House');
  expect(canonical.length + aliases.length).toBe(Object.keys(icons).length);
  // An alias shares its canonical icon's node array.
  expect(icons.Home).toBe(icons.House);
});

test('lucide icon nodes already use React attribute names', () => {
  const attributeNames = new Set();
  new Set(Object.values(icons)).forEach((node) => {
    node.forEach(([, attrs]) => Object.keys(attrs).forEach((name) => attributeNames.add(name)));
  });
  expect([...attributeNames].filter((name) => /[^a-zA-Z0-9]/.test(name))).toEqual([]);
});
