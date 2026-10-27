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

import { expect, test } from 'vitest';
import buildTypesMobile from './buildTypesMobile.js';
import testContext from '../test-utils/testContext.js';

function createContext() {
  const context = testContext();
  context.warnings = [];
  context.typesMapMobile = {
    actions: { SetState: { package: '@lowdefy/actions-core', version: '6.0.0' } },
    blocks: { Title: { package: '@lowdefy/blocks-native', version: '6.0.0' } },
    operators: {
      client: {
        _not: { package: '@lowdefy/operators-js' },
        _type: { package: '@lowdefy/operators-js' },
      },
    },
  };
  return context;
}

test('buildTypesMobile stores the native types mobile pages use and the mandatory operators', () => {
  const context = createContext();
  context.typeCountersMobile.blocks.increment('Title');
  context.typeCountersMobile.actions.increment('SetState');
  buildTypesMobile({ components: { pages: [{ target: 'mobile' }] }, context });
  expect(context.typesMobile).toEqual({
    actions: {
      SetState: {
        originalTypeName: 'SetState',
        package: '@lowdefy/actions-core',
        version: '6.0.0',
        count: 1,
      },
    },
    blocks: {
      Title: {
        originalTypeName: 'Title',
        package: '@lowdefy/blocks-native',
        version: '6.0.0',
        count: 1,
      },
    },
    operators: {
      client: {
        _not: { originalTypeName: '_not', package: '@lowdefy/operators-js', count: 1 },
        _type: { originalTypeName: '_type', package: '@lowdefy/operators-js', count: 1 },
      },
    },
  });
});

test('buildTypesMobile builds empty stores for an app without mobile pages', () => {
  const context = createContext();
  buildTypesMobile({ components: { pages: [{ target: 'web' }] }, context });
  expect(context.typesMobile).toEqual({ actions: {}, blocks: {}, operators: { client: {} } });
});

test('buildTypesMobile leaves out block types validateNativePageTypes reported', () => {
  const context = createContext();
  context.typeCountersMobile.blocks.increment('AgGridAlpine');
  buildTypesMobile({ components: { pages: [{ target: 'mobile' }] }, context });
  expect(context.typesMobile.blocks).toEqual({});
});

test('buildTypesMobile warns about an operator the native map lacks', () => {
  const context = createContext();
  context.typeCountersMobile.operators.client.increment('_unknown_op');
  buildTypesMobile({ components: { pages: [{ target: 'mobile' }] }, context });
  expect(context.warnings.map((warning) => warning.message)).toEqual([
    'Operator type "_unknown_op" was used but is not defined.',
  ]);
});
