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

import layoutStyles from './layoutStyles.js';

test('layoutStyles lays a block out full width in a wrapping row by default', () => {
  expect(layoutStyles()).toEqual({
    container: { flexDirection: 'row', flexWrap: 'wrap' },
    child: { width: '100%' },
  });
});

test('layoutStyles gives a span a share of 24 columns and an offset as a left margin', () => {
  expect(layoutStyles({ span: 12 }).child).toEqual({ width: '50%' });
  expect(layoutStyles({ span: 6, offset: 6 }).child).toEqual({ marginLeft: '25%', width: '25%' });
  expect(layoutStyles({ offset: 8 }).child.width).toBe(`${(16 / 24) * 100}%`);
});

test('layoutStyles hides a block with span 0', () => {
  expect(layoutStyles({ span: 0 }).child).toEqual({ display: 'none' });
});

test('layoutStyles applies breakpoint layouts at and below the current breakpoint', () => {
  const layout = { span: 24, sm: { span: 12 }, lg: { span: 6 } };
  expect(layoutStyles(layout, 'xs').child.width).toBe('100%');
  expect(layoutStyles(layout, 'md').child.width).toBe('50%');
  expect(layoutStyles(layout, '2xl').child.width).toBe('25%');
});

test('layoutStyles turns grow, shrink and size into flex values', () => {
  expect(layoutStyles({ grow: true, size: 120 }).child).toEqual({
    flexBasis: 120,
    flexGrow: 1,
    flexShrink: 1,
  });
  expect(layoutStyles({ shrink: false }).child).toEqual({
    flexBasis: 'auto',
    flexGrow: 0,
    flexShrink: 0,
  });
  expect(layoutStyles({ flex: 2 }).child).toEqual({ flex: 2 });
  expect(layoutStyles({ flex: true }).child).toEqual({
    flexBasis: 'auto',
    flexGrow: 0,
    flexShrink: 1,
  });
});

test('layoutStyles maps order and selfAlign onto the child', () => {
  expect(layoutStyles({ order: 2, selfAlign: 'middle' }).child).toEqual({
    alignSelf: 'center',
    order: 2,
    width: '100%',
  });
});

test('layoutStyles lays an area out by direction, wrap, align, justify and gap', () => {
  expect(
    layoutStyles({
      align: 'middle',
      direction: 'column',
      gap: [8, 16],
      justify: 'space-between',
      wrap: 'nowrap',
    }).container
  ).toEqual({
    alignItems: 'center',
    columnGap: 8,
    flexDirection: 'column',
    flexWrap: 'nowrap',
    justifyContent: 'space-between',
    rowGap: 16,
  });
});

test('layoutStyles resolves a gap set per breakpoint', () => {
  const layout = { gap: { xs: 4, md: 12 } };
  expect(layoutStyles(layout, 'sm').container).toMatchObject({ columnGap: 4, rowGap: 4 });
  expect(layoutStyles(layout, 'xl').container).toMatchObject({ columnGap: 12, rowGap: 12 });
  expect(layoutStyles({ gap: [{ xs: 2, lg: 6 }, 10] }, 'lg').container).toMatchObject({
    columnGap: 6,
    rowGap: 10,
  });
});
