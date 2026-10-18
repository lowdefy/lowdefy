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

import getSemanticColors from './getSemanticColors.js';
import theme from '../test/theme.json';

test('getSemanticColors falls back to the antd tokens closest to each iOS colour', () => {
  expect(getSemanticColors({ tokens: theme.light })).toEqual({
    background: theme.light.colorBgBase,
    groupedBackground: theme.light.colorBgLayout,
    cell: theme.light.colorBgContainer,
    cellPressed: theme.light.colorFill,
    separator: theme.light.colorBorder,
    label: theme.light.colorText,
    secondaryLabel: theme.light.colorTextSecondary,
    tertiaryLabel: theme.light.colorTextTertiary,
  });
});

test('getSemanticColors reads the iOS tokens when the theme has them', () => {
  const tokens = {
    ...theme.dark,
    colorGroupedBackground: '#000000',
    colorCell: '#1c1c1e',
    colorSeparator: 'rgba(84,84,88,0.65)',
  };
  const colors = getSemanticColors({ tokens });
  expect(colors.groupedBackground).toEqual('#000000');
  expect(colors.cell).toEqual('#1c1c1e');
  expect(colors.separator).toEqual('rgba(84,84,88,0.65)');
  expect(colors.label).toEqual(theme.dark.colorText);
});
