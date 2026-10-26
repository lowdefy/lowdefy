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

import areaLayout from './areaLayout.js';

test('areaLayout fills a content slot from the block layout where the slot sets nothing', () => {
  expect(
    areaLayout({
      area: { gap: 4 },
      areaKey: 'content',
      layout: { gap: 8, direction: 'column', span: 12 },
    })
  ).toEqual({ gap: 4, direction: 'column' });
});

test('areaLayout leaves slots other than content to their own settings', () => {
  expect(
    areaLayout({ area: { gap: 4 }, areaKey: 'footer', layout: { direction: 'column' } })
  ).toEqual({ gap: 4 });
});
