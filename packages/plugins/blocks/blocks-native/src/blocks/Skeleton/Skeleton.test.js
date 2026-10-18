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

import { ios, page, renderPage, screen, styleOf } from '../../test/renderPage.js';

test('a Skeleton is a shimmering placeholder of the given size', async () => {
  await renderPage({
    pageConfig: page([
      { id: 'bar', type: 'Skeleton', properties: { height: '20px', width: '50%' } },
    ]),
  });
  const shape = await screen.findByTestId('bar_skeleton');
  expect(styleOf(shape)).toMatchObject({
    backgroundColor: ios.light.colorSkeleton,
    borderRadius: 4,
    height: 20,
    width: '50%',
  });
  expect(shape.props.accessibilityState).toEqual({ busy: true });
  expect(screen.getByTestId('bar_skeleton_shimmer')).toBeTruthy();
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
    ios.dark.colorSkeleton
  );
  expect(screen.queryByTestId('hidden')).toBeNull();
});

test('a Skeleton with count draws loading list rows, one progress bar to a screen reader', async () => {
  await renderPage({
    pageConfig: page([
      { id: 'rows', type: 'Skeleton', properties: { count: 2 } },
      { id: 'lines', type: 'Skeleton', properties: { avatar: false, rows: 3 } },
      { id: 'cells', type: 'Skeleton', properties: { variant: 'listRow', rows: 1 } },
    ]),
  });
  await screen.findByTestId('rows_row_1');
  expect(screen.queryByTestId('rows_row_2')).toBeNull();
  expect(screen.getByTestId('lines_row_2')).toBeTruthy();
  expect(styleOf(screen.getByTestId('rows_row_0')).paddingVertical).toBe(10);
  expect(styleOf(screen.getByTestId('cells_row_0')).paddingVertical).toBe(11);
  expect(screen.getAllByRole('progressbar')).toHaveLength(3);
  expect(screen.getByTestId('rows_skeleton').props.accessibilityLabel).toBe('Loading');
});

test('an insetGroup Skeleton draws a section of rows in a cell card for each count', async () => {
  await renderPage({
    pageConfig: page([
      {
        id: 'groups',
        type: 'Skeleton',
        properties: { variant: 'insetGroup', count: [2, 3], trailing: true },
      },
      { id: 'one', type: 'Skeleton', properties: { variant: 'insetGroup', header: false } },
    ]),
  });
  await screen.findByTestId('groups_section_1');
  expect(screen.queryByTestId('groups_section_2')).toBeNull();
  // Rows are numbered across the sections, so their bars vary on.
  expect(screen.getByTestId('groups_row_4')).toBeTruthy();
  expect(screen.queryByTestId('groups_row_5')).toBeNull();
  const card = screen.getByTestId('groups_group_0');
  expect(styleOf(card)).toMatchObject({
    backgroundColor: ios.light.colorCell,
    borderRadius: 10,
    marginHorizontal: 16,
  });
  expect(screen.getByTestId('one_row_3')).toBeTruthy();
  expect(screen.queryByTestId('one_section_1')).toBeNull();
});

test('hero, paragraph, card and timeline Skeletons draw their shapes', async () => {
  await renderPage({
    pageConfig: page([
      { id: 'hero', type: 'Skeleton', properties: { variant: 'hero' } },
      { id: 'text', type: 'Skeleton', properties: { variant: 'paragraph', lines: 5 } },
      { id: 'body', type: 'Skeleton', properties: { variant: 'card' } },
      { id: 'activity', type: 'Skeleton', properties: { variant: 'timeline', count: 4 } },
    ]),
  });
  expect(await screen.findByTestId('hero_hero')).toBeTruthy();
  expect(screen.getByTestId('text_paragraph').children).toHaveLength(5);
  expect(styleOf(screen.getByTestId('body_card')).backgroundColor).toBe(ios.light.colorCell);
  expect(screen.getByTestId('body_paragraph').children).toHaveLength(4);
  expect(screen.getByTestId('activity_entry_3')).toBeTruthy();
  expect(screen.queryByTestId('activity_entry_4')).toBeNull();
  expect(screen.getAllByRole('progressbar')).toHaveLength(4);
});
