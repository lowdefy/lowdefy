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

import buildGeneratePrompt from './buildGeneratePrompt.js';

test('buildGeneratePrompt returns the prompt text when there are no files', () => {
  expect(buildGeneratePrompt({ prompt: 'Go.', files: [] })).toBe('Go.');
});

test('buildGeneratePrompt sends an image as an image part and anything else as a file part', () => {
  const messages = buildGeneratePrompt({
    prompt: 'Read these.',
    files: [
      { url: 'https://files.example.com/shot.png', mediaType: 'image/png' },
      { url: 'https://files.example.com/report.pdf', mediaType: 'application/pdf' },
    ],
  });
  expect(messages).toEqual([
    {
      role: 'user',
      content: [
        { type: 'text', text: 'Read these.' },
        {
          type: 'image',
          image: new URL('https://files.example.com/shot.png'),
          mediaType: 'image/png',
        },
        {
          type: 'file',
          data: new URL('https://files.example.com/report.pdf'),
          mediaType: 'application/pdf',
        },
      ],
    },
  ]);
  expect(messages[0].content[1].image).toBeInstanceOf(URL);
});
