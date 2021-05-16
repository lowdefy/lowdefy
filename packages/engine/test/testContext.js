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

import { WebParser } from '@lowdefy/operators';

import Actions from '../src/Actions';
import Blocks from '../src/Blocks';
import Requests from '../src/Requests';
import State from '../src/State';

const testContext = async ({ lowdefy, rootBlock, initState = {} }) => {
  const testLowdefy = {
    displayMessage: () => () => undefined,
    inputs: { test: {} },
    pageId: rootBlock.blockId,
    updateBlock: () => {},
    urlQuery: {},
    imports: {
      jsActions: {},
      jsOperators: {},
    },
    ...lowdefy,
  };
  const ctx = {
    id: 'test',
    blockId: rootBlock.blockId,
    eventLog: [],
    requests: {},
    lowdefy: testLowdefy,
    rootBlock,
    pageId: rootBlock.blockId,
    // routeHistory: [], // init new routeHistory for each test
    showValidationErrors: false,
    state: {},
    updateListeners: new Set(),
  };
  ctx.parser = new WebParser({ context: ctx, contexts: {} });
  ctx.operators = Object.keys(ctx.parser.operators);
  await ctx.parser.init();
  ctx.State = new State(ctx);
  ctx.Actions = new Actions(ctx);
  ctx.Requests = new Requests(ctx);
  ctx.RootBlocks = new Blocks({
    areas: { root: { blocks: [ctx.rootBlock] } },
    context: ctx,
  });
  ctx.RootBlocks.init();
  ctx.update = () => {
    ctx.RootBlocks.update();
  };
  if (initState) {
    Object.keys(initState).forEach((key) => {
      ctx.State.set(key, initState[key]);
    });
    ctx.RootBlocks.reset();
  }
  ctx.update();
  ctx.State.freezeState();
  return ctx;
};

export default testContext;
