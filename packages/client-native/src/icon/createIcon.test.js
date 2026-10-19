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

import React from 'react';
import { StyleSheet } from 'react-native';
import { render, screen } from '@testing-library/react-native';

import createIcon from './createIcon.js';
import ThemeContext from '../theme/ThemeContext.js';

const tokens = {
  'gold-6': '#faad14',
  colorLabel: '#000000',
  colorPrimary: '#6366f1',
  colorText: '#111111',
  colorTint: '#6366f1',
  fontSize: 14,
};

const icons = {
  House: { node: [['path', { d: 'M3 10v11h18V10' }]] },
  'icon-missing': { node: [['circle', { cx: 12, cy: 12, r: 10 }]] },
};

function findAll(node, predicate, found = []) {
  if (node === null || typeof node === 'string') return found;
  if (predicate(node)) found.push(node);
  (node.children ?? []).forEach((child) => findAll(child, predicate, found));
  return found;
}

async function renderIcon({ iconMap = icons, ...props }) {
  const Icon = createIcon({ icons: iconMap });
  await render(
    <ThemeContext.Provider value={{ isDark: false, preference: 'system', tokens }}>
      <Icon testID="icon" {...props} />
    </ThemeContext.Provider>
  );
  return screen.getByTestId('icon');
}

test('createIcon draws a named icon at the theme font size, labelled with its title', async () => {
  const icon = await renderIcon({ properties: 'House' });
  expect(icon.props.accessibilityLabel).toBe('House');
  expect(StyleSheet.flatten(icon.props.style)).toMatchObject({ height: 14, width: 14 });
  expect(findAll(icon, (node) => node.props?.d === 'M3 10v11h18V10')).not.toHaveLength(0);
});

test('an em size is relative to the element font size', async () => {
  const icon = await renderIcon({
    properties: { name: 'House', size: '2em' },
    styles: { element: { fontSize: 10 } },
  });
  expect(StyleSheet.flatten(icon.props.style)).toMatchObject({ height: 20, width: 20 });
});

test('an unknown name draws icon-missing, and nothing when the data has no icon-missing', async () => {
  const missing = await renderIcon({ properties: 'Nope' });
  expect(findAll(missing, (node) => node.props?.r === 10)).not.toHaveLength(0);
  const empty = await renderIcon({ iconMap: {}, properties: 'Nope' });
  expect(findAll(empty, (node) => node.props?.d !== undefined)).toHaveLength(0);
});

test('an icon with no colour draws in the label colour, a colour property over it', async () => {
  const label = await renderIcon({ properties: 'House' });
  expect(findAll(label, (node) => node.props?.color === '#000000')).not.toHaveLength(0);
  const coloured = await renderIcon({ properties: { name: 'House', color: '#ff0000' } });
  expect(findAll(coloured, (node) => node.props?.color === '#ff0000')).not.toHaveLength(0);
});

test('an icon colour resolves through the theme: a palette hue, a token or a hex', async () => {
  const hue = await renderIcon({ properties: { name: 'House', color: 'amber' } });
  expect(findAll(hue, (node) => node.props?.color === '#faad14')).not.toHaveLength(0);
  const token = await renderIcon({ properties: { name: 'House', color: 'colorPrimary' } });
  expect(findAll(token, (node) => node.props?.color === '#6366f1')).not.toHaveLength(0);
  const tint = await renderIcon({ properties: { name: 'House', color: 'colorTint' } });
  expect(findAll(tint, (node) => node.props?.color === '#6366f1')).not.toHaveLength(0);
});
