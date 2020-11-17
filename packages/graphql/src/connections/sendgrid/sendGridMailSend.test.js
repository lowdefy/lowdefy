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
