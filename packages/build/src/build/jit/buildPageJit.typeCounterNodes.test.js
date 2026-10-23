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

import { vi, expect, test } from 'vitest';

const realNodeUtils = await import('@lowdefy/node-utils');
vi.doMock('@lowdefy/node-utils', () => ({
  ...realNodeUtils,
  writeFile: vi.fn().mockResolvedValue(undefined),
  writeFileIfChanged: vi.fn().mockResolvedValue(true),
}));

const pageBuildContexts = [];
const { default: realCreatePageBuildContext } = await import('./createPageBuildContext.js');
vi.doMock('./createPageBuildContext.js', () => ({
  default: (keptContext) => {
    const pageBuildContext = realCreatePageBuildContext(keptContext);
    pageBuildContexts.push(pageBuildContext);
    return pageBuildContext;
  },
}));

const { default: testContext } = await import('../../test-utils/testContext.js');
const { snapshotTypesMap } = await import('../../test-utils/runBuildForSnapshots.js');
const { default: makeId } = await import('../../utils/makeId.js');
const { default: buildPageJit } = await import('./buildPageJit.js');

test('buildPageJit records nodes on the page build context counters', async () => {
  makeId.reset();
  const context = testContext({
    readConfigFile: () => `
id: home
type: Box
blocks:
  - id: title
    type: Title
    properties:
      content:
        _if:
          test:
            _state: flag
          then: Yes
          else: No
    events:
      onClick:
        - id: set
          type: SetState
          params:
            flag: true
`,
    writeBuildArtifact: vi.fn().mockResolvedValue(undefined),
  });
  context.errors = [];
  context.typesMap = snapshotTypesMap;
  context.unresolvedRefVars = {};
  const pageRegistry = new Map([
    [
      'home',
      {
        pageId: 'home',
        auth: { public: true },
        refId: 'ref-home',
        refPath: 'home.yaml',
        unresolvedVars: null,
      },
    ],
  ]);

  const page = await buildPageJit({ pageId: 'home', pageRegistry, context });

  expect(pageBuildContexts).toHaveLength(1);
  const { typeCounters } = pageBuildContexts[0];
  const [title] = typeCounters.blocks.getNodes('Title');
  expect(title.blockId).toBe('title');
  expect(page.slots.content.blocks[0].blockId).toBe('title');
  expect(typeCounters.blocks.getNodes('Box')).toHaveLength(1);
  expect(typeCounters.actions.getNodes('SetState').map((action) => action.id)).toEqual(['set']);
  const ifNodes = typeCounters.operators.client.getNodes('_if');
  expect(ifNodes).toHaveLength(1);
  expect(ifNodes[0]._if.then).toBe('Yes');
  expect(context.typeCounters.blocks.getNodes('Title')).toEqual([]);
});
