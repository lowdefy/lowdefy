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

import SendGridMailSend from './SendGridMailSend';
import { ConfigurationError, RequestError } from '../../../context/errors';
import { testSchema } from '../../../controllers/requestController';

const { resolver, schema } = SendGridMailSend;

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
  const send = await resolver({ request, connection, context });
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
  const send = await resolver({ request, connection, context });
  expect(send).toEqual({
    response: 'Mail sent successfully',
  });
});

test('send a list of different emails', async () => {
  const request = [
    {
      to: 'a@b.com',
      subject: 'A',
      text: 'A',
    },
    {
      to: 'b@b.com',
      subject: 'B',
      text: 'B',
    },
  ];
  const connection = {
    apiKey: 'X',
    from: 'x@y.com',
  };
  const send = await resolver({ request, connection, context });
  expect(send).toEqual({
    response: 'Mail sent successfully',
  });
});

test('Error request with no to', async () => {
  const request = {
    subject: 'A',
    text: 'B',
  };
  await expect(() => testSchema({ schema, object: request })).toThrow(ConfigurationError);
  await expect(() => testSchema({ schema, object: request })).toThrow(
    'SendGridMailSend request properties should be an object or a array describing emails to send.'
  );
});

test('Error request with to is not a email address', async () => {
  const request = {
    subject: 'A',
    text: 'B',
    to: true,
  };
  await expect(() => testSchema({ schema, object: request })).toThrow(ConfigurationError);
  await expect(() => testSchema({ schema, object: request })).toThrow(
    'SendGridMailSend request properties should be an object or a array describing emails to send.'
  );
});

test('Error request with subject is not a string', async () => {
  const request = {
    subject: true,
    text: 'B',
    to: 'a@b.com',
  };
  await expect(() => testSchema({ schema, object: request })).toThrow(ConfigurationError);
  await expect(() => testSchema({ schema, object: request })).toThrow(
    'SendGridMailSend request property "subject" should be a string.; SendGridMailSend request properties should be an object or a array describing emails to send.'
  );
});

test('Error request with text is not a string', async () => {
  const request = {
    text: true,
    to: 'a@b.com',
  };
  await expect(() => testSchema({ schema, object: request })).toThrow(ConfigurationError);
  await expect(() => testSchema({ schema, object: request })).toThrow(
    'SendGridMailSend request properties should be an object or a array describing emails to send.'
  );
});

test('Error request with html is not a string', async () => {
  const request = {
    html: true,
    to: 'a@b.com',
  };
  await expect(() => testSchema({ schema, object: request })).toThrow(ConfigurationError);
  await expect(() => testSchema({ schema, object: request })).toThrow(
    'SendGridMailSend request properties should be an object or a array describing emails to send.'
  );
});

test('Error request with dynamicTemplateData is not an object', async () => {
  const request = {
    dynamicTemplateData: true,
    to: 'a@b.com',
  };
  await expect(() => testSchema({ schema, object: request })).toThrow(ConfigurationError);
  await expect(() => testSchema({ schema, object: request })).toThrow(
    'SendGridMailSend request properties should be an object or a array describing emails to send.'
  );
});
