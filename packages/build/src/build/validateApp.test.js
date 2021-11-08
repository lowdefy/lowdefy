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

test('validateApp success', async () => {
  let components = {
    app: {
      html: {
        appendBody: 'abc',
        appendHead: 'abc',
      },
    },
  };
  let result = await validateApp({ components, context });
  expect(result).toEqual({ app: { html: { appendBody: 'abc', appendHead: 'abc' } } });
  components = {};
  result = await validateApp({ components, context });
  expect(result).toEqual({ app: { html: { appendBody: '', appendHead: '' } } });
  components = {
    app: {},
  };
  result = await validateApp({ components, context });
  expect(result).toEqual({ app: { html: { appendBody: '', appendHead: '' } } });
  components = {
    app: {
      html: {},
    },
  };
  result = await validateApp({ components, context });
  expect(result).toEqual({ app: { html: { appendBody: '', appendHead: '' } } });
});

test('validateApp app not an object', async () => {
  const components = {
    app: 'app',
  };
  await expect(validateApp({ components, context })).rejects.toThrow(
    'lowdefy.app is not an object.'
  );
});
