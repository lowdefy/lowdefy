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

import {
  findAllOfType,
  iconPaths,
  icons,
  page,
  press,
  record,
  renderPage,
  screen,
  styleOf,
  theme,
} from '../../test/renderPage.js';

const housePaths = icons.House.node.map(([, attrs]) => attrs.d);

test('an Icon draws its icon data with react-native-svg, labelled with its title', async () => {
  await renderPage({
    pageConfig: page([{ id: 'house', type: 'Icon', properties: { name: 'House', size: 20 } }]),
  });
  const block = await screen.findByTestId('house');
  expect(iconPaths(block)).toEqual(housePaths);
  const image = screen.getByRole('image');
  expect(image.props.accessibilityLabel).toBe('House');
  expect(styleOf(image)).toMatchObject({ height: 20, width: 20 });
  const [svg] = findAllOfType(block, 'RNSVGSvgView');
  expect(svg.props).toMatchObject({ bbHeight: 20, bbWidth: 20, vbHeight: 24, vbWidth: 24 });
});

test('an Icon takes its colour, rotation, stroke width and title from its properties', async () => {
  await renderPage({
    pageConfig: page([
      {
        id: 'house',
        type: 'Icon',
        properties: { name: 'House', color: '#ff0000', rotate: 90, strokeWidth: 3, title: 'Home' },
      },
    ]),
  });
  const block = await screen.findByTestId('house');
  const image = screen.getByLabelText('Home');
  expect(styleOf(image).transform).toEqual([{ rotate: '90deg' }]);
  const [group] = findAllOfType(block, 'RNSVGGroup');
  expect(group.props.strokeWidth).toBe(3);
  const [svg] = findAllOfType(block, 'RNSVGSvgView');
  expect(svg.props.color).toBe('#ff0000');
});

test('an Icon is the theme text size and colour by default, and dark in dark mode', async () => {
  await renderPage({
    darkMode: 'dark',
    pageConfig: page([{ id: 'house', type: 'Icon', properties: { name: 'House' } }]),
  });
  const block = await screen.findByTestId('house');
  expect(styleOf(screen.getByRole('image')).width).toBe(theme.dark.fontSize);
  const [svg] = findAllOfType(block, 'RNSVGSvgView');
  expect(svg.props.color).toBe(theme.dark.colorText);
});

test('an unknown icon name draws the missing icon in red', async () => {
  await renderPage({
    pageConfig: page([{ id: 'nope', type: 'Icon', properties: { name: 'NoSuchIcon' } }]),
  });
  const block = await screen.findByTestId('nope');
  expect(iconPaths(block)).toEqual(
    icons['icon-missing'].node.filter(([tag]) => tag === 'path').map(([, attrs]) => attrs.d)
  );
  const [svg] = findAllOfType(block, 'RNSVGSvgView');
  expect(svg.props.color).toBe('#F00');
});

test('an Icon with onClick is a button that fires onClick', async () => {
  const { calls } = await renderPage({
    pageConfig: page([
      {
        id: 'house',
        type: 'Icon',
        properties: { name: 'House', title: 'Go home' },
        events: { onClick: record('click') },
      },
    ]),
  });
  const button = await screen.findByRole('button');
  expect(button.props.accessibilityLabel).toBe('Go home');
  await press(button);
  expect(calls.map((call) => call.name)).toEqual(['click']);
});

test('a spinning Icon draws the loading icon, and an Icon not visible is not drawn', async () => {
  await renderPage({
    pageConfig: page([
      { id: 'busy', type: 'Icon', properties: { name: 'House', spin: true } },
      { id: 'hidden', type: 'Icon', visible: false, properties: { name: 'House' } },
    ]),
  });
  const block = await screen.findByTestId('busy');
  expect(iconPaths(block)).toEqual(icons.loading.node.map(([, attrs]) => attrs.d));
  expect(screen.queryByTestId('hidden')).toBeNull();
});
