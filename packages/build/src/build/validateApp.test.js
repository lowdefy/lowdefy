/*
  Copyright 2020-2021 Lowdefy, Inc

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

import validateApp from './validateApp.js';
import testContext from '../test/testContext.js';

const context = testContext();

test('validateApp no app defined', async () => {
  const components = {};
  const result = await validateApp({ components, context });
  expect(result).toEqual({
    app: {
      html: {
        appendBody: '',
        appendHead: '',
      },
      style: {},
    },
  });
});

test('validateApp empty app object', async () => {
  const components = { app: {} };
  const result = await validateApp({ components, context });
  expect(result).toEqual({
    app: {
      html: {
        appendBody: '',
        appendHead: '',
      },
      style: {},
    },
  });
});

test('validateApp empty html', async () => {
  const components = { app: { html: {} } };
  const result = await validateApp({ components, context });
  expect(result).toEqual({
    app: {
      html: {
        appendBody: '',
        appendHead: '',
      },
      style: {},
    },
  });
});

test('validateApp appendHead and appendHead', async () => {
  const components = {
    app: {
      html: {
        appendBody: 'body',
        appendHead: 'head',
      },
    },
  };
  const result = await validateApp({ components, context });
  expect(result).toEqual({
    app: {
      html: {
        appendBody: 'body',
        appendHead: 'head',
      },
      style: {},
    },
  });
});

test('validateApp style', async () => {
  const components = {
    app: {
      style: {
        lessVariables: {
          'primary-color': '#FF00FF',
        },
      },
    },
  };
  const result = await validateApp({ components, context });
  expect(result).toEqual({
    app: {
      html: {
        appendBody: '',
        appendHead: '',
      },
      style: {
        lessVariables: {
          'primary-color': '#FF00FF',
        },
      },
    },
  });
});

test('validateApp app not an object', async () => {
  const components = {
    app: 'app',
  };
  await expect(validateApp({ components, context })).rejects.toThrow(
    'lowdefy.app is not an object.'
  );
});
