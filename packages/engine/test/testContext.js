/*
   Copyright 2020 Lowdefy, Inc

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
import Mutations from '../src/Mutations';
import Requests from '../src/Requests';
import State from '../src/State';

const testContext = ({ rootContext, rootBlock, pageId, initState, initLowdefyGlobal }) => {
  const ctx = {
    // id: contextId,
    pageId,
    actionLog: [],
    blockId: rootBlock.blockId,
    client: rootContext.client || {},
    displayMessage: rootContext.displayMessage || {
      loading: () => () => {},
      error: () => {},
      success: () => {},
    },
    document: rootContext.document,
    input: rootContext.input || {},
    allInputs: {},
    lowdefyGlobal: initLowdefyGlobal || rootContext.lowdefyGlobal || {},
    menus: rootContext.menus,
    mutations: {},
    requests: {},
    rootBlock,
    routeHistory: [], // init new rootHistory for each test
    showValidationErrors: false,
    state: initState || {},
    urlQuery: rootContext.urlQuery || {},
    updateBlock: rootContext.updateBlock || (() => {}),
    window: rootContext.window,
  };
  ctx.parser = new WebParser({ context: ctx, contexts: {} });
  ctx.State = new State(ctx);
  ctx.Actions = new Actions(ctx);
  ctx.Requests = new Requests(ctx);
  ctx.Mutations = new Mutations(ctx);
  ctx.RootBlocks = new Blocks({
    areas: { root: { blocks: [ctx.rootBlock] } },
    context: ctx,
  });
  ctx.RootBlocks.init();
  ctx.update = () => {
    ctx.RootBlocks.update();
  };
  ctx.update();
  ctx.State.freezeState();
  return ctx;
};

export default testContext;
