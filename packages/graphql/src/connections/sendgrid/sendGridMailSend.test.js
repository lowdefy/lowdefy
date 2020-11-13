/*
  Copyright 2020 Lowdefy, Inc

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

import sendGridMailSend from './sendGridMailSend';
import { ConfigurationError, RequestError } from '../../context/errors';

const context = { ConfigurationError, RequestError };

jest.mock('@sendgrid/mail', () => ({
  setApiKey: jest.fn(),
  send: (msg) => {
    if (msg.templateId === 'template error') {
      throw new Error({ response: { body: 'Error test' } });
    }
    return Promise.resolve(msg);
  },
}));

afterEach(() => {
  jest.resetAllMocks();
  jest.restoreAllMocks();
});

test('send with valid request and connection', async () => {
  const request = {
    to: 'a@b.com',
    subject: 'A',
    text: 'B',
  };
  const connection = {
    apiKey: 'X',
    from: { name: 'a@b.om', email: 'a.cc@mm.co' },
  };
  const send = await sendGridMailSend({ request, connection, context });
  expect(send).toEqual({
    response: 'Mail sent successfully',
  });
});

test('send to list of emails', async () => {
  const request = {
    to: ['a@b.com', 'aaa bbb <aaa@bbb.com>', { name: 'ccc', email: 'ddd@eee.com' }],
    subject: 'A',
    text: 'B',
  };
  const connection = {
    apiKey: 'X',
    from: 'x@y.com',
  };
  const send = await sendGridMailSend({ request, connection, context });
  expect(send).toEqual({
    response: 'Mail sent successfully',
  });
});

test('Error connection with no from address', async () => {
  const request = {
    to: 'a@b.com',
    subject: 'A',
    text: 'B',
  };
  const connection = {
    apiKey: 'X',
  };
  expect(sendGridMailSend({ request, connection, context })).rejects.toThrow();
});

test('Error connection with no apiKey', async () => {
  const request = {
    to: 'a@b.com',
    subject: 'A',
    text: 'B',
  };
  const connection = {
    from: 'x@y.com',
  };
  expect(sendGridMailSend({ request, connection, context })).rejects.toThrow();
});

test('Error request with no to', async () => {
  const request = {
    subject: 'A',
    text: 'B',
  };
  const connection = {
    apiKey: 'X',
    from: 'x@y.com',
  };
  expect(sendGridMailSend({ request, connection, context })).rejects.toThrow();
});

test('Error request with invalid email string', async () => {
  const request = {
    to: 'name <a@b.com',
    subject: 'A',
    text: 'B',
  };
  const connection = {
    apiKey: 'X',
    from: 'x@y.com',
  };
  expect(sendGridMailSend({ request, connection, context })).rejects.toThrow();
});

test('Error connection with invalid template id', async () => {
  const request = {
    to: 'name <a@b.com>',
    subject: 'A',
    text: 'B',
  };
  const connection = {
    apiKey: 'X',
    from: 'x@y.com',
    templateId: 'template error',
  };
  expect(sendGridMailSend({ request, connection, context })).rejects.toThrow();
});
