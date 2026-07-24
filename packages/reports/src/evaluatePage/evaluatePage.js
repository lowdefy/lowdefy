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

import getContext from '@lowdefy/engine';
import { serializer } from '@lowdefy/helpers';

import createHeadlessLowdefy from './createHeadlessLowdefy.js';

const noop = () => undefined;

/**
 * Drive the engine through one full headless page evaluation and return the
 * evaluated block tree. This runs the same `getContext` → `runOnInit` →
 * `runOnInitAsync` flow the browser client runs, then drains outstanding
 * requests so every `propertiesEval`/`visibleEval`/`layoutEval` reflects the
 * responses.
 *
 * `options` are the `createHeadlessLowdefy` options (task 2), including the
 * built `pageConfig`, the injected `callRequest`, and the `seed` snapshot
 * `{ urlQuery, input, state }`. The factory bakes `seed.urlQuery` into the
 * synthetic window; this function seeds `seed.input` and `seed.state` into the
 * context.
 *
 * WYSIWYG contract: state seeds AFTER `getContext` (the context and its
 * `inputs` entry exist by then) but BEFORE `onInit`, so init request payloads
 * reading `_state`/`_input` see the invoker's snapshot.
 *
 * Returns `{ context, warnings }`. `context` exposes the evaluated root block
 * tree — walk `context._internal.RootSlots` (or `.map` by blockId) to read
 * `propertiesEval`, `visibleEval`, `layoutEval` per block (see
 * `packages/engine/src/Block.js`). `warnings` is the skip-collector the factory
 * populated with any browser-only actions the init chain skipped.
 */
async function evaluatePage(options) {
  const handle = createHeadlessLowdefy(options);
  const { lowdefy, pageConfig, jsMap, seed, warnings, drainRequests } = handle;

  const context = getContext({
    config: pageConfig,
    jsMap,
    lowdefy,
    resetContext: { reset: true, setReset: noop },
  });

  // Seed the invoker's snapshot before init events run. `inputs` is keyed by
  // the context id (the built page id, e.g. `page:home`) — the same key
  // `getContext` initialised and the `_input` operator reads. Copy so the
  // engine's in-place mutations during init never reach back into the caller's
  // snapshot.
  if (seed.input !== undefined) {
    lowdefy.inputs[context.id] = serializer.copy(seed.input);
  }
  if (seed.state !== undefined) {
    context.state = serializer.copy(seed.state);
  }

  await context._internal.runOnInit(noop);
  await context._internal.runOnInitAsync(noop);

  // The engine keeps no promise handles — the factory's tracking Set is the
  // only drain mechanism. It re-checks after each await, so requests triggered
  // while draining are awaited too.
  await drainRequests();

  // One final evaluation so visibleEval/propertiesEval reflect every response,
  // even those that settled after the last engine update during the drain.
  context._internal.update();

  return { context, warnings };
}

export default evaluatePage;
