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
    columnGap: 0,
  });
});

test('layoutStyles applies a top-level span from md, as grid.css does, and stacks below md', () => {
  expect(layoutStyles({ span: 12 }, 'md').child).toEqual({ width: '50%' });
  expect(layoutStyles({ span: 12 }, 'lg').child).toEqual({ width: '50%' });
  expect(layoutStyles({ span: 12 }, 'sm').child).toEqual({ width: '100%' });
  expect(layoutStyles({ span: 12 }, 'xs').child).toEqual({ width: '100%' });
});

test('layoutStyles applies an sm layout at sm and below, and xs over it at xs', () => {
  const layout = { span: 8, sm: { span: 12 } };
  expect(layoutStyles(layout, 'xs').child.width).toBe('50%');
  expect(layoutStyles(layout, 'sm').child.width).toBe('50%');
  expect(layoutStyles(layout, 'md').child.width).toBe(`${(8 / 24) * 100}%`);
  expect(layoutStyles({ ...layout, xs: { span: 24 } }, 'xs').child.width).toBe('100%');
  expect(layoutStyles({ ...layout, xs: { span: 24 } }, 'sm').child.width).toBe('50%');
});

test('layoutStyles applies lg, xl and 2xl layouts from their breakpoint up', () => {
  const layout = { span: 12, lg: { span: 8 }, '2xl': { span: 4 } };
  expect(layoutStyles(layout, 'md').child.width).toBe('50%');
  expect(layoutStyles(layout, 'xl').child.width).toBe(`${(8 / 24) * 100}%`);
  expect(layoutStyles(layout, '2xl').child.width).toBe(`${(4 / 24) * 100}%`);
});

test('layoutStyles merges an md layout over the top-level offset and order', () => {
  const layout = { span: 12, offset: 6, md: { span: 6 } };
  expect(layoutStyles(layout, 'md').child).toEqual({ marginLeft: '25%', width: '25%' });
});

test('layoutStyles gives an offset as a left margin, and a span left out fills the rest', () => {
  expect(layoutStyles({ span: 6, offset: 6 }, 'md').child).toEqual({
    marginLeft: '25%',
    width: '25%',
  });
  expect(layoutStyles({ offset: 8 }, 'md').child).toEqual({
    marginLeft: `${(8 / 24) * 100}%`,
    width: `${(16 / 24) * 100}%`,
  });
});

test('layoutStyles hides a block whose span is 0 at the breakpoint', () => {
  expect(layoutStyles({ span: 0 }, 'md').child).toEqual({ display: 'none' });
  expect(layoutStyles({ span: 0 }, 'xs').child).toEqual({ width: '100%' });
  expect(layoutStyles({ sm: { span: 0 } }, 'xs').child).toEqual({ display: 'none' });
});

test('layoutStyles moves a pushed or pulled block by a share of the columns', () => {
  expect(layoutStyles({ span: 12, push: 6 }, 'md').child).toEqual({
    left: '25%',
    position: 'relative',
    width: '50%',
  });
  expect(layoutStyles({ span: 12, pull: 6 }, 'md').child).toEqual({
    position: 'relative',
    right: '25%',
    width: '50%',
  });
});

test('layoutStyles widens a gapped area by its column gap and pads its blocks by it', () => {
  // Two span 12 blocks in a 400 point area with a 16 point gap: the area is 416 wide from -16,
  // each block 208 wide with 16 padding, so their content is 0..192 and 208..400, as on the web.
  const area = layoutStyles({ gap: 16 }, 'md');
  expect(area.container).toEqual({
    alignSelf: 'stretch',
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginLeft: -16,
    rowGap: 16,
  });
  expect(area.columnGap).toBe(16);
  expect(layoutStyles({ span: 12 }, 'md', area.columnGap).child).toEqual({
    paddingLeft: 16,
    width: '50%',
  });
  expect(layoutStyles({ span: 12, offset: 6 }, 'md', 16).child).toEqual({
    marginLeft: '25%',
    paddingLeft: 16,
    width: '50%',
  });
});

test('layoutStyles resolves [x, y] gaps and gaps set per breakpoint, rounded to points', () => {
  expect(layoutStyles({ gap: [8, 24] }, 'xs').container).toMatchObject({
    marginLeft: -8,
    rowGap: 24,
  });
  const perBreakpoint = { gap: { xs: 4, md: 12.4 } };
  expect(layoutStyles(perBreakpoint, 'sm').columnGap).toBe(4);
  expect(layoutStyles(perBreakpoint, 'lg').columnGap).toBe(12);
  expect(layoutStyles({ gap: [{ lg: 6 }, 10] }, 'md').container).toEqual({
    flexDirection: 'row',
    flexWrap: 'wrap',
    rowGap: 10,
  });
});

test('layoutStyles lays an area out by direction, wrap, align, justify and overflow', () => {
  expect(
    layoutStyles({
      align: 'middle',
      direction: 'column',
      justify: 'space-between',
      overflow: 'hidden',
      wrap: 'nowrap',
    }).container
  ).toEqual({
    alignItems: 'center',
    flexDirection: 'column',
    flexWrap: 'nowrap',
    justifyContent: 'space-between',
    overflow: 'hidden',
  });
  expect(layoutStyles({ overflow: 'auto' }).container.overflow).toBeUndefined();
});

test('layoutStyles places flex blocks by flex, grow, shrink and size, at every breakpoint', () => {
  expect(layoutStyles({ grow: true, size: 120 }, 'xs').child).toEqual({
    flexBasis: 120,
    flexGrow: 1,
    flexShrink: 1,
  });
  expect(layoutStyles({ shrink: false, md: { span: 12 } }, 'md').child).toEqual({
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
  expect(layoutStyles({ flex: '1 0 200px' }, 'xs', 8).child).toEqual({
    flexBasis: 208,
    flexGrow: 1,
    flexShrink: 0,
    paddingLeft: 8,
  });
  expect(layoutStyles({ size: '30%' }).child.flexBasis).toBe('30%');
});

test('layoutStyles aligns a block in its area by selfAlign', () => {
  expect(layoutStyles({ selfAlign: 'middle' }).child).toEqual({
    alignSelf: 'center',
    width: '100%',
  });
  expect(layoutStyles({ selfAlign: 'stretch' }).child.alignSelf).toBe('stretch');
});
