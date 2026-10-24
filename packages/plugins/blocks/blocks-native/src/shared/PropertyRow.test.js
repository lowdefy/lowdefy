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

import { StyleSheet } from 'react-native';

import { ios, page, renderPage, screen, styleOf } from '../test/renderPage.js';

function titleStyle(title) {
  return StyleSheet.flatten(screen.getByText(title).props.style);
}

test('Selector, NumberInput, TextInput and DateSelector rows line up in one list', async () => {
  await renderPage({
    pageConfig: page([
      {
        id: 'status',
        type: 'Selector',
        properties: { title: 'Status', variant: 'menu', options: ['Open', 'Closed'] },
      },
      { id: 'qty', type: 'NumberInput', properties: { title: 'Quantity', variant: 'row' } },
      { id: 'name', type: 'TextInput', properties: { title: 'Name', variant: 'row' } },
      { id: 'due', type: 'DateSelector', properties: { title: 'Due', variant: 'row' } },
    ]),
  });
  await screen.findByTestId('status_row');
  const rows = ['status', 'qty', 'name', 'due'].map((id) =>
    styleOf(screen.getByTestId(`${id}_row`))
  );
  rows.forEach((row) => expect(row).toEqual(rows[0]));
  expect(rows[0]).toMatchObject({ minHeight: 44, paddingHorizontal: 16, paddingVertical: 10 });
  const titles = ['Status', 'Quantity', 'Name', 'Due'].map(titleStyle);
  titles.forEach((title) => expect(title).toEqual(titles[0]));
  expect(titles[0]).toEqual({ color: ios.light.colorLabel, fontSize: 17 });
  expect(styleOf(screen.getByText('Select item')).color).toBe(ios.light.colorSecondaryLabel);
  expect(styleOf(screen.getByText('Not set')).color).toBe(ios.light.colorSecondaryLabel);
});
