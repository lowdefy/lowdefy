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

test('buildApp app not an object', () => {
  const components = {
    app: 'app',
  };
  expect(() => buildApp({ components, context })).toThrow('lowdefy.app is not an object.');
});

test('buildApp does not set appMeta', () => {
  const components = { slug: 'my-app', name: 'My App' };
  const result = buildApp({ components, context });
  expect(result.appMeta).toBeUndefined();
});
