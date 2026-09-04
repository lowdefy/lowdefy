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

import { type } from '@lowdefy/helpers';

import buildTraceEvent from './buildTraceEvent.js';
import createJourneyBatcher from './createJourneyBatcher.js';
import createJourneySender from './createJourneySender.js';
import resolveJourneySession from './resolveJourneySession.js';

// The build writes logger.journeys, so a served app always carries a policy.
// These stand in for a client that was handed none - a test harness, or a
// server that predates the artifact.
const defaults = { enabled: true, sample_rate: 0.05 };

// The journey recorder. Returns undefined - so the engine skips its own
// bookkeeping entirely - when the app turned journeys off, when this session
// was not sampled, or when there is no browser to record in.
//
// `stage` is the same gate that decides whether window.lowdefy exists
// (initLowdefyContext): dev is the only stage where the recorder is allowed to
// build value-carrying trace events, and it is decided here, once, rather than
// by a flag the server sends and the client trusts.
function createJourneyRecorder({ basePath = '', config, stage, window }) {
  if (type.isNone(window?.sessionStorage) || type.isNone(window.navigator)) {
    return undefined;
  }
  // The e2e server drives the app from a test runner; its clicks are not a
  // user's journey and must never enter the corpus.
  if (stage === 'e2e') {
    return undefined;
  }
  const dev = stage === 'dev';
  const policy = { ...defaults, ...(config ?? {}) };
  if (policy.enabled === false) {
    return undefined;
  }
  // The developer is the user in dev, and the corpus is the point of running
  // the dev server, so dev records every session.
  const sampleRate = dev ? 1 : policy.sample_rate;
  const session = resolveJourneySession({ sampleRate, window });
  if (!session.sampled) {
    return undefined;
  }

  const batcher = createJourneyBatcher({
    send: createJourneySender({ url: `${basePath}/api/journey`, window }),
    window,
  });
  // One page_instance per engine context, so two visits to the same page in one
  // session are two journeys rather than one interleaved sequence.
  const pageInstances = new WeakMap();
  let pageInstanceCount = 0;

  return function recordJourneyEvent({ actions, blockType, context, record, stateBefore }) {
    // A debounced event that never ran its actions is not a step a user took.
    if (record.bounced === true) {
      return;
    }
    if (!pageInstances.has(context)) {
      pageInstanceCount += 1;
      pageInstances.set(context, `${session.sessionId}:${pageInstanceCount}`);
    }
    batcher.add(
      buildTraceEvent({
        blockType,
        actions,
        context,
        pageInstance: pageInstances.get(context),
        record,
        sessionId: session.sessionId,
        stateBefore,
        values: dev,
        window,
      })
    );
  };
}

export default createJourneyRecorder;
