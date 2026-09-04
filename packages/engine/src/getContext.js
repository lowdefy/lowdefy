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

import { nestSchemaPaths } from '@lowdefy/ajv';
import { LowdefyInternalError } from '@lowdefy/errors';
import { type } from '@lowdefy/helpers';
import { WebParser } from '@lowdefy/operators';

import Actions from './Actions.js';
import createPerfCounters from './createPerfCounters.js';
import Slots from './Slots.js';
import Requests from './Requests.js';
import State from './State.js';
import WebSockets from './WebSockets.js';

const blockData = (config) => {
  const {
    slots,
    blockId,
    blocks,
    events,
    field,
    id,
    layout,
    pageId,
    properties,
    requests,
    required,
    stateSchema,
    style,
    subscriptions,
    type,
    validate,
    visible,
  } = config;
  const result = {
    slots,
    blockId,
    blocks,
    events,
    field,
    id,
    layout,
    pageId,
    properties,
    requests,
    required,
    stateSchema,
    style,
    subscriptions,
    type,
    validate,
    visible,
  };
  // Preserve ~k (configKey) for error tracing - it's non-enumerable so must be copied explicitly
  if (config['~k']) {
    Object.defineProperty(result, '~k', {
      value: config['~k'],
      enumerable: false,
      writable: true,
      configurable: true,
    });
  }
  return result;
};

function getContext({
  config,
  jsMap = {},
  lowdefy,
  resetContext = { reset: false, setReset: () => undefined },
}) {
  if (!config) {
    throw new LowdefyInternalError('A page must be provided to get context.');
  }
  const { id } = config;
  // Dynamic pages are server-resolved per request — a context memoized across
  // navigations would render the previous request's content. Rebuild when a
  // new config object arrives (a fresh fetch), but stay memoized across
  // re-renders of the same config: getContext runs in the render body, so
  // rebuilding per render would loop.
  const sameDynamicConfig =
    config.dynamic !== true || lowdefy.contexts[id]?._internal.pageConfig === config;
  if (lowdefy.contexts[id] && !resetContext.reset && sameDynamicConfig) {
    // memoize context if already created, eg between page transitions, unless the reset flag is raised
    lowdefy.contexts[id]._internal.update();
    return lowdefy.contexts[id];
  }
  // Lower the context reset flag — only when raised: setReset is a React
  // state setter on the Reload component, and getContext runs in the render
  // body, so skip the redundant cross-component setState on rebuilds where
  // the flag is already down.
  if (resetContext.reset) {
    resetContext.setReset(false);
  }
  if (!lowdefy.inputs[id]) {
    lowdefy.inputs[id] = {};
  }
  const ctx = {
    id,
    pageId: config.pageId,
    eventLog: [],
    jsMap,
    requests: {},
    state: {},
    // The page state contract, nested into one root JSON schema so blocks can
    // look up their declared type and Validate can check the whole state. Named
    // apart from the artifact's `stateSchema` (the dotted map) because the two
    // are different shapes and were read as one.
    stateSchemaRoot: type.isObject(config.stateSchema)
      ? nestSchemaPaths({ paths: config.stateSchema })
      : undefined,
    _internal: {
      lowdefy,
      // Config object reference for dynamic page memoization — identity marks
      // which fetch this context was built from.
      pageConfig: config,
      rootBlock: blockData(config), // filter block to prevent circular structure
      // Evaluation counters, allocated only for an app that opted in. Every
      // counting site reads this one property, so an app that did not opt in
      // pays a single undefined check per parse and per block visit.
      perf: lowdefy.perf === true ? createPerfCounters() : undefined,
      update: () => {}, // Initialize update since Requests might call it during context creation
      // React updaters register here per block id when the context's Block
      // components mount — scoped per context so rebuilding over a live
      // context (dynamic page navigation, reset) never notifies the previous
      // context's still-mounted components.
      updaters: {},
    },
  };
  const _internal = ctx._internal;
  // A measurement session starts after the page has loaded, so it needs to turn
  // counting on for a context that already exists; a fresh counter set is also
  // how a measurement resets between phases.
  _internal.enablePerf = () => {
    _internal.perf = createPerfCounters();
    return _internal.perf;
  };
  _internal.parser = new WebParser({ context: ctx, operators: lowdefy._internal.operators });
  _internal.State = new State(ctx);
  _internal.Actions = new Actions(ctx);
  _internal.Requests = new Requests(ctx);
  _internal.WebSockets = new WebSockets(ctx);
  _internal.RootSlots = new Slots({
    slots: { root: { blocks: [_internal.rootBlock] } },
    context: ctx,
  });
  _internal.RootSlots.init();
  _internal.update = () => {
    _internal.RootSlots.update();
  };
  _internal.runOnInit = async (progress) => {
    progress();
    if (!_internal.onInitDone) {
      await _internal.RootSlots.slots.root.blocks[0].triggerEvent({
        name: 'onInit',
        progress,
      });
      _internal.update();
      _internal.State.freezeState();
      _internal.onInitDone = true;
    }
  };
  _internal.runOnInitAsync = async (progress) => {
    if (_internal.onInitDone && !_internal.onInitAsyncDone) {
      await _internal.RootSlots.slots.root.blocks[0].triggerEvent({
        name: 'onInitAsync',
        progress,
      });
      _internal.onInitAsyncDone = true;
    }
  };
  ctx._internal.update();
  lowdefy.contexts[id] = ctx;
  return ctx;
}

export default getContext;
