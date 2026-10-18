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

const pathsOf = (name) => icons[name].node.filter(([tag]) => tag === 'path').map(([, a]) => a.d);

test('an Alert shows its message in its type colours with the type icon', async () => {
  await renderPage({
    pageConfig: page([
      { id: 'saved', type: 'Alert', properties: { message: 'Saved', type: 'success' } },
    ]),
  });
  expect(await screen.findByText('Saved')).toBeTruthy();
  // The alert is the view inside the block's placement.
  const alert = screen.getByTestId('saved').children[0];
  expect(alert.props.accessibilityRole).toBe('alert');
  expect(styleOf(alert)).toMatchObject({
    backgroundColor: theme.light.colorSuccessBg,
    borderColor: theme.light.colorSuccessBorder,
    borderRadius: theme.light.borderRadiusLG,
    paddingTop: 8,
    paddingLeft: 12,
  });
  expect(iconPaths(screen.getByTestId('saved_icon', { includeHiddenElements: true }))).toEqual(
    pathsOf('success')
  );
  expect(screen.getByTestId('saved')).toBeTruthy();
});

test('an Alert with a description uses the larger layout, and a banner warns by default', async () => {
  await renderPage({
    pageConfig: page([
      {
        id: 'notice',
        type: 'Alert',
        properties: { message: 'Heads up', description: 'Line <b>one</b>', showIcon: false },
      },
      { id: 'top', type: 'Alert', properties: { message: 'Banner', banner: true } },
    ]),
  });
  expect(styleOf(await screen.findByText('Heads up'))).toMatchObject({
    color: theme.light.colorTextHeading,
    fontSize: theme.light.fontSizeLG,
  });
  expect(screen.getByText('Line one')).toBeTruthy();
  expect(screen.queryByTestId('notice_icon')).toBeNull();
  const notice = screen.getByTestId('notice').children[0];
  const banner = screen.getByTestId('top').children[0];
  expect(styleOf(notice)).toMatchObject({ paddingTop: 20, paddingLeft: 24 });
  expect(styleOf(banner)).toMatchObject({
    backgroundColor: theme.light.colorWarningBg,
    borderRadius: 0,
    borderWidth: 0,
  });
});

test('a closable Alert fires onClose then afterClose, and is removed', async () => {
  const { calls } = await renderPage({
    pageConfig: page([
      {
        id: 'note',
        type: 'Alert',
        properties: { message: 'Dismiss me', closeText: 'Got it' },
        events: { onClose: record('close'), afterClose: record('after') },
      },
    ]),
  });
  await press(await screen.findByText('Got it'));
  expect(screen.queryByText('Dismiss me')).toBeNull();
  expect(calls.map((call) => call.name)).toEqual(['close', 'after']);
});

test('an Alert draws its action slot', async () => {
  await renderPage({
    pageConfig: page([
      {
        id: 'note',
        type: 'Alert',
        properties: { message: 'Update ready' },
        slots: {
          action: { blocks: [{ id: 'go', type: 'Box', properties: { content: 'Install' } }] },
        },
      },
    ]),
  });
  expect(await screen.findByText('Install')).toBeTruthy();
  expect(screen.getByTestId('go')).toBeTruthy();
});

test('an Alert takes the dark colours in dark mode, and is not drawn when not visible', async () => {
  await renderPage({
    darkMode: 'dark',
    pageConfig: page([
      { id: 'err', type: 'Alert', properties: { message: 'Failed', type: 'error' } },
      { id: 'hidden', type: 'Alert', visible: false, properties: { message: 'Hidden' } },
    ]),
  });
  await screen.findByText('Failed');
  expect(styleOf(screen.getByTestId('err').children[0]).backgroundColor).toBe(
    theme.dark.colorErrorBg
  );
  expect(screen.queryByTestId('hidden')).toBeNull();
});
