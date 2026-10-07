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

import collectChatFiles from './collectChatFiles.js';

function uploadedPart({ key, filename, mediaType = 'image/png' }) {
  return {
    type: 'file',
    url: `https://files.example.com/${key}?sig=x`,
    mediaType,
    filename,
    providerMetadata: { lowdefy: { key } },
  };
}

test('collectChatFiles lists the keyed file parts of every message in message order', () => {
  const messages = [
    {
      id: 'm1',
      role: 'user',
      parts: [
        { type: 'text', text: 'Here is the bug.' },
        uploadedPart({ key: 'org/nigel/user_1/a/screenshot.png', filename: 'screenshot.png' }),
      ],
    },
    { id: 'm2', role: 'assistant', parts: [{ type: 'text', text: 'Thanks.' }] },
    {
      id: 'm3',
      role: 'user',
      parts: [
        uploadedPart({
          key: 'org/nigel/user_1/b/log.pdf',
          filename: 'log.pdf',
          mediaType: 'application/pdf',
        }),
      ],
    },
  ];
  expect(collectChatFiles({ messages })).toEqual([
    {
      key: 'org/nigel/user_1/a/screenshot.png',
      filename: 'screenshot.png',
      mediaType: 'image/png',
    },
    { key: 'org/nigel/user_1/b/log.pdf', filename: 'log.pdf', mediaType: 'application/pdf' },
  ]);
});

test('collectChatFiles leaves out inline file parts, which carry no key', () => {
  const messages = [
    {
      id: 'm1',
      role: 'user',
      parts: [
        { type: 'file', url: 'iVBORw0KGgo=', mediaType: 'image/png', filename: 'pasted.png' },
        { type: 'file', url: 'https://x.example.com/a.png', mediaType: 'image/png', key: 'a.png' },
      ],
    },
  ];
  expect(collectChatFiles({ messages })).toEqual([]);
});

test('collectChatFiles passes over malformed messages and parts', () => {
  const messages = [
    null,
    { id: 'm1', role: 'user' },
    { id: 'm2', role: 'user', parts: [null, uploadedPart({ key: 'k', filename: 'k.png' })] },
  ];
  expect(collectChatFiles({ messages })).toEqual([
    { key: 'k', filename: 'k.png', mediaType: 'image/png' },
  ]);
});
