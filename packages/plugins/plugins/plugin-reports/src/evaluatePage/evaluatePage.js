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
import { serializer, type } from '@lowdefy/helpers';

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
 * KNOWN LIMITATION — onMount: the engine has no mount lifecycle (per-block
 * `onMount`/`onMountAsync` are a client concern, fired in
 * `@lowdefy/client`'s Block.js, not the engine). Only `onInit` runs headless, so
 * a page that loads its data in `onMount` renders empty. Load report data in
 * `onInit`. Running mount events headless would mean replicating the client's
 * per-block mount traversal here — deferred as its own change.
 *
 * WYSIWYG contract: state seeds AFTER `getContext` (the context and its
 * `inputs` entry exist by then) but BEFORE `onInit`, so init request payloads
 * reading `_state`/`_input` see the invoker's snapshot.
 *
 * Returns `{ context, warnings, assertUserNotEvaluated }`. `context` exposes the evaluated root block
 * tree — walk `context._internal.RootSlots` (or `.map` by blockId) to read
 * `propertiesEval`, `visibleEval`, `layoutEval` per block (see
 * `packages/engine/src/Block.js`). `warnings` is the skip-collector the factory
 * populated with any browser-only actions the init chain skipped.
 */
async function evaluatePage(options) {
  const handle = createHeadlessLowdefy(options);
  const {
    lowdefy,
    pageConfig,
    jsMap,
    seed,
    warnings,
    drainRequests,
    assertUserNotEvaluated,
    aborted,
  } = handle;

  // Every phase below waits on requests — an init action awaits the one it fires,
  // the drain awaits them all — and a request that never settles is what wedges a
  // generation. Race each phase against the abort so the pipeline unwinds when
  // the caller's deadline passes, instead of parking here with an engine context
  // nothing can reclaim. The orphaned phase promise stays pending; the request
  // holding it was unreclaimable either way.
  const untilAborted = (promise) => (aborted ? Promise.race([promise, aborted]) : promise);

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
  if (!type.isNone(seed.input)) {
    lowdefy.inputs[context.id] = serializer.copy(seed.input);
  }
  if (!type.isNone(seed.state)) {
    context.state = serializer.copy(seed.state);
  }

  // Assert at every phase boundary, not once at the end: a system render that
  // reads _user must stop before an init request carries the wrong parameters to
  // an external system, and before any document exists. The parser swallows the
  // guard's own throw (see createHeadlessLowdefy), so these calls are what
  // actually fail the render.
  assertUserNotEvaluated();

  await untilAborted(context._internal.runOnInit(noop));
  assertUserNotEvaluated();

  await untilAborted(context._internal.runOnInitAsync(noop));
  assertUserNotEvaluated();

  // The engine keeps no promise handles — the factory's tracking Set is the
  // only drain mechanism. It re-checks after each await, so requests triggered
  // while draining are awaited too.
  await untilAborted(drainRequests());

  // One final evaluation so visibleEval/propertiesEval reflect every response,
  // even those that settled after the last engine update during the drain.
  context._internal.update();
  assertUserNotEvaluated();

  // Returned so the caller can assert again after it evaluates the report chrome
  // (title/header/footer), which reads operators outside these phases.
  return { context, warnings, assertUserNotEvaluated };
}

export default evaluatePage;
