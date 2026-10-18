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

import { ios, page, renderPage, screen, styleOf, theme } from '../../test/renderPage.js';

test('a Skeleton is a shimmering placeholder of the given size', async () => {
  await renderPage({
    pageConfig: page([
      { id: 'bar', type: 'Skeleton', properties: { height: '20px', width: '50%' } },
    ]),
  });
  const shape = await screen.findByTestId('bar_skeleton');
  expect(styleOf(shape)).toMatchObject({
    backgroundColor: ios.light.colorTertiarySystemFill,
    borderRadius: 4,
    height: 20,
    width: '50%',
  });
  expect(shape.props.accessibilityState).toEqual({ busy: true });
  expect(screen.getByTestId('bar')).toBeTruthy();
});

test('a loading block with a Skeleton skeleton draws the native Skeleton in its place', async () => {
  await renderPage({
    pageConfig: page([
      {
        id: 'late',
        type: 'Paragraph',
        loading: true,
        skeleton: { type: 'Skeleton', properties: { height: 32 } },
        properties: { content: 'Arrived' },
      },
    ]),
  });
  const shape = await screen.findByTestId('late_skeleton');
  expect(styleOf(shape).height).toBe(32);
  expect(screen.queryByText('Arrived')).toBeNull();
});

test('a Skeleton takes the dark fill colour in dark mode, and is not drawn when not visible', async () => {
  await renderPage({
    darkMode: 'dark',
    pageConfig: page([
      { id: 'bar', type: 'Skeleton', properties: { height: 10 } },
      { id: 'hidden', type: 'Skeleton', visible: false },
    ]),
  });
  expect(styleOf(await screen.findByTestId('bar_skeleton')).backgroundColor).toBe(
    ios.dark.colorTertiarySystemFill
  );
  expect(screen.queryByTestId('hidden')).toBeNull();
});

test('a Skeleton with count draws loading rows of an avatar and its lines', async () => {
  await renderPage({
    pageConfig: page([
      { id: 'rows', type: 'Skeleton', properties: { count: 2 } },
      { id: 'lines', type: 'Skeleton', properties: { avatar: false, rows: 3 } },
    ]),
  });
  await screen.findByTestId('rows_row_1');
  // Two rows of an avatar and two lines; three rows (the default count) of three lines.
  expect(screen.queryByTestId('rows_row_2')).toBeNull();
  expect(screen.getByTestId('lines_row_2')).toBeTruthy();
  expect(screen.getAllByRole('progressbar')).toHaveLength(2 * 3 + 3 * 3);
});
