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

import validateApp from './validateApp';
import testContext from '../test/testContext';

const context = testContext();

test('validateApp success', async () => {
  let components = {
    app: {
      html: {
        appendBody: 'abc',
        appendHeader: 'abc',
      },
    },
  };
  let result = await validateApp({ components, context });
  expect(result).toEqual({ app: { html: { appendBody: 'abc', appendHeader: 'abc' } } });
  components = {};
  result = await validateApp({ components, context });
  expect(result).toEqual({ app: { html: { appendBody: '', appendHeader: '' } } });
  components = {
    app: {},
  };
  result = await validateApp({ components, context });
  expect(result).toEqual({ app: { html: { appendBody: '', appendHeader: '' } } });
  components = {
    app: {
      html: {},
    },
  };
  result = await validateApp({ components, context });
  expect(result).toEqual({ app: { html: { appendBody: '', appendHeader: '' } } });
});

test('validateApp app not an object', async () => {
  const components = {
    app: 'app',
  };
  await expect(validateApp({ components, context })).rejects.toThrow(
    'lowdefy.app is not an object.'
  );
});

test('validateApp config invalid auth config', async () => {
  let components = {
    app: {
      notAllowed: {},
    },
  };
  await expect(validateApp({ components, context })).rejects.toThrow(
    'should NOT have additional properties'
  );
});
