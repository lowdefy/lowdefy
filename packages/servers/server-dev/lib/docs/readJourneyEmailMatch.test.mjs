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

import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

import { jest } from '@jest/globals';

import JourneyStepError from './JourneyStepError.js';
import readJourneyEmailMatch from './readJourneyEmailMatch.js';

const STARTED_AT = Date.parse('2026-09-27T10:00:00.000Z');
const LINK = 'http://localhost:3290/api/auth/magic-link/verify?token=ab123456cd';

let configDirectory;

beforeEach(() => {
  configDirectory = fs.mkdtempSync(path.join(os.tmpdir(), 'lowdefy-journey-email-match-'));
  fs.mkdirSync(path.join(configDirectory, '.lowdefy', 'mail'), { recursive: true });
});

afterEach(() => {
  fs.rmSync(configDirectory, { recursive: true, force: true });
});

function writeMessage({ id, subject, html = null, text = null }) {
  const message = {
    id,
    receivedAt: new Date(STARTED_AT + 1000).toISOString(),
    from: 'app@localhost',
    to: ['ada@example.test'],
    subject,
    html,
    text,
  };
  fs.writeFileSync(
    path.join(configDirectory, '.lowdefy', 'mail', `${id}.json`),
    JSON.stringify(message)
  );
}

const page = { waitForTimeout: jest.fn(async () => {}) };

function read(params) {
  return readJourneyEmailMatch({
    page,
    params: { to: 'ada@example.test', ...params },
    since: STARTED_AT,
    configDirectory,
    timeout: 0,
  });
}

test.each([
  [
    'the first match in the plain-text part',
    { text: `Sign in: ${LINK}\n\nOr enter this code:\n\n482913\n` },
    '\\b\\d{6}\\b',
    '482913',
  ],
  [
    'the first capture group when the pattern has one',
    { text: 'Reference ORD-7731 is ready.' },
    'ORD-(\\d+)',
    '7731',
  ],
  [
    'the text of an HTML-only message, not its link attributes',
    { html: `<a href="${LINK}">Sign in</a><p style="letter-spacing:8px">482913</p>` },
    '\\b\\d{6}\\b',
    '482913',
  ],
])('readJourneyEmailMatch returns %s', async (_, body, match, expected) => {
  writeMessage({ id: '000001', subject: 'Your sign-in link', ...body });
  await expect(read({ match })).resolves.toEqual(expected);
});

test('readJourneyEmailMatch reads the newest message the subject narrows to', async () => {
  writeMessage({ id: '000001', subject: 'Your sign-in link', text: 'Code 111111' });
  writeMessage({ id: '000002', subject: 'Verify your email', text: 'Code 222222' });
  await expect(read({ subject: 'sign-in', match: '\\d{6}' })).resolves.toEqual('111111');
  await expect(read({ match: '\\d{6}' })).resolves.toEqual('222222');
});

test('readJourneyEmailMatch fails with the email text when nothing matches', async () => {
  writeMessage({ id: '000001', subject: 'Your sign-in link', text: 'Click the link.' });

  const error = await read({ match: '\\b\\d{6}\\b' }).catch((caught) => caught);

  expect(error).toBeInstanceOf(JourneyStepError);
  expect(error.message).toEqual(
    'The email "Your sign-in link" to "ada@example.test" has no text matching "\\\\b\\\\d{6}\\\\b".'
  );
  expect(error.expected).toEqual('text matching "\\\\b\\\\d{6}\\\\b"');
  expect(error.actual).toEqual('Click the link.');
});
