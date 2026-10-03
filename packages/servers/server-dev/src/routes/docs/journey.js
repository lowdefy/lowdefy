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

import getBuildId from '../../../lib/docs/getBuildId.js';
import lowdefyConfig from '../../../lib/build/config.js';
import { openMutantRun } from '../../../lib/server/mutants/mutantRuns.js';
import parseUserParam from './parseUserParam.js';
import runJourney from '../../../lib/docs/runJourney.js';
import validateJourneySteps from '../../../lib/docs/validateJourneySteps.js';
import validateJourneyTimeout from '../../../lib/docs/validateJourneyTimeout.js';
import validateMutantParam from '../../../lib/server/mutants/validateMutantParam.js';
import validateStateSelection from '../../../lib/docs/validateStateSelection.js';

// A failed journey is a 200 with passed: false — it is the result the caller
// asked for. Malformed input (pageId, steps, user) is a 400 before any browser
// opens; only a render that could not run at all is a 502, so it is not
// mistaken for a journey that failed on an assertion.
async function docsJourneyHandler(c) {
  const body = await c.req.json().catch(() => ({}));
  const { pageId, steps, urlQuery, state, timeout } = body;
  if (type.isNone(pageId) || !type.isString(pageId)) {
    return c.json(
      {
        error: `POST /lowdefy-docs/journey requires a "pageId" string in the JSON body, e.g. {"pageId": "home", "steps": [{"click": "submit"}]}. Received ${JSON.stringify(
          pageId
        )}.`,
      },
      400
    );
  }
  const { error: stepsError } = validateJourneySteps({ steps });
  if (stepsError) {
    return c.json({ error: stepsError }, 400);
  }
  if (!type.isNone(urlQuery) && !type.isObject(urlQuery)) {
    return c.json(
      { error: `The "urlQuery" param must be an object. Received ${JSON.stringify(urlQuery)}.` },
      400
    );
  }
  const stateSelectionError = validateStateSelection({ state });
  if (stateSelectionError) {
    return c.json({ error: stateSelectionError }, 400);
  }
  const timeoutError = validateJourneyTimeout({ timeout });
  if (timeoutError) {
    return c.json({ error: timeoutError }, 400);
  }
  // `none` is the journey's own third value: no injected caller, so the app's
  // auth decides who the journey is. Every other value is a headless caller.
  const { user, error: userError } =
    body.user === 'none' ? { user: 'none' } : parseUserParam({ value: body.user });
  if (userError) {
    return c.json({ error: userError }, 400);
  }
  if (!type.isNone(body.mutant)) {
    const mutantError = validateMutantParam(body.mutant);
    if (mutantError) {
      return c.json({ error: mutantError }, 400);
    }
    // A mutant's key names a node only within the build it was listed
    // against; against any other build it would mutate the wrong node.
    if (body.mutant.buildId !== getBuildId()) {
      return c.json(
        {
          error:
            'The mutant was listed against another build. List the mutants again (POST /lowdefy-docs/mutants) and run the new one.',
          stale: true,
        },
        409
      );
    }
  }
  // Derived from the incoming request rather than a config value — this is
  // the origin an agent can actually reach the dev server on (host/port it
  // just connected to), regardless of how the server is bound.
  const origin = new URL(c.req.url).origin;

  const mutantRun = type.isNone(body.mutant)
    ? null
    : openMutantRun({
        mutant: {
          buildId: body.mutant.buildId,
          artifact: body.mutant.artifact,
          key: body.mutant.key,
          arg: body.mutant.arg ?? null,
          operator: body.mutant.operator,
        },
      });
  let result;
  try {
    result = await runJourney({
      origin,
      pageId,
      steps,
      user,
      urlQuery,
      state,
      stepTimeout: timeout,
      basePath: lowdefyConfig.basePath ?? '',
      mutantCookie: mutantRun?.cookiePayload,
    });
  } finally {
    // runJourney has closed every actor by now, so no request still carries
    // the run's cookie.
    mutantRun?.close();
  }
  if (result.error) {
    return c.json({ error: result.error }, 502);
  }
  if (mutantRun !== null) {
    const { id, applied, misses } = mutantRun.run;
    return c.json({ ...result, mutant: { id, applied, misses } });
  }
  return c.json(result);
}

export default docsJourneyHandler;
