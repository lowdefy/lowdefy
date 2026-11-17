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

import { expect, test } from 'vitest';

import buildChatTitlePrompt, { MAX_REPLY_CHARS } from './buildChatTitlePrompt.js';

test('holds the opening message and the reply', () => {
  const prompt = buildChatTitlePrompt({
    firstUserText: 'How do I get started?',
    replyText: 'To move an assignment to another site, open the assignment record.',
  });
  expect(prompt).toContain("User's opening message:\nHow do I get started?");
  expect(prompt).toContain(
    "Assistant's reply:\nTo move an assignment to another site, open the assignment record."
  );
});

test('cuts the reply to its first MAX_REPLY_CHARS characters', () => {
  const prompt = buildChatTitlePrompt({
    firstUserText: 'Explain this',
    replyText: `${'r'.repeat(MAX_REPLY_CHARS)}cut`,
  });
  expect(prompt.endsWith('r'.repeat(MAX_REPLY_CHARS))).toBe(true);
  expect(prompt).not.toContain('cut');
});

test('keeps the opening message whole', () => {
  const firstUserText = 'q'.repeat(MAX_REPLY_CHARS * 2);
  const prompt = buildChatTitlePrompt({ firstUserText, replyText: '' });
  expect(prompt).toContain(firstUserText);
});
