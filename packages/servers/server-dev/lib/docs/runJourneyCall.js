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

import { decodeErrorBody } from '@lowdefy/client-core';
import { serializer, type } from '@lowdefy/helpers';

// The route a call or request step posts to and how its answer is named, with the body the
// client's createCallAPI and createCallRequest send.
function describeCall({ journey, step }) {
  const prefix = `${journey.origin}${journey.basePath}/api`;
  if (!type.isUndefined(step.call)) {
    return {
      as: step.call.as,
      body: { payload: step.call.payload ?? {} },
      description: `endpoint "${step.call.endpoint}"`,
      url: `${prefix}/endpoints/${step.call.endpoint}`,
    };
  }
  const { as, pageId, payload, requestId } = step.request;
  return {
    as,
    body: { payload: payload ?? {} },
    description: `request "${requestId}" on page "${pageId}"`,
    url: `${prefix}/request/${pageId}/${requestId}`,
  };
}

function parseJson(text) {
  try {
    return JSON.parse(text);
  } catch {
    return null;
  }
}

// The error message an answer that is not ok carries: the app's error, decoded as the client
// decodes it, or the body's text when the app sent none (a proxy's or a library's answer).
function readAnswerError({ body, status, text }) {
  const decoded = type.isObject(body) ? decodeErrorBody(body) : null;
  if (decoded !== null) {
    return decoded.message;
  }
  if (type.isString(body?.message)) {
    return body.message;
  }
  return `${status} ${text}`.trim();
}

// The error of a 200 answer whose routine failed (a :reject or :throw answers success: false
// with the routine's error), or null for one that succeeded.
function readRoutineError(body) {
  if (!type.isObject(body) || body.success !== false) {
    return null;
  }
  const { error } = serializer.deserialize(body);
  return error?.message ?? null;
}

// Runs a call or request step: posts the payload as it is given, through the browser context of
// who the step calls as (journey.actors.callerFor), so the call carries that actor's session,
// data set and recording cookies, as the page's own calls do. A refusal or an error is the
// answer, not a failure of the step: expect.status and expect.error read it from
// journey.lastAnswer. The call is counted for expect.calls and the exercised paths.
async function runJourneyCall({ journey, step, timeout }) {
  const { as, body, description, url } = describeCall({ journey, step });
  const { context, counter } = await journey.actors.callerFor(as);
  counter.recordCall({ url, method: 'POST' });
  const response = await context.request.post(url, {
    data: body,
    failOnStatusCode: false,
    timeout,
  });
  const status = response.status();
  const text = await response.text();
  const answerBody = parseJson(text);
  journey.lastAnswer = {
    description,
    status,
    error: response.ok()
      ? readRoutineError(answerBody)
      : readAnswerError({ body: answerBody, status, text }),
  };
  return journey.lastAnswer;
}

export default runJourneyCall;
