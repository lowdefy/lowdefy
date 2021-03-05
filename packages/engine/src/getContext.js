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

import Actions from './Actions';
import Blocks from './Blocks';
import Requests from './Requests';
import State from './State';

const blockData = ({
  areas,
  blockId,
  blocks,
  events,
  field,
  id,
  layout,
  meta,
  pageId,
  properties,
  requests,
  required,
  style,
  type,
  validate,
  visible,
}) => ({
  areas,
  blockId,
  blocks,
  events,
  field,
  id,
  layout,
  meta,
  pageId,
  properties,
  requests,
  required,
  style,
  type,
  validate,
  visible,
});

const getContext = async ({ block, contextId, pageId, rootContext }) => {
  if (rootContext.contexts[contextId]) {
    rootContext.contexts[contextId].update();
    return rootContext.contexts[contextId];
  }
  if (!block) {
    throw new Error('A block must be provided to get context.');
  }
  // eslint-disable-next-line no-param-reassign
  if (!rootContext.input[contextId]) {
    rootContext.input[contextId] = {};
  }
  rootContext.contexts[contextId] = {
    id: contextId,
    blockId: block.blockId,
    eventLog: [],
    pageId,
    requests: {},
    root: rootContext,
    rootBlock: blockData(block), // filter block to prevent circular structure
    showValidationErrors: false,
    state: {},
    update: () => {}, // Initialize update since Requests might call it during context creation
    updateListeners: new Set(),
  };
  const ctx = rootContext.contexts[contextId];
  ctx.parser = new WebParser({ context: ctx, contexts: rootContext.contexts });
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
    [...ctx.updateListeners].forEach((listenId) => {
      // Will loop infinitely if update is called on self
      if (!rootContext.contexts[listenId] || listenId === contextId) {
        ctx.updateListeners.delete(listenId);
      } else {
        rootContext.contexts[listenId].update();
      }
    });
  };
  await ctx.RootBlocks.map[ctx.blockId].triggerEvent({ name: 'onInit' });
  ctx.update();
  ctx.State.freezeState();
  ctx.RootBlocks.map[ctx.blockId].triggerEvent({ name: 'onInitAsync' });
  return ctx;
};

export default getContext;
