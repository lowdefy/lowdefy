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

import http from 'node:http';

import sendgrid from '@sendgrid/mail';

import send from './send.js';

// The real SendGrid client against a local endpoint (the other send tests mock it), so
// a client upgrade is checked for the request it sends and the errors it throws.
let server;
let reply;
let received;

beforeAll(async () => {
  server = http.createServer((req, res) => {
    let body = '';
    req.on('data', (chunk) => {
      body += chunk;
    });
    req.on('end', () => {
      received = { url: req.url, authorization: req.headers.authorization, body: JSON.parse(body) };
      res.writeHead(reply.status, { 'content-type': 'application/json', ...reply.headers });
      res.end(reply.body ? JSON.stringify(reply.body) : '');
    });
  });
  await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
  // setApiKey resets the base URL to SendGrid's, so the local endpoint is set after it.
  const baseUrl = `http://127.0.0.1:${server.address().port}`;
  const setApiKey = sendgrid.client.setApiKey.bind(sendgrid.client);
  sendgrid.client.setApiKey = (apiKey) => {
    setApiKey(apiKey);
    sendgrid.client.setDefaultRequest('baseUrl', baseUrl);
  };
});

afterAll(() => new Promise((resolve) => server.close(resolve)));

const connection = { apiKey: 'SG.test', from: 'from@example.com' };
const mail = { to: 'to@example.com', subject: 'Hello', text: 'Hi' };

test('send posts the mail with the api key and returns the message id', async () => {
  reply = { status: 202, headers: { 'x-message-id': 'message-1' } };
  const result = await send({ connection, mail });
  expect(result).toEqual({ messageId: 'message-1', to: 'to@example.com' });
  expect(received.url).toBe('/v3/mail/send');
  expect(received.authorization).toBe('Bearer SG.test');
  expect(received.body.personalizations).toEqual([{ to: [{ email: 'to@example.com' }] }]);
  expect(received.body.from).toEqual({ email: 'from@example.com' });
});

test('send rejects a rate-limited send with the status and Retry-After the error classification reads', async () => {
  reply = {
    status: 429,
    headers: { 'retry-after': '10' },
    body: { errors: [{ message: 'Too many requests, slow down.' }] },
  };
  const error = await send({ connection, mail }).catch((e) => e);
  expect(error.code).toBe(429);
  expect(error.message).toBe('Too Many Requests Too many requests, slow down.');
  expect(error.response.headers.get('retry-after')).toBe('10');
});
