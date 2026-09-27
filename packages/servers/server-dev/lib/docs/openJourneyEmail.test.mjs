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
import openJourneyEmail from './openJourneyEmail.js';

const STARTED_AT = Date.parse('2026-09-27T10:00:00.000Z');

let configDirectory;
let outbox;

beforeEach(() => {
  configDirectory = fs.mkdtempSync(path.join(os.tmpdir(), 'lowdefy-journey-email-'));
  outbox = path.join(configDirectory, '.lowdefy', 'mail');
  fs.mkdirSync(outbox, { recursive: true });
});

afterEach(() => {
  fs.rmSync(configDirectory, { recursive: true, force: true });
});

function writeMessage({ id, to, subject, secondsAfterStart = 1, html, text = null }) {
  const message = {
    id,
    receivedAt: new Date(STARTED_AT + secondsAfterStart * 1000).toISOString(),
    from: 'app@localhost',
    to,
    subject,
    html:
      html === undefined ? `<a href="http://localhost/${id}" target="_blank">Open ${id}</a>` : html,
    text,
  };
  fs.writeFileSync(path.join(outbox, `${id}.json`), JSON.stringify(message));
}

function createPage({ onWait = () => {} } = {}) {
  const page = {
    opened: [],
    goto: jest.fn(async (url) => {
      const base64 = url.slice('data:text/html;charset=utf-8;base64,'.length);
      page.opened.push(Buffer.from(base64, 'base64').toString());
    }),
    evaluate: jest.fn(async () => {}),
    waitForTimeout: jest.fn(async () => onWait()),
  };
  return page;
}

test.each([
  ['the newest message to the address', { to: 'ada@example.test' }, '000003'],
  ['an address in any case', { to: 'ADA@Example.Test' }, '000003'],
  [
    'the newest subject containing the text',
    { to: 'ada@example.test', subject: 'Verify' },
    '000001',
  ],
  ['a later recipient of a message sent to several', { to: 'bob@example.test' }, '000002'],
])('openJourneyEmail opens %s', async (_, params, expectedId) => {
  writeMessage({
    id: '000000',
    to: ['ada@example.test'],
    subject: 'Verify',
    secondsAfterStart: -5,
  });
  writeMessage({ id: '000001', to: ['ada@example.test'], subject: 'Verify your email' });
  writeMessage({
    id: '000002',
    to: ['ada@example.test', 'bob@example.test'],
    subject: 'Your sign-in link',
  });
  writeMessage({ id: '000003', to: ['ada@example.test'], subject: 'Invited' });
  const page = createPage();

  await openJourneyEmail({ page, params, since: STARTED_AT, configDirectory, timeout: 1000 });

  expect(page.opened).toEqual([
    `<a href="http://localhost/${expectedId}" target="_blank">Open ${expectedId}</a>`,
  ]);
  // Links open where the email is, since each actor drives one tab.
  const link = { removeAttribute: jest.fn() };
  global.document = { querySelectorAll: jest.fn(() => [link]) };
  await page.evaluate.mock.calls[0][0]();
  delete global.document;
  expect(link.removeAttribute).toHaveBeenCalledWith('target');
});

test('openJourneyEmail waits for a message that arrives after the step starts', async () => {
  const page = createPage({
    onWait: () => writeMessage({ id: '000001', to: ['ada@example.test'], subject: 'Verify' }),
  });

  await openJourneyEmail({
    page,
    params: { to: 'ada@example.test' },
    since: STARTED_AT,
    configDirectory,
    timeout: 5000,
  });

  expect(page.waitForTimeout).toHaveBeenCalledTimes(1);
  expect(page.opened).toHaveLength(1);
});

test('openJourneyEmail shows a text-only message escaped in a pre block', async () => {
  writeMessage({
    id: '000001',
    to: ['ada@example.test'],
    subject: 'Code',
    html: null,
    text: 'Your code is <1234> & "5"',
  });
  const page = createPage();

  await openJourneyEmail({
    page,
    params: { to: 'ada@example.test' },
    since: STARTED_AT,
    configDirectory,
    timeout: 1000,
  });

  expect(page.opened).toEqual(['<pre>Your code is &#60;1234&#62; &#38; &#34;5&#34;</pre>']);
});

const OLD_MESSAGE = {
  id: '000000',
  to: ['ada@example.test'],
  subject: 'Old',
  secondsAfterStart: -5,
};
const OTHER_MESSAGE = { id: '000001', to: ['bob@example.test'], subject: 'Verify your email' };

test.each([
  [
    'names the messages this journey received',
    [OLD_MESSAGE, OTHER_MESSAGE],
    { to: 'ada@example.test', subject: 'Verify' },
    'an email to "ada@example.test" with a subject containing "Verify"',
    ['"Verify your email" to bob@example.test'],
  ],
  [
    'says so when the journey received no mail at all',
    [OLD_MESSAGE],
    { to: 'ada@example.test' },
    'an email to "ada@example.test"',
    'no email received during this journey',
  ],
])(
  'openJourneyEmail fails when none matches and %s',
  async (_, messages, params, expected, actual) => {
    messages.forEach(writeMessage);
    const page = createPage();

    const error = await openJourneyEmail({
      page,
      params,
      since: STARTED_AT,
      configDirectory,
      timeout: 0,
    }).catch((caught) => caught);

    expect(error).toBeInstanceOf(JourneyStepError);
    expect(error.message).toEqual(`Timed out after 0ms waiting for ${expected}.`);
    expect(error.expected).toEqual(expected);
    expect(error.actual).toEqual(actual);
    expect(page.opened).toEqual([]);
  }
);
