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

import axios from 'axios';
import { get, serializer, type } from '@lowdefy/helpers';
import { findIncompleteExpectation, validateJourney } from '@lowdefy/node-utils';

import getTestServerDirectory from './getTestServerDirectory.js';
import resolveFixtures from './resolveFixtures.js';
import seedFixtures from './seedFixtures.js';
import updateJourneyFile from './updateJourneyFile.js';

function describeHttpError(error) {
  if (type.isNone(error.response)) {
    return `Could not reach the dev server: ${error.message}`;
  }
  const body = type.isString(error.response.data)
    ? error.response.data
    : JSON.stringify(error.response.data);
  return `POST /lowdefy-docs/journey responded ${error.response.status}: ${body}`;
}

// Seeding runs before every journey of a seeded run, not only before journeys
// that name fixtures: a journey without `fixtures` must still open a page whose
// database is cleared of what the test before it wrote.
async function seedJourney({ context, journey, session }) {
  if (type.isNone(session.client)) {
    return undefined;
  }
  const { fixtures, error } = resolveFixtures({ names: journey.fixtures, session });
  if (!type.isNone(error)) {
    return error;
  }
  try {
    await seedFixtures({
      client: session.client,
      devDirectory: getTestServerDirectory({ context }),
      fixtures,
      seeded: session.seeded,
      ObjectId: session.ObjectId,
    });
  } catch (error) {
    return error.message;
  }
  return undefined;
}

// One pass over the app: seed, then drive `steps` on a freshly opened page. The
// result is the dev server's own, or a message describing why there is none.
async function runPass({ context, journey, session, steps, url }) {
  const seedError = await seedJourney({ context, journey, session });
  if (!type.isNone(seedError)) {
    return { message: seedError };
  }
  try {
    const response = await axios.post(`${url}/lowdefy-docs/journey`, {
      pageId: journey.pageId,
      steps,
      user: journey.user,
      urlQuery: journey.urlQuery,
    });
    return { result: response.data ?? {} };
  } catch (error) {
    return { message: describeHttpError(error) };
  }
}

// Fills every `expect.state` written with a path and no value, writing each one
// back to the journey file as it is observed. A journey is replayed from the
// start up to the step before each unfilled expectation, because the value to
// record is the state the app is in exactly there - and because the seeded data
// the run started from is restored by the seed of every pass.
async function fillExpectations({ context, item, journey, session, steps, url }) {
  let incomplete = findIncompleteExpectation({ steps });
  let filled = 0;
  while (!type.isNone(incomplete)) {
    const { result, message } = await runPass({
      context,
      journey,
      session,
      steps: steps.slice(0, incomplete.index),
      url,
    });
    if (!type.isNone(message)) {
      return { message, filled };
    }
    if (!type.isNone(result.error)) {
      return { message: result.error, filled };
    }
    if (!type.isUndefined(result.failure)) {
      return { failure: result.failure, message: result.failure.message, filled };
    }
    const equals = get(result.state ?? {}, incomplete.path);
    if (type.isUndefined(equals)) {
      return {
        message: `Could not fill the expectation at step ${incomplete.index}: state "${incomplete.path}" is undefined when the journey reaches it.`,
        filled,
      };
    }
    steps[incomplete.index].expect.state.equals = equals;
    steps[incomplete.index].expect.state.from = 'recorded';
    updateJourneyFile({
      filePath: item.filePath,
      journeyIndex: item.journeyIndex,
      stepIndex: incomplete.index,
      equals,
    });
    filled += 1;
    incomplete = findIncompleteExpectation({ steps });
  }
  return { filled };
}

// Runs one discovered journey against the dev server's REST journey route and
// normalises every outcome - schema failure, seed failure, transport failure,
// non-2xx, a failed step - into the same result shape the reporter prints.
async function runJourney({ context, item, url, session }) {
  const { filePath, journey } = item;
  const name = journey?.name ?? filePath;
  const fail = (fields) => ({
    name,
    filePath,
    passed: false,
    stepCount: 0,
    durationMs: 0,
    ...fields,
  });
  if (!type.isNone(item.error)) {
    return fail({ message: item.error });
  }
  const validation = validateJourney({ journey });
  if (!validation.valid) {
    return fail({ message: `Invalid journey file: ${validation.message}` });
  }
  const stepCount = journey.steps.length;
  const incomplete = findIncompleteExpectation({ steps: journey.steps });
  // An expectation with no value asserts nothing, so a run that cannot fill it
  // fails rather than reporting a green test that checks nothing.
  if (!type.isNone(incomplete) && context.options.update !== true) {
    return fail({ stepCount, message: incomplete.message });
  }
  const start = Date.now();
  const steps = serializer.copy(journey.steps);
  let filled = 0;
  if (!type.isNone(incomplete)) {
    const update = await fillExpectations({ context, item, journey, session, steps, url });
    filled = update.filled;
    if (!type.isUndefined(update.message)) {
      return fail({
        stepCount,
        filled,
        durationMs: Date.now() - start,
        failure: update.failure,
        message: update.message,
      });
    }
  }
  const { result, message } = await runPass({ context, journey, session, steps, url });
  const durationMs = Date.now() - start;
  if (!type.isNone(message)) {
    return fail({ stepCount, filled, durationMs, message });
  }
  if (!type.isNone(result.error)) {
    return fail({ stepCount, filled, durationMs, message: result.error });
  }
  if (result.passed === true) {
    return { name, filePath, passed: true, stepCount, filled, durationMs };
  }
  return fail({
    stepCount,
    filled,
    durationMs,
    failure: result.failure,
    message: result.failure?.message,
  });
}

export default runJourney;
