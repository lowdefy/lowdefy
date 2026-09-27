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
import path from 'node:path';

import getMailOutboxDirectory from '../../lib/docs/getMailOutboxDirectory.js';

/*
With LOWDEFY_DEV_SMTP_PORT set, the dev server receives mail over SMTP on that
loopback port and keeps it instead of delivering it: each message becomes one
JSON file in <app>/.lowdefy/mail/, which journeys (the `email` step), agents and
people read. The app sends through its own SMTP connection, pointed at this
port by its own secrets, so the whole send path - connection config, delivery
filter, nodemailer, templates - runs exactly as in production. The manager owns
the listener so it survives restarts of the server child, and tells each child
it is listening (startServer passes LOWDEFY_SERVER_DEV_MAIL_SINK), so a port
added to .env after start is not mistaken for a running sink. The outbox is
cleared at start, so a test run only ever sees the mail it caused.
*/

function readSmtpPort() {
  const value = process.env.LOWDEFY_DEV_SMTP_PORT;
  if (value === undefined || value === '') {
    return undefined;
  }
  const port = Number(value);
  if (!Number.isInteger(port) || port < 1 || port > 65535) {
    throw new Error(`LOWDEFY_DEV_SMTP_PORT must be a port number. Received "${value}".`);
  }
  return port;
}

async function readStream(stream) {
  const chunks = [];
  for await (const chunk of stream) {
    chunks.push(chunk);
  }
  return Buffer.concat(chunks);
}

function createMessageWriter({ directory, PostalMime }) {
  let sequence = 0;
  return async function writeMessage({ raw, envelope }) {
    // Numbered on arrival, before the parse, so the outbox order is the order
    // the app sent in even when two parses finish out of order.
    sequence += 1;
    const id = String(sequence).padStart(6, '0');
    const parsed = await PostalMime.parse(raw);
    const message = {
      id,
      receivedAt: new Date().toISOString(),
      from: envelope.mailFrom ? envelope.mailFrom.address : null,
      to: envelope.rcptTo.map(({ address }) => address),
      subject: parsed.subject ?? '',
      html: parsed.html ?? null,
      text: parsed.text ?? null,
    };
    const filePath = path.join(directory, `${id}.json`);
    await fs.promises.writeFile(`${filePath}.tmp`, JSON.stringify(message, null, 2));
    await fs.promises.rename(`${filePath}.tmp`, filePath);
  };
}

function listen({ server, port }) {
  return new Promise((resolve, reject) => {
    function onError(error) {
      if (error.code === 'EADDRINUSE') {
        reject(
          new Error(
            `LOWDEFY_DEV_SMTP_PORT ${port} is already in use. Stop the other process or choose another port.`
          )
        );
        return;
      }
      reject(error);
    }
    server.once('error', onError);
    server.listen(port, '127.0.0.1', () => {
      server.removeListener('error', onError);
      resolve();
    });
  });
}

async function startMailSink(context) {
  const port = readSmtpPort();
  if (port === undefined) {
    return null;
  }
  // Loaded only when capture is on: a dev server that never receives mail
  // never loads an SMTP server.
  const [{ default: PostalMime }, { default: smtpServer }] = await Promise.all([
    import('postal-mime'),
    import('smtp-server'),
  ]);
  const directory = getMailOutboxDirectory({ configDirectory: context.directories.config });
  fs.rmSync(directory, { recursive: true, force: true });
  fs.mkdirSync(directory, { recursive: true });
  const writeMessage = createMessageWriter({ directory, PostalMime });

  const server = new smtpServer.SMTPServer({
    authOptional: true,
    disabledCommands: ['AUTH', 'STARTTLS'],
    logger: false,
    onData(stream, session, callback) {
      // The SMTP reply waits for the file, so by the time the app's send
      // resolves the message is readable.
      readStream(stream)
        .then((raw) => writeMessage({ raw, envelope: session.envelope }))
        .then(() => callback(), callback);
    },
  });
  await listen({ server, port });
  server.on('error', (error) => context.logger.error(error));
  context.logger.info(
    `Capturing mail sent to SMTP 127.0.0.1:${port} in ${directory} instead of delivering it.`
  );
  return server;
}

export default startMailSink;
