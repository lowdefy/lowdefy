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

import toSharePayload from './toSharePayload.js';

test('toSharePayload splits shared text, links and files', () => {
  expect(
    toSharePayload([
      { shareType: 'text', value: 'Pump 4 is leaking' },
      { shareType: 'url', value: 'https://example.com/report' },
      {
        shareType: 'image',
        value: 'file:///group/photo.jpg',
        contentUri: 'file:///group/photo.jpg',
        contentType: 'image',
        contentMimeType: 'image/jpeg',
        originalName: 'photo.jpg',
        contentSize: 2048,
      },
    ])
  ).toEqual({
    text: 'Pump 4 is leaking',
    urls: ['https://example.com/report'],
    files: [
      {
        name: 'photo.jpg',
        mimeType: 'image/jpeg',
        size: 2048,
        uri: 'file:///group/photo.jpg',
        type: 'image',
      },
    ],
  });
});
