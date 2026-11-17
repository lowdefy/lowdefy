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

import { readWebhookError } from '@lowdefy/journey-headless';
import { toWebhookBody } from '@lowdefy/node-utils';

function parseJson(text) {
  try {
    return JSON.parse(text);
  } catch {
    return text;
  }
}

// Runs a webhook step in a browser run: posts the body as raw text (a string as written, anything
// else as JSON) to the endpoints route, with the step's query and headers, as the sender would, so
// the endpoint's verify gate runs against those bytes. It goes through the browser context of a
// signed-out actor (journey.actors.callerFor('none')): a webhook has no caller, and the context
// carries the journey's data set and recording cookies, so it runs on the journey's data. A
// refusal is the answer, not a failure of the step: expect.status and expect.error read it from
// journey.lastAnswer, with the headless runner's messages (readWebhookError).
async function runJourneyWebhook({ journey, step, timeout }) {
  const { body, endpoint, headers, query } = step.webhook;
  const url = `${journey.origin}${journey.basePath}/api/endpoints/${endpoint}`;
  const { context, counter } = await journey.actors.callerFor('none');
  counter.recordCall({ url, method: 'POST' });
  const response = await context.request.post(url, {
    data: toWebhookBody(body),
    failOnStatusCode: false,
    headers: headers ?? {},
    params: query ?? {},
    timeout,
  });
  const status = response.status();
  journey.lastAnswer = {
    description: `webhook "${endpoint}"`,
    status,
    error: readWebhookError({ body: parseJson(await response.text()), status }),
  };
  return journey.lastAnswer;
}

export default runJourneyWebhook;
