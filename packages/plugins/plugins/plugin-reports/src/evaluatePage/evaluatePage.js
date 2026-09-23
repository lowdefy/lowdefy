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
import createAssertNoActionErrors from './createAssertNoActionErrors.js';

const noop = () => undefined;

/**
 * Drive the engine through one full headless page evaluation and return the
 * evaluated block tree. This runs the same `getContext` → `runOnInit` →
 * `runOnInitAsync` flow the browser client runs, then drains outstanding
 * requests so every `propertiesEval`/`visibleEval`/`layoutEval` reflects the
 * responses.
 *
 * `options` are the `createHeadlessLowdefy` options, including the built
 * `pageConfig`, the injected `callRequest`, and the `seed` snapshot
 * `{ urlQuery, input, state }`. The factory bakes `seed.urlQuery` into the
 * synthetic window; this function seeds `seed.input` and `seed.state` into the
 * context.
 *
 * Only `onInit`/`onInitAsync` run headless: the engine has no mount lifecycle
 * (per-block `onMount` is fired by the client's Block.js). generateReport warns
 * for every block that declares a mount event (see collectMountEvents) so a page
 * that loads its data there is not silently rendered empty.
 *
 * A failed action fails the render. The engine resolves every event whether or
 * not its actions succeeded, so without this a rejected `Request` in `onInit`
 * would leave `_request` null and the document would ship with empty tables — a
 * plausible report that is wrong. The factory records every action error;
 * `assertNoActionErrors` runs at the same phase boundaries as the `_user` guard.
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
    actionErrors,
    drainRequests,
    assertUserNotEvaluated,
    aborted,
  } = handle;
  const pageId = pageConfig?.pageId ?? pageConfig?.id;
  const assertNoActionErrors = createAssertNoActionErrors({ actionErrors, pageId });

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
  assertNoActionErrors('onInit');

  await untilAborted(context._internal.runOnInitAsync(noop));
  assertUserNotEvaluated();
  assertNoActionErrors('onInitAsync');

  // The engine keeps no promise handles — the factory's tracking Set is the
  // only drain mechanism. It re-checks after each await, so requests triggered
  // while draining are awaited too.
  await untilAborted(drainRequests());

  // One final evaluation so visibleEval/propertiesEval reflect every response,
  // even those that settled after the last engine update during the drain.
  context._internal.update();
  assertUserNotEvaluated();
  // Requests fired during the drain (a request whose response triggers another)
  // report their failures after the init phases have already been asserted.
  assertNoActionErrors('onInit');

  // Returned so the caller can assert again after it evaluates the report chrome
  // (title/header/footer), which reads operators outside these phases.
  return { context, warnings, assertUserNotEvaluated };
}

export default evaluatePage;
