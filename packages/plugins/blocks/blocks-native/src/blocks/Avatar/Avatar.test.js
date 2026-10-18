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

import { page, renderPage, screen, styleOf } from '../../test/renderPage.js';

test('an Avatar shows initials on the colour its name picks', async () => {
  await renderPage({
    pageConfig: page([{ id: 'ada', type: 'Avatar', properties: { name: 'Ada Lovelace' } }]),
  });
  const avatar = await screen.findByLabelText('Ada Lovelace');
  expect(styleOf(avatar)).toMatchObject({ height: 28, width: 28 });
  expect(screen.getByText('AL', { includeHiddenElements: true })).toBeTruthy();
});

test('an Avatar stacks several people and counts the rest past max', async () => {
  await renderPage({
    pageConfig: page([
      {
        id: 'team',
        type: 'Avatar',
        properties: {
          size: 20,
          max: 2,
          avatars: [{ name: 'Ada Lovelace' }, { name: 'Grace Hopper' }, { name: 'Alan Turing' }],
        },
      },
    ]),
  });
  expect(await screen.findByLabelText('Ada Lovelace, Grace Hopper, Alan Turing')).toBeTruthy();
  expect(screen.getByText('+1', { includeHiddenElements: true })).toBeTruthy();
  const second = screen.getByTestId('team_avatar_1', { includeHiddenElements: true });
  expect(styleOf(second)).toMatchObject({
    // The ring matches the cell it sits on: secondarySystemGroupedBackground in light mode.
    borderColor: '#FFFFFF',
    marginLeft: -6,
  });
});
