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
