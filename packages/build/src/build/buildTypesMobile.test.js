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

import buildTypesMobile from './buildTypesMobile.js';
import testContext from '../test-utils/testContext.js';

const basicAndLoaderBlocks = {
  Anchor: { package: '@lowdefy/blocks-basic', version: '1.0.0' },
  Box: { package: '@lowdefy/blocks-basic', version: '1.0.0' },
  DangerousHtml: { package: '@lowdefy/blocks-basic', version: '1.0.0' },
  Dynamic: { package: '@lowdefy/blocks-basic', version: '1.0.0' },
  Html: { package: '@lowdefy/blocks-basic', version: '1.0.0' },
  Icon: { package: '@lowdefy/blocks-basic', version: '1.0.0' },
  Img: { package: '@lowdefy/blocks-basic', version: '1.0.0' },
  Span: { package: '@lowdefy/blocks-basic', version: '1.0.0' },
  Throw: { package: '@lowdefy/blocks-basic', version: '1.0.0' },
  ProgressBar: { package: '@lowdefy/blocks-loaders', version: '1.0.0' },
  Skeleton: { package: '@lowdefy/blocks-loaders', version: '1.0.0' },
  SkeletonAvatar: { package: '@lowdefy/blocks-loaders', version: '1.0.0' },
  SkeletonButton: { package: '@lowdefy/blocks-loaders', version: '1.0.0' },
  SkeletonInput: { package: '@lowdefy/blocks-loaders', version: '1.0.0' },
  SkeletonParagraph: { package: '@lowdefy/blocks-loaders', version: '1.0.0' },
  Spinner: { package: '@lowdefy/blocks-loaders', version: '1.0.0' },
};

const typesMapMobile = {
  actions: {
    SetState: { package: '@lowdefy/actions-core', version: '1.0.0' },
  },
  blocks: {
    ...basicAndLoaderBlocks,
    Button: { package: '@lowdefy/blocks-antd-mobile', version: '1.0.0' },
    List: { package: '@lowdefy/blocks-antd-mobile', version: '1.0.0' },
    Message: { package: '@lowdefy/blocks-antd-mobile', version: '1.0.0' },
    NavBar: { package: '@lowdefy/blocks-antd-mobile', version: '1.0.0' },
  },
  icons: {},
  blockMetas: {},
  operators: {
    client: {
      _not: { package: '@lowdefy/operators-js', version: '1.0.0' },
      _type: { package: '@lowdefy/operators-js', version: '1.0.0' },
    },
    server: {},
  },
};

test('buildTypesMobile force-adds Message, basic and loader blocks', () => {
  const context = testContext({ typesMapMobile });
  const components = { mobile: { configured: true } };
  buildTypesMobile({ components, context });
  expect(components.typesMobile.blocks.Message).toEqual({
    originalTypeName: 'Message',
    package: '@lowdefy/blocks-antd-mobile',
    version: '1.0.0',
    count: 1,
  });
  expect(components.typesMobile.blocks.Box.package).toEqual('@lowdefy/blocks-basic');
  expect(components.typesMobile.blocks.Spinner.package).toEqual('@lowdefy/blocks-loaders');
  expect(components.typesMobile.operators.client._not.package).toEqual('@lowdefy/operators-js');
});

test('buildTypesMobile resolves counted mobile blocks against the mobile map', () => {
  const context = testContext({ typesMapMobile });
  context.typeCountersMobile.blocks.increment('NavBar');
  context.typeCountersMobile.blocks.increment('Button');
  context.typeCountersMobile.actions.increment('SetState');
  const components = { mobile: { configured: true } };
  buildTypesMobile({ components, context });
  expect(components.typesMobile.blocks.NavBar.package).toEqual('@lowdefy/blocks-antd-mobile');
  expect(components.typesMobile.blocks.Button.count).toEqual(1);
  expect(components.typesMobile.actions.SetState.package).toEqual('@lowdefy/actions-core');
});

test('buildTypesMobile throws when a counted block type is not in the mobile map', () => {
  const context = testContext({ typesMapMobile });
  context.typeCountersMobile.blocks.increment('AgGridAlpine');
  const components = { mobile: { configured: true } };
  expect(() => buildTypesMobile({ components, context })).toThrow(
    'Block type "AgGridAlpine" was used but is not defined.'
  );
});

test('buildTypesMobile does not include web-counted blocks', () => {
  const context = testContext({ typesMapMobile });
  context.typeCounters.blocks.increment('Title');
  const components = { mobile: { configured: true } };
  buildTypesMobile({ components, context });
  expect(components.typesMobile.blocks.Title).toBeUndefined();
});

test('buildTypesMobile skips mandatory types when mobile is not configured', () => {
  const context = testContext({ typesMapMobile });
  const components = { mobile: { configured: false } };
  buildTypesMobile({ components, context });
  expect(components.typesMobile).toEqual({
    actions: {},
    blocks: {},
    operators: { client: {} },
  });
});
