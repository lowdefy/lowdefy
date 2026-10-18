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

import resolveColor from './resolveColor.js';
import theme from '../test/theme.json';

const { dark, light } = theme;

test('resolveColor gives a palette hue as its 6th shade in the mode showing', () => {
  expect(resolveColor({ color: 'blue', tokens: light })).toEqual(light['blue-6']);
  expect(resolveColor({ color: 'blue', tokens: dark })).toEqual(dark['blue-6']);
  expect(resolveColor({ color: 'blue', tokens: dark })).not.toEqual(light['blue-6']);
});

test('resolveColor reads stage colour names as antd hues', () => {
  expect(resolveColor({ color: 'amber', tokens: light })).toEqual(light['gold-6']);
  expect(resolveColor({ color: 'teal', tokens: light })).toEqual(light['cyan-6']);
  expect(resolveColor({ color: 'indigo', tokens: light })).toEqual(light['geekblue-6']);
});

test('resolveColor gives grey as the secondary label colour', () => {
  expect(resolveColor({ color: 'grey', tokens: light })).toEqual(light.colorTextSecondary);
  expect(resolveColor({ color: 'gray', tokens: dark })).toEqual(dark.colorTextSecondary);
});

test('resolveColor reads token names and passes other colours through', () => {
  expect(resolveColor({ color: 'colorSuccess', tokens: light })).toEqual(light.colorSuccess);
  expect(resolveColor({ color: '#ff0000', tokens: light })).toEqual('#ff0000');
});
