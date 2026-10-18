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

import { act } from '@testing-library/react-native';

import { ios, page, press, renderPage, screen, styleOf, theme } from '../../test/renderPage.js';

function dotsOf(blockId) {
  const row = screen.getByLabelText(/^Page /);
  const dots = row.children.filter((child) => typeof child !== 'string');
  return { active: screen.getByTestId(`${blockId}_active`), dots: dots.slice(0, -1), row };
}

test('PageDots draws a dot per page, the active one in full colour, and its place for screen readers', async () => {
  await renderPage({
    pageConfig: page([{ id: 'dots', type: 'PageDots', properties: { count: 5, index: 2 } }]),
  });
  await screen.findByLabelText('Page 3 of 5');
  const { active, dots } = dotsOf('dots');
  expect(dots).toHaveLength(5);
  dots.forEach((dot) => {
    expect(styleOf(dot)).toMatchObject({
      backgroundColor: ios.light.colorLabel,
      height: 7,
      opacity: 0.3,
      width: 7,
    });
  });
  // The active dot sits over the third dot: two 7pt dots and their 9pt gaps along.
  expect(styleOf(active).backgroundColor).toBe(ios.light.colorLabel);
  expect(styleOf(active).transform[0].translateX).toBe(32);
});

test('PageDots takes a palette hue, token or hex colour', async () => {
  await renderPage({
    pageConfig: page([
      { id: 'hue', type: 'PageDots', properties: { count: 2, color: 'blue' } },
      { id: 'token', type: 'PageDots', properties: { count: 2, color: 'colorPrimary' } },
    ]),
  });
  expect(styleOf(await screen.findByTestId('hue_active')).backgroundColor).toBe(
    theme.light['blue-6']
  );
  expect(styleOf(screen.getByTestId('token_active')).backgroundColor).toBe(
    theme.light.colorPrimary
  );
});

test('PageDots slides the active dot when the index changes', async () => {
  await renderPage({
    pageConfig: page([
      { id: 'dots', type: 'PageDots', properties: { count: 3, index: { _state: 'page' } } },
      {
        id: 'next',
        type: 'Button',
        properties: { title: 'Next' },
        events: { onClick: [{ id: 'set', type: 'SetState', params: { page: 1 } }] },
      },
    ]),
  });
  await screen.findByLabelText('Page 1 of 3');
  await press(screen.getByText('Next'));
  expect(await screen.findByLabelText('Page 2 of 3')).toBeTruthy();
  expect(screen.getByTestId('dots_active')).toBeTruthy();
  await act(() => new Promise((resolve) => setTimeout(resolve, 50)));
});

test('PageDots keeps the active dot on the last page for an index past the end, and draws none for 0', async () => {
  await renderPage({
    pageConfig: page([
      { id: 'past', type: 'PageDots', properties: { count: 3, index: 7 } },
      { id: 'none', type: 'PageDots', properties: { count: 0 } },
    ]),
  });
  expect(await screen.findByLabelText('Page 3 of 3')).toBeTruthy();
  expect(screen.queryByTestId('none_active')).toBeNull();
});
