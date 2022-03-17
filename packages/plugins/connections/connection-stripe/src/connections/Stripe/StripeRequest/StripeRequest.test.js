/*
  Copyright 2020-2022 Lowdefy, Inc

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

import { validate } from '@lowdefy/ajv';
import StripeRequest from './StripeRequest.js';

const { checkRead, checkWrite } = StripeRequest.meta;
const schema = StripeRequest.schema;

const connection = {
  secretKey: 'foo',
};

jest.mock('stripe', () => {
  return {
    __esModule: true,
    default: function () {
      return {
        customers: {
          list(...args) {
            return args;
          },
          missing: 42,
        },
      };
    },
  };
});

afterEach(() => {
  jest.resetAllMocks();
  jest.restoreAllMocks();
});

test('resource missing', () => {
  const request = {};
  expect(() => validate({ schema, data: request })).toThrow(
    'StripeRequest should contain a resource to call.'
  );
});

test('multiple resources', () => {
  const request = {
    accounts: {},
    customers: {},
  };
  expect(() => validate({ schema, data: request })).toThrow(
    'StripeRequest should contain only a single resource to call.'
  );
});

test('invalid resource type', () => {
  const request = {
    accounts: 'foo',
  };
  expect(() => validate({ schema, data: request })).toThrow(
    'StripeRequest resource should be an object.; StripeRequest resource should only contain a method to call, or sub-resource with a method to call.'
  );
});

test('invalid method type', () => {
  const request = {
    accounts: {
      foo: 'bar',
    },
  };

  expect(() => validate({ schema, data: request })).toThrow(
    'Should be an array of parameters or null.; StripeRequest resource should only contain a method to call, or sub-resource with a method to call.'
  );
});

test('multiple methods', () => {
  const request = {
    accounts: {
      foo: [],
      bar: [],
    },
  };

  expect(() => validate({ schema, data: request })).toThrow(
    'StripeRequest resource should contain only a single method to call.'
  );
});

test('invalid sub-resource type', () => {
  const request = {
    foo: {
      bar: {
        baz: 'quz',
      },
    },
  };

  expect(() => validate({ schema, data: request })).toThrow(
    'Should be an array of parameters or null.; StripeRequest resource should only contain a method to call, or sub-resource with a method to call.'
  );
});

test('multiple sub-resource methods', () => {
  const request = {
    foo: {
      bar: {
        baz: [],
        quz: [],
      },
    },
  };

  expect(() => validate({ schema, data: request })).toThrow(
    'Should be an array of parameters or null.; StripeRequest resource should only contain a method to call, or sub-resource with a method to call.'
  );
});

test('valid request for resource method', () => {
  const request = {
    accounts: {
      foo: [],
    },
  };

  return expect(validate({ schema, data: request })).toEqual({ valid: true });
});

test('valid request for resource method without arguments', () => {
  const request = {
    accounts: {
      foo: null,
    },
  };

  return expect(validate({ schema, data: request })).toEqual({ valid: true });
});

test('valid request for resource method with arguments', () => {
  const request = {
    accounts: {
      foo: ['bar', 42, true, { test: true }],
    },
  };

  return expect(validate({ schema, data: request })).toEqual({ valid: true });
});

test('valid request for sub-resource method', () => {
  const request = {
    foo: {
      bar: {
        baz: [],
      },
    },
  };

  return expect(validate({ schema, data: request })).toEqual({ valid: true });
});

test('valid request for sub-resource method without arguments', () => {
  const request = {
    foo: {
      bar: {
        baz: null,
      },
    },
  };

  return expect(validate({ schema, data: request })).toEqual({ valid: true });
});

test('valid request for sub-resource method with arguments', () => {
  const request = {
    foo: {
      bar: {
        baz: ['bar', 42, true, { test: true }],
      },
    },
  };

  return expect(validate({ schema, data: request })).toEqual({ valid: true });
});

test('valid request for missing resource', async () => {
  const request = {
    foo: {
      bar: [],
    },
  };

  return expect(() => StripeRequest({ request, connection })).rejects.toThrow(
    'Invalid Stripe method foo.bar'
  );
});

test('valid request for missing resource method', async () => {
  const request = {
    customers: {
      foo: [],
    },
  };

  return expect(() => StripeRequest({ request, connection })).rejects.toThrow(
    'Invalid Stripe method customers.foo'
  );
});

test('valid request for missing resource method', async () => {
  const request = {
    customers: {
      missing: [],
    },
  };

  return expect(() => StripeRequest({ request, connection })).rejects.toThrow(
    'Invalid Stripe method customers.missing'
  );
});

test('valid request', async () => {
  const request = {
    customers: {
      list: ['foo', 42, { bar: true }],
    },
  };

  const res = await StripeRequest({ request, connection });

  return expect(res).toEqual(['foo', 42, { bar: true }]);
});

test('checkRead should be false', async () => {
  expect(checkRead).toBe(false);
});

test('checkWrite should be false', async () => {
  expect(checkWrite).toBe(false);
});
