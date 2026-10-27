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

import createMentionPattern from '../Composer/createMentionPattern.js';
import parseTimelineHref from './parseTimelineHref.js';
import toPlainText from './toPlainText.js';
import toTimelineMarkdown from './toTimelineMarkdown.js';

const pattern = createMentionPattern();
const mentions = [
  { user_id: 'u1', name: 'Sam Taylor', sees: true },
  { user_id: 'u2', name: 'Ada (Ops)', sees: false },
];

test('toTimelineMarkdown turns mention tokens into mention links, muted for people who cannot see', () => {
  const markdown = toTimelineMarkdown({
    body: 'Thanks [[user:u1]] and [[user:u2]]',
    mentions,
    pattern,
  });
  expect(markdown).toBe(
    'Thanks [@](lowdefymention:seen:Sam%20Taylor) and [@](lowdefymention:muted:Ada%20%28Ops%29)'
  );
  expect(parseTimelineHref('lowdefymention:muted:Ada%20%28Ops%29')).toEqual({
    kind: 'mention',
    muted: true,
    name: 'Ada (Ops)',
  });
});

test('toTimelineMarkdown names a mention from people when the comment does not', () => {
  const people = new Map([['u3', { label: 'Grace Hopper', sees: true }]]);
  expect(toTimelineMarkdown({ body: '[[user:u3]] [[user:u4]]', people, pattern })).toBe(
    '[@](lowdefymention:seen:Grace%20Hopper) [@](lowdefymention:seen:Unknown)'
  );
});

test('toTimelineMarkdown turns other [[KEY]] links into record links', () => {
  const markdown = toTimelineMarkdown({ body: 'See [[ACME-12]].', pattern });
  expect(markdown).toBe('See [ACME-12](lowdefyrecord:ACME-12).');
  expect(parseTimelineHref('lowdefyrecord:ACME-12')).toEqual({ kind: 'record', key: 'ACME-12' });
});

test('toTimelineMarkdown leaves code spans and fenced blocks as written', () => {
  const body = 'Use `[[user:u1]]` or\n```\n[[ACME-1]]\n```\n[[ACME-2]]';
  expect(toTimelineMarkdown({ body, pattern })).toBe(
    'Use `[[user:u1]]` or\n```\n[[ACME-1]]\n```\n[ACME-2](lowdefyrecord:ACME-2)'
  );
});

test('parseTimelineHref passes a plain link through', () => {
  expect(parseTimelineHref('https://lowdefy.com')).toEqual({
    kind: 'link',
    href: 'https://lowdefy.com',
  });
});

test('toPlainText writes mentions as @Name', () => {
  expect(toPlainText({ body: 'Thanks [[user:u1]]!', mentions, pattern })).toBe(
    'Thanks @Sam Taylor!'
  );
});
