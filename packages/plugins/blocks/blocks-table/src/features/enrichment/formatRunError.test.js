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

import formatRunError from './formatRunError.js';

test('formatRunError says how many attempts failed when the queue retried', () => {
  expect(formatRunError({ error: 'Provider error (500)', attempts: 3 })).toEqual({
    summary: 'Failed after 3 attempts',
    message: 'Provider error (500)',
  });
  expect(formatRunError({ error: 'Provider error (400)', attempts: 1 })).toEqual({
    summary: 'Failed',
    message: 'Provider error (400)',
  });
});

test('formatRunError falls back to a generic message without an error', () => {
  expect(formatRunError({})).toEqual({ summary: 'Failed', message: 'The run failed.' });
  expect(formatRunError({ error: '  ', attempts: 2 })).toEqual({
    summary: 'Failed after 2 attempts',
    message: 'The run failed.',
  });
});

test('formatRunError shortens a long message at a word boundary', () => {
  const { message } = formatRunError({ error: `The provider said ${'very '.repeat(40)}long.` });
  expect(message.length).toBeLessThanOrEqual(120);
  expect(message).toMatch(/very…$/);
  const word = formatRunError({ error: 'x'.repeat(200) }).message;
  expect(word).toBe(`${'x'.repeat(119)}…`);
});
