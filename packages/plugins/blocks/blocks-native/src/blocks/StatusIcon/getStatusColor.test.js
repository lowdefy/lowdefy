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

import getStatusColor from './getStatusColor.js';
import theme from '../../test/theme.json';

const { dark, light } = theme;

test('getStatusColor draws not-started, cancelled and priority glyphs in the secondary label grey', () => {
  ['backlog', 'todo', 'cancelled', 'dot', 'priorityLow'].forEach((name) => {
    expect(getStatusColor({ name, tokens: light })).toEqual(light.colorTextSecondary);
  });
});

test('getStatusColor reads each status colour from the theme of the mode showing', () => {
  expect(getStatusColor({ name: 'done', tokens: light })).toEqual(light.colorSuccess);
  expect(getStatusColor({ name: 'done', tokens: dark })).toEqual(dark.colorSuccess);
  expect(getStatusColor({ name: 'inProgress', tokens: dark })).toEqual(dark.colorWarning);
  expect(getStatusColor({ name: 'needsInput', tokens: dark })).toEqual(dark['orange-6']);
  expect(getStatusColor({ name: 'unmerged', tokens: light })).toEqual(light['purple-6']);
  expect(getStatusColor({ name: 'priorityUrgent', tokens: light })).toEqual(light['volcano-6']);
  expect(getStatusColor({ name: 'priorityHigh', tokens: light })).toEqual(light.colorTextSecondary);
});
