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

import getButtonColors from './getButtonColors.js';
import theme from '../../test/theme.json';

const tokens = theme.light;

test('the default Button is solid primary, as the web type primary', () => {
  expect(getButtonColors({ properties: {}, tokens })).toMatchObject({
    backgroundColor: tokens.colorPrimary,
    textColor: tokens.colorTextLightSolid,
    borderWidth: 0,
  });
});

test('color and variant pick the colour and the fill', () => {
  expect(
    getButtonColors({ properties: { color: 'green', variant: 'outlined' }, tokens })
  ).toMatchObject({
    backgroundColor: tokens.colorBgContainer,
    borderColor: tokens.green,
    textColor: tokens.green,
  });
  expect(
    getButtonColors({ properties: { color: 'default', variant: 'text' }, tokens })
  ).toMatchObject({
    backgroundColor: 'transparent',
    textColor: tokens.colorText,
  });
});

test('danger draws the Button in the error colour', () => {
  expect(getButtonColors({ properties: { danger: true, variant: 'solid' }, tokens })).toMatchObject(
    {
      backgroundColor: tokens.colorError,
    }
  );
  expect(getButtonColors({ properties: { type: 'danger' }, tokens })).toMatchObject({
    backgroundColor: tokens.colorError,
  });
});

test('without a variant a custom colour replaces the primary colour and a preset has no effect', () => {
  expect(getButtonColors({ properties: { color: '#123456' }, tokens })).toMatchObject({
    backgroundColor: '#123456',
  });
  expect(getButtonColors({ properties: { color: 'green' }, tokens })).toMatchObject({
    backgroundColor: tokens.colorPrimary,
  });
  expect(getButtonColors({ properties: { type: 'dashed' }, tokens })).toMatchObject({
    borderStyle: 'dashed',
    borderColor: tokens.colorBorder,
  });
});
