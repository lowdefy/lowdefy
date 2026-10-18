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

import { page, renderPage, screen, styleOf, theme } from '../../test/renderPage.js';

test('a Skeleton is a pulsing placeholder of the given size', async () => {
  await renderPage({
    pageConfig: page([
      { id: 'bar', type: 'Skeleton', properties: { height: '20px', width: '50%' } },
    ]),
  });
  const shape = await screen.findByTestId('bar_skeleton');
  expect(styleOf(shape)).toMatchObject({
    backgroundColor: theme.light.colorFillContent,
    borderRadius: theme.light.borderRadiusSM,
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
    theme.dark.colorFillContent
  );
  expect(screen.queryByTestId('hidden')).toBeNull();
});
