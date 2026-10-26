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

import { iconPaths, icons, ios, page, renderPage, screen, styleOf } from '../../test/renderPage.js';

test('an Empty shows the inbox icon and "No data", with the block id as testID', async () => {
  await renderPage({ pageConfig: page([{ id: 'none', type: 'Empty' }]) });
  expect(await screen.findByText('No data')).toBeTruthy();
  const icon = screen.getByTestId('none_icon', { includeHiddenElements: true });
  expect(iconPaths(icon)).toHaveLength(icons.Inbox.node.length);
  expect(styleOf(icon)).toMatchObject({ height: 48, width: 48 });
  expect(styleOf(screen.getByText('No data'))).toMatchObject({
    color: ios.light.colorSecondaryLabel,
    fontSize: 17,
  });
});

test('an Empty is a content unavailable view: icon, title, description and footer', async () => {
  await renderPage({
    pageConfig: page([
      {
        id: 'done',
        type: 'Empty',
        properties: {
          icon: 'House',
          title: "You're all caught up",
          description: 'Nothing needs you.',
        },
        slots: {
          footer: { blocks: [{ id: 'create', type: 'Box', properties: { content: 'Create' } }] },
        },
      },
      { id: 'titled', type: 'Empty', properties: { title: 'No tasks' } },
      { id: 'small', type: 'Empty', properties: { description: '', image: 'simple' } },
    ]),
  });
  const title = await screen.findByText("You're all caught up");
  expect(title.props.accessibilityRole).toBe('header');
  expect(styleOf(title)).toMatchObject({ color: ios.light.colorLabel, fontSize: 22 });
  expect(screen.getByText('Nothing needs you.')).toBeTruthy();
  expect(screen.getByText('Create')).toBeTruthy();
  expect(iconPaths(screen.getByTestId('done_icon', { includeHiddenElements: true }))).toHaveLength(
    icons.House.node.length
  );
  // A titled Empty has no default description; an empty description shows the icon alone.
  expect(screen.getByText('No tasks')).toBeTruthy();
  expect(screen.queryByText('No data')).toBeNull();
  expect(styleOf(screen.getByTestId('small_icon', { includeHiddenElements: true }))).toMatchObject({
    height: 32,
  });
});

test('an Empty takes the dark colours in dark mode, and is not drawn when not visible', async () => {
  await renderPage({
    darkMode: 'dark',
    pageConfig: page([
      { id: 'none', type: 'Empty' },
      { id: 'hidden', type: 'Empty', visible: false },
    ]),
  });
  expect(styleOf(await screen.findByText('No data')).color).toBe(ios.dark.colorSecondaryLabel);
  expect(screen.queryByTestId('hidden')).toBeNull();
});
