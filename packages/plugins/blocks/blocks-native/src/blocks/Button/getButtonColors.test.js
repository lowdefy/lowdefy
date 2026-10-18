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

import { iosColors, withAlpha } from '@lowdefy/client-native';

import getButtonColors from './getButtonColors.js';
import theme from '../../test/theme.json';

const tokens = { ...iosColors.light, colorTint: theme.light.colorPrimary, ...theme.light };

test('the default Button is iOS filled: the tint under white text', () => {
  expect(getButtonColors({ isDark: false, properties: {}, tokens })).toMatchObject({
    backgroundColor: tokens.colorPrimary,
    borderWidth: 0,
    textColor: '#FFFFFF',
  });
});

test('tinted, gray and plain take the tint when no colour is set', () => {
  expect(
    getButtonColors({ isDark: false, properties: { variant: 'tinted' }, tokens })
  ).toMatchObject({
    backgroundColor: withAlpha({ alpha: 0.14, color: tokens.colorPrimary }),
    textColor: tokens.colorPrimary,
  });
  expect(
    getButtonColors({ isDark: true, properties: { variant: 'tinted' }, tokens })
  ).toMatchObject({
    backgroundColor: withAlpha({ alpha: 0.24, color: tokens.colorPrimary }),
  });
  expect(getButtonColors({ isDark: false, properties: { variant: 'gray' }, tokens })).toMatchObject(
    {
      backgroundColor: tokens.colorTertiarySystemFill,
      textColor: tokens.colorPrimary,
    }
  );
  expect(
    getButtonColors({ isDark: false, properties: { variant: 'plain' }, tokens })
  ).toMatchObject({
    backgroundColor: 'transparent',
    plain: true,
    pressedOpacity: 0.4,
    textColor: tokens.colorPrimary,
  });
});

test('color and variant pick the colour and the fill', () => {
  expect(
    getButtonColors({ isDark: false, properties: { color: 'green', variant: 'outlined' }, tokens })
  ).toMatchObject({
    backgroundColor: 'transparent',
    borderColor: tokens.green,
    textColor: tokens.green,
  });
  expect(
    getButtonColors({ isDark: false, properties: { color: 'default', variant: 'text' }, tokens })
  ).toMatchObject({
    backgroundColor: 'transparent',
    textColor: tokens.colorLabel,
  });
});

test('danger draws the Button in the error colour', () => {
  expect(
    getButtonColors({ isDark: false, properties: { danger: true, variant: 'solid' }, tokens })
  ).toMatchObject({ backgroundColor: tokens.colorError });
  expect(getButtonColors({ isDark: false, properties: { type: 'danger' }, tokens })).toMatchObject({
    backgroundColor: tokens.colorError,
  });
});

test('without a variant a custom colour replaces the primary colour and a preset has no effect', () => {
  expect(
    getButtonColors({ isDark: false, properties: { color: '#123456' }, tokens })
  ).toMatchObject({ backgroundColor: '#123456' });
  expect(getButtonColors({ isDark: false, properties: { color: 'green' }, tokens })).toMatchObject({
    backgroundColor: tokens.colorPrimary,
  });
  expect(getButtonColors({ isDark: false, properties: { type: 'dashed' }, tokens })).toMatchObject({
    borderColor: tokens.colorOpaqueSeparator,
    borderStyle: 'dashed',
  });
});
