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

import { ConfigError } from '@lowdefy/errors';

import buildApp from './buildApp.js';
import testContext from '../test-utils/testContext.js';

const context = testContext();

test('buildApp no app defined', () => {
  const components = {};
  const result = buildApp({ components, context });
  expect(result).toEqual({
    app: {
      email: {},
      html: {
        appendBody: '',
        appendHead: '',
      },
    },
  });
});

test('buildApp empty app object', () => {
  const components = { app: {} };
  const result = buildApp({ components, context });
  expect(result).toEqual({
    app: {
      email: {},
      html: {
        appendBody: '',
        appendHead: '',
      },
    },
  });
});

test('buildApp empty html', () => {
  const components = { app: { html: {} } };
  const result = buildApp({ components, context });
  expect(result).toEqual({
    app: {
      email: {},
      html: {
        appendBody: '',
        appendHead: '',
      },
    },
  });
});

test('buildApp appendHead and appendBody', () => {
  const components = {
    app: {
      html: {
        appendBody: 'body',
        appendHead: 'head',
      },
    },
  };
  const result = buildApp({ components, context });
  expect(result).toEqual({
    app: {
      email: {},
      html: {
        appendBody: 'body',
        appendHead: 'head',
      },
    },
  });
});

test('buildApp defaults email companyName from root name', () => {
  const components = { name: 'My App' };
  const result = buildApp({ components, context });
  expect(result.app.email).toEqual({ companyName: 'My App' });
});

test('buildApp keeps explicit email companyName when root name is also set', () => {
  const components = { name: 'My App', app: { email: { companyName: 'Branded Name' } } };
  const result = buildApp({ components, context });
  expect(result.app.email).toEqual({ companyName: 'Branded Name' });
});

test('buildApp keeps explicit empty string companyName as opt-out', () => {
  const components = { name: 'My App', app: { email: { companyName: '' } } };
  const result = buildApp({ components, context });
  expect(result.app.email).toEqual({ companyName: '' });
});

test('buildApp defaults email primaryColor from theme.antd.token.colorPrimary', () => {
  const components = { theme: { antd: { token: { colorPrimary: '#c9a84c' } } } };
  const result = buildApp({ components, context });
  expect(result.app.email).toEqual({ primaryColor: '#c9a84c' });
});

test('buildApp keeps explicit email primaryColor over theme colorPrimary', () => {
  const components = {
    theme: { antd: { token: { colorPrimary: '#c9a84c' } } },
    app: { email: { primaryColor: '#000000' } },
  };
  const result = buildApp({ components, context });
  expect(result.app.email).toEqual({ primaryColor: '#000000' });
});

test('buildApp adds no email defaults when name and theme are missing', () => {
  const components = {};
  const result = buildApp({ components, context });
  expect(result.app.email).toEqual({});
});

test('buildApp adds no email defaults for malformed theme or non-string values', () => {
  expect(buildApp({ components: { theme: {} }, context }).app.email).toEqual({});
  expect(buildApp({ components: { theme: { antd: 'dark' } }, context }).app.email).toEqual({});
  expect(
    buildApp({ components: { theme: { antd: { token: { colorPrimary: 7 } } } }, context }).app.email
  ).toEqual({});
  expect(buildApp({ components: { name: 7 }, context }).app.email).toEqual({});
});

test('buildApp applies both email defaults alongside user-set email fields', () => {
  const components = {
    name: 'My App',
    theme: { antd: { token: { colorPrimary: '#c9a84c' } } },
    app: { email: { logo: 'https://cdn.example.com/logo.png' } },
  };
  const result = buildApp({ components, context });
  expect(result.app.email).toEqual({
    companyName: 'My App',
    primaryColor: '#c9a84c',
    logo: 'https://cdn.example.com/logo.png',
  });
});

test('buildApp throws a ConfigError naming the config location when app is not an object', () => {
  const components = {
    app: 'app',
    '~k': 'root',
  };
  let thrown;
  try {
    buildApp({ components, context });
  } catch (error) {
    thrown = error;
  }
  expect(thrown).toBeInstanceOf(ConfigError);
  expect(thrown.message).toBe('lowdefy.app is not an object.');
  expect(thrown.received).toBe('app');
  expect(thrown.configKey).toBe('root');
});

test('buildApp does not set appMeta', () => {
  const components = { slug: 'my-app', name: 'My App' };
  const result = buildApp({ components, context });
  expect(result.appMeta).toBeUndefined();
});
