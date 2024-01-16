/*
  Copyright 2020-2024 Lowdefy, Inc

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

const defaultValue = {
  xs: {
    span: 24,
  },
  sm: {
    span: 24,
  },
  md: {
    span: 24,
  },
};
test('layout is empty', () => {
  const layout = {};
  expect(deriveLayout(layout)).toEqual(defaultValue);
});

test('set properties', () => {
  const layout = {
    offset: 1,
    order: 2,
    pull: 3,
    push: 4,
    span: 5,
  };
  expect(deriveLayout(layout)).toEqual({ ...defaultValue, md: layout });
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
  expect(deriveLayout(layout)).toEqual({ ...defaultValue, sm: layout.sm, xs: layout.sm });
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
  expect(deriveLayout(layout)).toEqual({ ...defaultValue, xs: layout.xs });
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
  expect(deriveLayout(layout)).toEqual({ ...defaultValue, xs: layout.xs, md: layout.md });
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
  expect(deriveLayout(layout)).toEqual({ ...defaultValue, xs: layout.xs, sm: layout.sm });
});

test('set lg property', () => {
  const layout = {
    lg: {
      order: 2,
    },
  };
  expect(deriveLayout(layout)).toEqual({ ...defaultValue, lg: layout.lg });
});

test('set xl property', () => {
  const layout = {
    xl: {
      order: 2,
    },
  };
  expect(deriveLayout(layout)).toEqual({ ...defaultValue, xl: layout.xl });
});

test('set xxl property', () => {
  const layout = {
    xxl: {
      order: 2,
    },
  };
  expect(deriveLayout(layout)).toEqual({ ...defaultValue, xxl: layout.xxl });
});

test('set flex number', () => {
  const layout = { flex: 1 };
  expect(deriveLayout(layout)).toEqual({ flex: 1 });
});

test('set flex string', () => {
  const layout = { flex: '1 1' };
  expect(deriveLayout(layout)).toEqual({ flex: '1 1' });
});

test('set flex true sets default', () => {
  const layout = { flex: true };
  expect(deriveLayout(layout)).toEqual({ flex: '0 1 auto' });
});

test('set grow 1 sets flex 1 1 auto', () => {
  const layout = { grow: 1 };
  expect(deriveLayout(layout)).toEqual({ flex: '1 1 auto' });
});

test('set grow true sets flex 1 1 auto', () => {
  const layout = { grow: true };
  expect(deriveLayout(layout)).toEqual({ flex: '1 1 auto' });
});

test('set grow false sets flex 0 1 auto', () => {
  const layout = { grow: false };
  expect(deriveLayout(layout)).toEqual({ flex: '0 1 auto' });
});

test('set grow 3 sets flex 3 1 auto', () => {
  const layout = { grow: 3 };
  expect(deriveLayout(layout)).toEqual({ flex: '3 1 auto' });
});

test('set grow "unset" sets flex unset 1 auto', () => {
  const layout = { grow: 'unset' };
  expect(deriveLayout(layout)).toEqual({ flex: 'unset 1 auto' });
});

test('set grow "inherit" sets flex unset 1 auto', () => {
  const layout = { grow: 'inherit' };
  expect(deriveLayout(layout)).toEqual({ flex: 'inherit 1 auto' });
});

test('set grow "initial" sets flex unset 1 auto', () => {
  const layout = { grow: 'initial' };
  expect(deriveLayout(layout)).toEqual({ flex: 'initial 1 auto' });
});

test('set grow string sets flex 0 1 auto default', () => {
  const layout = { grow: 'aaa' };
  expect(deriveLayout(layout)).toEqual({ flex: '0 1 auto' });
});

test('set shrink 0 sets flex 0 0 auto', () => {
  const layout = { shrink: 0 };
  expect(deriveLayout(layout)).toEqual({ flex: '0 0 auto' });
});

test('set shrink true sets flex 0 1 auto', () => {
  const layout = { shrink: true };
  expect(deriveLayout(layout)).toEqual({ flex: '0 1 auto' });
});

test('set shrink false sets flex 0 0 auto', () => {
  const layout = { shrink: false };
  expect(deriveLayout(layout)).toEqual({ flex: '0 0 auto' });
});

test('set shrink 3 sets flex 0 3 auto', () => {
  const layout = { shrink: 3 };
  expect(deriveLayout(layout)).toEqual({ flex: '0 3 auto' });
});

test('set shrink "unset" sets flex unset 1 auto', () => {
  const layout = { shrink: 'unset' };
  expect(deriveLayout(layout)).toEqual({ flex: '0 unset auto' });
});

test('set shrink "inherit" sets flex unset 1 auto', () => {
  const layout = { shrink: 'inherit' };
  expect(deriveLayout(layout)).toEqual({ flex: '0 inherit auto' });
});

test('set shrink "initial" sets flex unset 1 auto', () => {
  const layout = { shrink: 'initial' };
  expect(deriveLayout(layout)).toEqual({ flex: '0 initial auto' });
});

test('set shrink string sets flex 0 1 auto default', () => {
  const layout = { shrink: 'aaa' };
  expect(deriveLayout(layout)).toEqual({ flex: '0 1 auto' });
});

test('set size to number set flex to px', () => {
  const layout = { size: 100 };
  expect(deriveLayout(layout)).toEqual({ flex: '0 1 100px' });
});

test('set size to string set flex to string', () => {
  const layout = { size: '100' };
  expect(deriveLayout(layout)).toEqual({ flex: '0 1 100' });
});

test('set size to bool set flex to default', () => {
  const layout = { size: true };
  expect(deriveLayout(layout)).toEqual({ flex: '0 1 auto' });
});

test('set offset will reduce span', () => {
  const layout = { offset: 4 };
  expect(deriveLayout(layout)).toEqual({
    md: {
      offset: 4,
      span: 20,
    },
    sm: {
      span: 24,
    },
    xs: {
      span: 24,
    },
  });
});

test('set offset will reduce span md', () => {
  const layout = { md: { offset: 4 } };
  expect(deriveLayout(layout)).toEqual({
    md: {
      offset: 4,
      span: 20,
    },
    sm: {
      span: 24,
    },
    xs: {
      span: 24,
    },
  });
});

test('set offset will reduce span xs', () => {
  const layout = { xs: { offset: 4 } };
  expect(deriveLayout(layout)).toEqual({
    md: {
      span: 24,
    },
    sm: {
      span: 24,
    },
    xs: {
      span: 20,
      offset: 4,
    },
  });
});

test('set offset will reduce span sm', () => {
  const layout = { sm: { offset: 4 } };
  expect(deriveLayout(layout)).toEqual({
    md: {
      span: 24,
    },
    sm: {
      span: 20,
      offset: 4,
    },
    xs: {
      span: 20,
      offset: 4,
    },
  });
});

test('set offset will reduce span lg', () => {
  const layout = { lg: { offset: 4 } };
  expect(deriveLayout(layout)).toEqual({
    lg: {
      span: 20,
      offset: 4,
    },
    md: {
      span: 24,
    },
    sm: {
      span: 24,
    },
    xs: {
      span: 24,
    },
  });
});

test('set offset will reduce span xl', () => {
  const layout = { xl: { offset: 4 } };
  expect(deriveLayout(layout)).toEqual({
    xl: {
      span: 20,
      offset: 4,
    },
    md: {
      span: 24,
    },
    sm: {
      span: 24,
    },
    xs: {
      span: 24,
    },
  });
});

test('set offset will reduce span xxl', () => {
  const layout = { xxl: { offset: 4 } };
  expect(deriveLayout(layout)).toEqual({
    xxl: {
      span: 20,
      offset: 4,
    },
    md: {
      span: 24,
    },
    sm: {
      span: 24,
    },
    xs: {
      span: 24,
    },
  });
});
