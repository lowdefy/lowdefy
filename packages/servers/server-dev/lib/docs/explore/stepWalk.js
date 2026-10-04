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

import armIdleClose from './armIdleClose.js';
import { getWalk } from './walkSessions.js';
import matchOfferedStep from './matchOfferedStep.js';
import observeWalkPage from './observeWalkPage.js';
import runJourneySteps from '../runJourneySteps.js';
import validateWalkStep from './validateWalkStep.js';

function notFound(walkId) {
  return {
    status: 404,
    body: {
      error: `No open walk "${walkId}". It closed, idled out, or the dev server restarted.`,
    },
  };
}

// POST /lowdefy-docs/explore/walks/:id/steps: runs one grammar interaction
// the walk's latest observation offered, through the journey runner's own
// loop (settle included), then observes again. A step that matches no
// offered candidate is refused, whoever sends it. Returns { status, body }:
// 200 with { result: { status, durationMs, failure? }, findings,
// observation }, 400 for a step that is malformed or not offered, 404 for a
// walk that is not open, 409 while another step of the walk is running.
async function stepWalk({ walkId, body, idleMs }) {
  const walk = getWalk(walkId);
  if (walk === null || walk.closing !== null) {
    return notFound(walkId);
  }
  const step = body?.step;
  const stepError = validateWalkStep(step);
  if (!type.isUndefined(stepError)) {
    return { status: 400, body: { error: stepError } };
  }
  if (matchOfferedStep({ step, observation: walk.observation }) === null) {
    return {
      status: 400,
      body: {
        error: `The step ${JSON.stringify(
          step
        )} matches no control the walk offered in its latest observation.`,
      },
    };
  }
  if (walk.busy) {
    return { status: 409, body: { error: 'Another step of this walk is still running.' } };
  }
  walk.busy = true;
  clearTimeout(walk.idleTimer);
  try {
    const { results, failure } = await runJourneySteps({ journey: walk.runner, steps: [step] });
    const [stepResult] = results;
    if (!type.isUndefined(step.fill)) {
      walk.typed.push(String(step.fill.value));
    }
    walk.observation = await observeWalkPage({ walk });
    const result = { status: stepResult.status, durationMs: stepResult.durationMs };
    if (!type.isUndefined(failure)) {
      result.failure = failure;
    }
    return {
      status: 200,
      body: { result, findings: [], observation: walk.observation },
    };
  } finally {
    walk.busy = false;
    if (walk.closing === null) {
      armIdleClose({ walk, idleMs });
    }
  }
}

export default stepWalk;
