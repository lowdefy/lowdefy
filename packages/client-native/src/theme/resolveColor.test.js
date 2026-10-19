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

const light = {
  'blue-6': '#1677ff',
  'cyan-6': '#13c2c2',
  'geekblue-6': '#2f54eb',
  'gold-6': '#faad14',
  colorPrimary: '#6366f1',
  colorSecondaryLabel: 'rgba(60,60,67,0.6)',
  colorSuccess: '#52c41a',
  colorTextSecondary: 'rgba(0,0,0,0.65)',
  colorTint: '#6366f1',
};
const dark = { ...light, 'blue-6': '#1668dc', colorSecondaryLabel: 'rgba(235,235,245,0.6)' };

test('resolveColor gives a palette hue as its 6th shade in the mode showing', () => {
  expect(resolveColor({ color: 'blue', tokens: light })).toEqual('#1677ff');
  expect(resolveColor({ color: 'blue', tokens: dark })).toEqual('#1668dc');
});

test('resolveColor reads stage colour names as antd hues', () => {
  expect(resolveColor({ color: 'amber', tokens: light })).toEqual('#faad14');
  expect(resolveColor({ color: 'teal', tokens: light })).toEqual('#13c2c2');
  expect(resolveColor({ color: 'indigo', tokens: light })).toEqual('#2f54eb');
});

test('resolveColor gives grey as the secondary label, antd secondary text without iOS tokens', () => {
  expect(resolveColor({ color: 'grey', tokens: light })).toEqual('rgba(60,60,67,0.6)');
  expect(resolveColor({ color: 'gray', tokens: dark })).toEqual('rgba(235,235,245,0.6)');
  expect(
    resolveColor({ color: 'default', tokens: { colorTextSecondary: 'rgba(0,0,0,0.65)' } })
  ).toEqual('rgba(0,0,0,0.65)');
});

test('resolveColor reads token names and passes other colours through', () => {
  expect(resolveColor({ color: 'colorSuccess', tokens: light })).toEqual('#52c41a');
  expect(resolveColor({ color: 'colorPrimary', tokens: light })).toEqual('#6366f1');
  expect(resolveColor({ color: 'colorTint', tokens: light })).toEqual('#6366f1');
  expect(resolveColor({ color: '#ff0000', tokens: light })).toEqual('#ff0000');
});
