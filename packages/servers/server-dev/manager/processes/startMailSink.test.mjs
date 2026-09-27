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
import net from 'node:net';
import os from 'node:os';
import path from 'node:path';

import { jest } from '@jest/globals';
import nodemailer from 'nodemailer';

import readMailOutbox from '../../lib/docs/readMailOutbox.js';

const { default: startMailSink } = await import('./startMailSink.mjs');

function getFreePort() {
  return new Promise((resolve) => {
    const server = net.createServer();
    server.listen(0, '127.0.0.1', () => {
      const { port } = server.address();
      server.close(() => resolve(port));
    });
  });
}

let configDirectory;
let sink;

beforeEach(() => {
  configDirectory = fs.mkdtempSync(path.join(os.tmpdir(), 'lowdefy-mail-sink-'));
});

afterEach(async () => {
  if (sink) {
    await new Promise((resolve) => sink.close(resolve));
  }
  sink = undefined;
  delete process.env.LOWDEFY_DEV_SMTP_PORT;
  fs.rmSync(configDirectory, { recursive: true, force: true });
});

function createContext() {
  return {
    directories: { config: configDirectory },
    logger: { info: jest.fn(), error: jest.fn() },
  };
}

test('startMailSink keeps a message sent through nodemailer with its recipients, subject and links intact', async () => {
  const port = await getFreePort();
  process.env.LOWDEFY_DEV_SMTP_PORT = String(port);
  const staleDirectory = path.join(configDirectory, '.lowdefy', 'mail');
  fs.mkdirSync(staleDirectory, { recursive: true });
  fs.writeFileSync(path.join(staleDirectory, '000001.json'), '{"subject":"previous run"}');
  sink = await startMailSink(createContext());

  // Long enough that quoted-printable folds it across lines, and full of `=`,
  // which quoted-printable escapes: the stored link must still be the one sent.
  const link = `http://localhost:3210/api/auth/verify-email?token=${'eyJhbGciOiJIUzI1NiJ9'.repeat(
    8
  )}&callbackURL=%2Fverify-email`;
  const transport = nodemailer.createTransport({ host: '127.0.0.1', port, secure: false });
  await transport.sendMail({
    from: 'app@localhost',
    to: 'Ada Lovelace <ada@example.test>',
    bcc: 'audit@example.test',
    subject: 'Verify your email address — café',
    html: `<p>Hello</p><a href="${link}" target="_blank">Verify email address</a>`,
    text: `Verify: ${link}`,
  });
  transport.close();

  const messages = await readMailOutbox({ configDirectory });
  expect(messages).toHaveLength(1);
  expect(messages[0]).toMatchObject({
    id: '000001',
    from: 'app@localhost',
    to: ['ada@example.test', 'audit@example.test'],
    subject: 'Verify your email address — café',
  });
  expect(messages[0].text.trim()).toEqual(`Verify: ${link}`);
  expect(messages[0].html).toContain(`href="${link}"`);
  expect(Number.isNaN(Date.parse(messages[0].receivedAt))).toBe(false);
});

test('startMailSink numbers messages in the order they arrive', async () => {
  const port = await getFreePort();
  process.env.LOWDEFY_DEV_SMTP_PORT = String(port);
  sink = await startMailSink(createContext());
  const transport = nodemailer.createTransport({ host: '127.0.0.1', port, secure: false });
  await transport.sendMail({ from: 'app@localhost', to: 'a@example.test', subject: 'First' });
  await transport.sendMail({ from: 'app@localhost', to: 'a@example.test', subject: 'Second' });
  transport.close();

  const messages = await readMailOutbox({ configDirectory });
  expect(messages.map(({ id, subject }) => [id, subject])).toEqual([
    ['000001', 'First'],
    ['000002', 'Second'],
  ]);
});

test('startMailSink starts nothing and leaves the outbox alone when LOWDEFY_DEV_SMTP_PORT is unset', async () => {
  const outbox = path.join(configDirectory, '.lowdefy', 'mail');
  fs.mkdirSync(outbox, { recursive: true });
  fs.writeFileSync(path.join(outbox, '000001.json'), '{}');
  expect(await startMailSink(createContext())).toBe(null);
  expect(fs.readdirSync(outbox)).toEqual(['000001.json']);
});

test.each(['smtp', '2525.5', '0', '70000'])(
  'startMailSink rejects LOWDEFY_DEV_SMTP_PORT "%s"',
  async (value) => {
    process.env.LOWDEFY_DEV_SMTP_PORT = value;
    await expect(startMailSink(createContext())).rejects.toThrow(
      `LOWDEFY_DEV_SMTP_PORT must be a port number. Received "${value}".`
    );
  }
);

test('startMailSink fails with the port when LOWDEFY_DEV_SMTP_PORT is taken', async () => {
  const blocker = net.createServer();
  const port = await new Promise((resolve) => {
    blocker.listen(0, '127.0.0.1', () => resolve(blocker.address().port));
  });
  process.env.LOWDEFY_DEV_SMTP_PORT = String(port);
  try {
    await expect(startMailSink(createContext())).rejects.toThrow(
      `LOWDEFY_DEV_SMTP_PORT ${port} is already in use.`
    );
  } finally {
    await new Promise((resolve) => blocker.close(resolve));
  }
});
