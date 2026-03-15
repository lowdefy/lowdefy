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

import React from 'react';
import { render } from '@testing-library/react';

import blockDefaultProps from './blockDefaultProps.js';
import withBlockDefaults from './withBlockDefaults.js';

let receivedProps;

const TestComponent = (props) => {
  receivedProps = props;
  return <div />;
};
TestComponent.meta = { category: 'display', icons: [], styles: [] };
TestComponent.displayName = 'TestComponent';

beforeEach(() => {
  receivedProps = undefined;
});

test('wrapped component receives all blockDefaultProps keys when rendered with no props', () => {
  const Wrapped = withBlockDefaults(TestComponent);
  render(<Wrapped />);
  Object.keys(blockDefaultProps).forEach((key) => {
    expect(receivedProps).toHaveProperty(key);
    expect(receivedProps[key]).toEqual(blockDefaultProps[key]);
  });
});

test('explicitly passed props override defaults', () => {
  const Wrapped = withBlockDefaults(TestComponent);
  const customProperties = { title: 'Hello' };
  render(<Wrapped properties={customProperties} />);
  expect(receivedProps.properties).toEqual(customProperties);
  expect(receivedProps.blockId).toEqual(blockDefaultProps.blockId);
});

test('Wrapped.meta equals Component.meta', () => {
  const Wrapped = withBlockDefaults(TestComponent);
  expect(Wrapped.meta).toEqual(TestComponent.meta);
});

test('Wrapped.displayName falls back to Component.name when no displayName set', () => {
  const NamedComponent = (props) => <div />;
  const Wrapped = withBlockDefaults(NamedComponent);
  expect(Wrapped.displayName).toEqual('NamedComponent');
});

test('component with no .meta gets Wrapped.meta = undefined', () => {
  const NoMetaComponent = (props) => <div />;
  const Wrapped = withBlockDefaults(NoMetaComponent);
  expect(Wrapped.meta).toBeUndefined();
});
