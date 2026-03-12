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
      logger: { error: () => {}, warn: () => {}, log: () => {}, debug: () => {} },
      handleError: () => {},
      ...lowdefy?._internal,
      operators: testOperators,
      actions: { ...testActions, ...lowdefy?._internal?.actions },
      blockComponents: {
        TextInput: {},
        Box: {},
        Button: {},
        List: {},
        Paragraph: {},
        Switch: {},
        MultipleSelector: {},
        NumberInput: {},
        ...lowdefy?._internal?.blocks,
      },
      blockMetas: {
        TextInput: { category: 'input', valueType: 'string' },
        Box: { category: 'container' },
        Button: { category: 'display' },
        List: { category: 'list', valueType: 'array' },
        Paragraph: { category: 'display' },
        Switch: { category: 'input', valueType: 'boolean' },
        MultipleSelector: { category: 'input', valueType: 'array' },
        NumberInput: { category: 'input', valueType: 'number' },
        ...lowdefy?._internal?.blockMetas,
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
