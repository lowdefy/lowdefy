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

import { ios, page, renderPage, screen, styleOf } from '../../test/renderPage.js';

test('a Spinner shows the activity indicator at the web sizes', async () => {
  await renderPage({
    pageConfig: page([
      { id: 'default', type: 'Spinner' },
      { id: 'large', type: 'Spinner', properties: { size: 'large' } },
      { id: 'sized', type: 'Spinner', properties: { size: 40 } },
    ]),
  });
  await screen.findByTestId('default');
  const indicators = ['default', 'large', 'sized'].map((id) =>
    screen.getByTestId(`${id}_indicator`)
  );
  expect(indicators.map((indicator) => styleOf(indicator).transform[0].scale)).toEqual([1, 1.6, 2]);
  expect(indicators[0].props.color).toBe(ios.light.colorSecondaryLabel);
  expect(screen.getAllByRole('progressbar')).toHaveLength(3);
});

test('a Spinner takes the dark colour in dark mode, and is not drawn when not visible', async () => {
  await renderPage({
    darkMode: 'dark',
    pageConfig: page([
      { id: 'spin', type: 'Spinner' },
      { id: 'hidden', type: 'Spinner', visible: false },
    ]),
  });
  await screen.findByTestId('spin');
  expect(screen.getByTestId('spin_indicator').props.color).toBe(ios.dark.colorSecondaryLabel);
  expect(screen.queryByTestId('hidden')).toBeNull();
});
