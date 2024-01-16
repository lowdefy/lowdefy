/*
  Copyright 2020-2024 Lowdefy, Inc

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

import buildTestPage from '@lowdefy/build/buildTestPage';

import getContext from '../src/getContext.js';
import testOperators from './testOperators.js';
import testActions from './testActions.js';

const testContext = async ({ lowdefy, pageConfig }) => {
  const testLowdefy = {
    contexts: {},
    inputs: {},
    urlQuery: {},
    lowdefyGlobal: {},
    home: {},
    menus: [],
    user: {},
    ...lowdefy,
    _internal: {
      callRequest: () => {},
      displayMessage: () => () => {},
      updateBlock: () => {},
      ...lowdefy?._internal,
      operators: testOperators,
      actions: { ...testActions, ...lowdefy?._internal?.actions },
      blockComponents: {
        TextInput: {
          meta: {
            category: 'input',
            valueType: 'string',
          },
        },
        Box: {
          meta: {
            category: 'container',
          },
        },
        Button: {
          meta: {
            category: 'display',
          },
        },
        List: {
          meta: {
            category: 'list',
            valueType: 'array',
          },
        },
        Paragraph: {
          meta: {
            category: 'display',
          },
        },
        Switch: {
          meta: {
            category: 'input',
            valueType: 'boolean',
          },
        },
        MultipleSelector: {
          meta: {
            category: 'input',
            valueType: 'array',
          },
        },
        NumberInput: {
          meta: {
            category: 'input',
            valueType: 'number',
          },
        },
        ...lowdefy?._internal?.blocks,
      },
    },
  };
  const buildConfig = buildTestPage({ pageConfig });
  const ctx = getContext({
    lowdefy: testLowdefy,
    config: buildConfig,
    resetContext: { reset: true, setReset: () => {} },
  });
  await ctx._internal.runOnInit(() => {});
  await ctx._internal.runOnInitAsync(() => {});
  return ctx;
};

export default testContext;
