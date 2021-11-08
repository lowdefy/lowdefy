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

import Actions from './Actions.js';
import Blocks from './Blocks.js';
import Requests from './Requests.js';
import State from './State.js';

const blockData = ({
  areas,
  blockId,
  blocks,
  events,
  field,
  id,
  layout,
  meta,
  operators,
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
  operators,
  pageId,
  properties,
  requests,
  required,
  style,
  type,
  validate,
  visible,
});

const getContext = async ({ page, lowdefy }) => {
  if (!page) {
    throw new Error('A page must be provided to get context.');
  }
  const { pageId } = page;
  if (lowdefy.contexts[pageId]) {
    lowdefy.contexts[pageId].update();
    return lowdefy.contexts[pageId];
  }

  if (!lowdefy.inputs[pageId]) {
    lowdefy.inputs[pageId] = {};
  }
  const operatorsSet = new Set([...page.operators, '_not', '_type']);
  lowdefy.contexts[pageId] = {
    id: pageId,
    pageId: pageId,
    eventLog: [],
    requests: {},
    operators: [...operatorsSet],
    lowdefy,
    rootBlock: blockData(page), // filter block to prevent circular structure
    state: {},
    update: () => {}, // Initialize update since Requests might call it during context creation
  };
  const ctx = lowdefy.contexts[pageId];
  ctx.parser = new WebParser({ context: ctx });
  await ctx.parser.init();
  ctx.State = new State(ctx);
  ctx.Actions = new Actions(ctx);
  ctx.Requests = new Requests(ctx);
  // TODO: Remove "areas: { root: { blocks: [ctx.rootBlock] } },"
  ctx.RootBlocks = new Blocks({
    areas: { root: { blocks: [ctx.rootBlock] } },
    context: ctx,
  });
  ctx.RootBlocks.init();
  ctx.update = () => {
    ctx.RootBlocks.update();
  };
  await ctx.RootBlocks.map[ctx.pageId].triggerEvent({ name: 'onInit' });
  ctx.update();
  ctx.State.freezeState();
  ctx.RootBlocks.map[ctx.pageId].triggerEvent({ name: 'onInitAsync' });
  return ctx;
};

export default getContext;
