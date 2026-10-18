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
  renderPage,
  screen,
  styleOf,
  theme,
} from '../../test/renderPage.js';

test('an Empty shows the empty tray and its description, with the block id as testID', async () => {
  await renderPage({ pageConfig: page([{ id: 'none', type: 'Empty' }]) });
  expect(await screen.findByText('No data')).toBeTruthy();
  const block = screen.getByTestId('none');
  const [svg] = findAllOfType(block, 'RNSVGSvgView');
  expect(svg.props.bbHeight).toBe(100);
  expect(styleOf(screen.getByText('No data')).color).toBe(theme.light.colorTextDescription);
});

test('an Empty takes a description, the simple image or an icon, and a footer slot', async () => {
  await renderPage({
    pageConfig: page([
      {
        id: 'small',
        type: 'Empty',
        properties: { description: 'No orders yet', image: 'simple' },
        slots: {
          footer: { blocks: [{ id: 'create', type: 'Box', properties: { content: 'Create' } }] },
        },
      },
      { id: 'iconic', type: 'Empty', properties: { description: '', icon: 'Inbox' } },
    ]),
  });
  expect(await screen.findByText('No orders yet')).toBeTruthy();
  expect(screen.getByText('Create')).toBeTruthy();
  const [svg] = findAllOfType(screen.getByTestId('small'), 'RNSVGSvgView');
  expect(svg.props.bbHeight).toBe(40);
  // react-native-svg draws a polyline as a path too.
  expect(iconPaths(screen.getByTestId('iconic_icon'))).toHaveLength(icons.Inbox.node.length);
  expect(screen.queryByText('No data')).toBeNull();
});

test('an Empty takes the dark colours in dark mode, and is not drawn when not visible', async () => {
  await renderPage({
    darkMode: 'dark',
    pageConfig: page([
      { id: 'none', type: 'Empty' },
      { id: 'hidden', type: 'Empty', visible: false },
    ]),
  });
  expect(styleOf(await screen.findByText('No data')).color).toBe(theme.dark.colorTextDescription);
  expect(screen.queryByTestId('hidden')).toBeNull();
});
