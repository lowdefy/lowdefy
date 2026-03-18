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

import deriveLayout from './deriveLayout.js';

const defaultStyle = {
  '--lf-span': 24,
  '--lf-span-md': 24,
};

test('layout is empty', () => {
  const layout = {};
  expect(deriveLayout(layout)).toEqual({
    className: 'lf-col',
    style: defaultStyle,
  });
});

test('set properties', () => {
  const layout = {
    offset: 1,
    order: 2,
    pull: 3,
    push: 4,
    span: 5,
  };
  expect(deriveLayout(layout)).toEqual({
    className: 'lf-col lf-col-push lf-col-pull',
    style: {
      '--lf-span': 24,
      '--lf-span-md': 5,
      '--lf-offset-md': 1,
      '--lf-order-md': 2,
      '--lf-push-md': 4,
      '--lf-pull-md': 3,
    },
  });
});

test('set sm properties', () => {
  const layout = {
    sm: {
      offset: 1,
      order: 2,
      pull: 3,
      push: 4,
      span: 5,
    },
  };
  expect(deriveLayout(layout)).toEqual({
    className: 'lf-col lf-col-push lf-col-pull',
    style: {
      '--lf-span': 5,
      '--lf-display': 'block',
      '--lf-offset': 1,
      '--lf-order': 2,
      '--lf-push': 4,
      '--lf-pull': 3,
      '--lf-span-sm': 5,
      '--lf-display-sm': 'block',
      '--lf-offset-sm': 1,
      '--lf-order-sm': 2,
      '--lf-push-sm': 4,
      '--lf-pull-sm': 3,
      '--lf-span-md': 24,
    },
  });
});

test('set xs properties', () => {
  const layout = {
    xs: {
      offset: 1,
      order: 2,
      pull: 3,
      push: 4,
      span: 5,
    },
  };
  expect(deriveLayout(layout)).toEqual({
    className: 'lf-col lf-col-push lf-col-pull',
    style: {
      '--lf-span': 5,
      '--lf-display': 'block',
      '--lf-offset': 1,
      '--lf-order': 2,
      '--lf-push': 4,
      '--lf-pull': 3,
      '--lf-span-md': 24,
    },
  });
});

test('set xs and md properties', () => {
  const layout = {
    xs: {
      offset: 1,
      order: 2,
      pull: 3,
      push: 4,
      span: 5,
    },
    md: {
      offset: 11,
      order: 22,
      pull: 33,
      push: 44,
      span: 55,
    },
  };
  expect(deriveLayout(layout)).toEqual({
    className: 'lf-col lf-col-push lf-col-pull',
    style: {
      '--lf-span': 5,
      '--lf-display': 'block',
      '--lf-offset': 1,
      '--lf-order': 2,
      '--lf-push': 4,
      '--lf-pull': 3,
      '--lf-span-md': 55,
      '--lf-display-md': 'block',
      '--lf-offset-md': 11,
      '--lf-order-md': 22,
      '--lf-push-md': 44,
      '--lf-pull-md': 33,
    },
  });
});

test('set xs and sm properties', () => {
  const layout = {
    xs: {
      offset: 1,
      order: 2,
      pull: 3,
      push: 4,
      span: 5,
    },
    sm: {
      offset: 11,
      order: 22,
      pull: 33,
      push: 44,
      span: 55,
    },
  };
  expect(deriveLayout(layout)).toEqual({
    className: 'lf-col lf-col-push lf-col-pull',
    style: {
      // xs overrides sm→base cascade
      '--lf-span': 5,
      '--lf-display': 'block',
      '--lf-offset': 1,
      '--lf-order': 2,
      '--lf-push': 4,
      '--lf-pull': 3,
      // sm breakpoint
      '--lf-span-sm': 55,
      '--lf-display-sm': 'block',
      '--lf-offset-sm': 11,
      '--lf-order-sm': 22,
      '--lf-push-sm': 44,
      '--lf-pull-sm': 33,
      '--lf-span-md': 24,
    },
  });
});

test('set lg property', () => {
  const layout = {
    lg: {
      order: 2,
    },
  };
  expect(deriveLayout(layout)).toEqual({
    className: 'lf-col',
    style: {
      ...defaultStyle,
      '--lf-span-lg': 24,
      '--lf-display-lg': 'block',
      '--lf-order-lg': 2,
    },
  });
});

test('set xl property', () => {
  const layout = {
    xl: {
      order: 2,
    },
  };
  expect(deriveLayout(layout)).toEqual({
    className: 'lf-col',
    style: {
      ...defaultStyle,
      '--lf-span-xl': 24,
      '--lf-display-xl': 'block',
      '--lf-order-xl': 2,
    },
  });
});

test('set 2xl property', () => {
  const layout = {
    '2xl': {
      order: 2,
    },
  };
  expect(deriveLayout(layout)).toEqual({
    className: 'lf-col',
    style: {
      ...defaultStyle,
      '--lf-span-2xl': 24,
      '--lf-display-2xl': 'block',
      '--lf-order-2xl': 2,
    },
  });
});

test('set flex number', () => {
  const layout = { flex: 1 };
  expect(deriveLayout(layout)).toEqual({ className: '', style: { flex: 1 } });
});

test('set flex string', () => {
  const layout = { flex: '1 1' };
  expect(deriveLayout(layout)).toEqual({ className: '', style: { flex: '1 1' } });
});

test('set flex true sets default', () => {
  const layout = { flex: true };
  expect(deriveLayout(layout)).toEqual({ className: '', style: { flex: '0 1 auto' } });
});

test('set grow 1 sets flex 1 1 auto', () => {
  const layout = { grow: 1 };
  expect(deriveLayout(layout)).toEqual({ className: '', style: { flex: '1 1 auto' } });
});

test('set grow true sets flex 1 1 auto', () => {
  const layout = { grow: true };
  expect(deriveLayout(layout)).toEqual({ className: '', style: { flex: '1 1 auto' } });
});

test('set grow false sets flex 0 1 auto', () => {
  const layout = { grow: false };
  expect(deriveLayout(layout)).toEqual({ className: '', style: { flex: '0 1 auto' } });
});

test('set grow 3 sets flex 3 1 auto', () => {
  const layout = { grow: 3 };
  expect(deriveLayout(layout)).toEqual({ className: '', style: { flex: '3 1 auto' } });
});

test('set grow "unset" sets flex unset 1 auto', () => {
  const layout = { grow: 'unset' };
  expect(deriveLayout(layout)).toEqual({ className: '', style: { flex: 'unset 1 auto' } });
});

test('set grow "inherit" sets flex inherit 1 auto', () => {
  const layout = { grow: 'inherit' };
  expect(deriveLayout(layout)).toEqual({ className: '', style: { flex: 'inherit 1 auto' } });
});

test('set grow "initial" sets flex initial 1 auto', () => {
  const layout = { grow: 'initial' };
  expect(deriveLayout(layout)).toEqual({ className: '', style: { flex: 'initial 1 auto' } });
});

test('set grow string sets flex 0 1 auto default', () => {
  const layout = { grow: 'aaa' };
  expect(deriveLayout(layout)).toEqual({ className: '', style: { flex: '0 1 auto' } });
});

test('set shrink 0 sets flex 0 0 auto', () => {
  const layout = { shrink: 0 };
  expect(deriveLayout(layout)).toEqual({ className: '', style: { flex: '0 0 auto' } });
});

test('set shrink true sets flex 0 1 auto', () => {
  const layout = { shrink: true };
  expect(deriveLayout(layout)).toEqual({ className: '', style: { flex: '0 1 auto' } });
});

test('set shrink false sets flex 0 0 auto', () => {
  const layout = { shrink: false };
  expect(deriveLayout(layout)).toEqual({ className: '', style: { flex: '0 0 auto' } });
});

test('set shrink 3 sets flex 0 3 auto', () => {
  const layout = { shrink: 3 };
  expect(deriveLayout(layout)).toEqual({ className: '', style: { flex: '0 3 auto' } });
});

test('set shrink "unset" sets flex 0 unset auto', () => {
  const layout = { shrink: 'unset' };
  expect(deriveLayout(layout)).toEqual({ className: '', style: { flex: '0 unset auto' } });
});

test('set shrink "inherit" sets flex 0 inherit auto', () => {
  const layout = { shrink: 'inherit' };
  expect(deriveLayout(layout)).toEqual({ className: '', style: { flex: '0 inherit auto' } });
});

test('set shrink "initial" sets flex 0 initial auto', () => {
  const layout = { shrink: 'initial' };
  expect(deriveLayout(layout)).toEqual({ className: '', style: { flex: '0 initial auto' } });
});

test('set shrink string sets flex 0 1 auto default', () => {
  const layout = { shrink: 'aaa' };
  expect(deriveLayout(layout)).toEqual({ className: '', style: { flex: '0 1 auto' } });
});

test('set size to number set flex to px', () => {
  const layout = { size: 100 };
  expect(deriveLayout(layout)).toEqual({ className: '', style: { flex: '0 1 100px' } });
});

test('set size to string set flex to string', () => {
  const layout = { size: '100' };
  expect(deriveLayout(layout)).toEqual({ className: '', style: { flex: '0 1 100' } });
});

test('set size to bool set flex to default', () => {
  const layout = { size: true };
  expect(deriveLayout(layout)).toEqual({ className: '', style: { flex: '0 1 auto' } });
});

test('set offset will reduce span', () => {
  const layout = { offset: 4 };
  expect(deriveLayout(layout)).toEqual({
    className: 'lf-col',
    style: {
      '--lf-span': 24,
      '--lf-span-md': 20,
      '--lf-offset-md': 4,
    },
  });
});

test('set offset will reduce span md', () => {
  const layout = { md: { offset: 4 } };
  expect(deriveLayout(layout)).toEqual({
    className: 'lf-col',
    style: {
      '--lf-span': 24,
      '--lf-span-md': 20,
      '--lf-display-md': 'block',
      '--lf-offset-md': 4,
    },
  });
});

test('set offset will reduce span xs', () => {
  const layout = { xs: { offset: 4 } };
  expect(deriveLayout(layout)).toEqual({
    className: 'lf-col',
    style: {
      '--lf-span': 20,
      '--lf-display': 'block',
      '--lf-offset': 4,
      '--lf-span-md': 24,
    },
  });
});

test('set offset will reduce span sm', () => {
  const layout = { sm: { offset: 4 } };
  expect(deriveLayout(layout)).toEqual({
    className: 'lf-col',
    style: {
      '--lf-span': 20,
      '--lf-display': 'block',
      '--lf-offset': 4,
      '--lf-span-sm': 20,
      '--lf-display-sm': 'block',
      '--lf-offset-sm': 4,
      '--lf-span-md': 24,
    },
  });
});

test('set offset will reduce span lg', () => {
  const layout = { lg: { offset: 4 } };
  expect(deriveLayout(layout)).toEqual({
    className: 'lf-col',
    style: {
      ...defaultStyle,
      '--lf-span-lg': 20,
      '--lf-display-lg': 'block',
      '--lf-offset-lg': 4,
    },
  });
});

test('set offset will reduce span xl', () => {
  const layout = { xl: { offset: 4 } };
  expect(deriveLayout(layout)).toEqual({
    className: 'lf-col',
    style: {
      ...defaultStyle,
      '--lf-span-xl': 20,
      '--lf-display-xl': 'block',
      '--lf-offset-xl': 4,
    },
  });
});

test('set offset will reduce span 2xl', () => {
  const layout = { '2xl': { offset: 4 } };
  expect(deriveLayout(layout)).toEqual({
    className: 'lf-col',
    style: {
      ...defaultStyle,
      '--lf-span-2xl': 20,
      '--lf-display-2xl': 'block',
      '--lf-offset-2xl': 4,
    },
  });
});

// New acceptance criteria tests

test('span: 0 hides at md breakpoint', () => {
  const layout = { span: 0 };
  expect(deriveLayout(layout)).toEqual({
    className: 'lf-col',
    style: {
      '--lf-span': 24,
      '--lf-span-md': 0,
      '--lf-display-md': 'none',
    },
  });
});

test('xs: { span: 0 }, md: { span: 8 } hides at xs, shows at md', () => {
  const layout = { xs: { span: 0 }, md: { span: 8 } };
  expect(deriveLayout(layout)).toEqual({
    className: 'lf-col',
    style: {
      '--lf-span': 0,
      '--lf-display': 'none',
      '--lf-span-md': 8,
      '--lf-display-md': 'block',
    },
  });
});

test('push: 4 adds lf-col-push class', () => {
  const layout = { push: 4 };
  expect(deriveLayout(layout)).toEqual({
    className: 'lf-col lf-col-push',
    style: {
      '--lf-span': 24,
      '--lf-span-md': 24,
      '--lf-push-md': 4,
    },
  });
});

test('pull: 4 adds lf-col-pull class', () => {
  const layout = { pull: 4 };
  expect(deriveLayout(layout)).toEqual({
    className: 'lf-col lf-col-pull',
    style: {
      '--lf-span': 24,
      '--lf-span-md': 24,
      '--lf-pull-md': 4,
    },
  });
});

test('2xl key works as breakpoint', () => {
  const layout = { '2xl': { span: 4, offset: 2 } };
  expect(deriveLayout(layout)).toEqual({
    className: 'lf-col',
    style: {
      ...defaultStyle,
      '--lf-span-2xl': 4,
      '--lf-display-2xl': 'block',
      '--lf-offset-2xl': 2,
    },
  });
});

test('flex mode with order returns className and style', () => {
  const layout = { flex: '1 0 200px', order: 3 };
  expect(deriveLayout(layout)).toEqual({
    className: '',
    style: { flex: '1 0 200px', order: 3 },
  });
});

test('sm cascades to base and xs overrides', () => {
  const layout = {
    sm: { span: 12 },
    xs: { span: 6 },
  };
  expect(deriveLayout(layout)).toEqual({
    className: 'lf-col',
    style: {
      // xs overrides the sm→base cascade
      '--lf-span': 6,
      '--lf-display': 'block',
      '--lf-span-sm': 12,
      '--lf-display-sm': 'block',
      '--lf-span-md': 24,
    },
  });
});

test('md override merges with top-level baseline', () => {
  const layout = {
    offset: 2,
    order: 1,
    md: { span: 16 },
  };
  expect(deriveLayout(layout)).toEqual({
    className: 'lf-col',
    style: {
      '--lf-span': 24,
      '--lf-span-md': 16,
      '--lf-display-md': 'block',
      '--lf-offset-md': 2,
      '--lf-order-md': 1,
    },
  });
});
