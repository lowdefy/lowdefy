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

import createCallContext from './createCallContext.js';
import createErrorAnswer from './createErrorAnswer.js';
import createResultAnswer from './createResultAnswer.js';

// Runs one call in a context of its own, as a server runs one request, and answers
// { status, success, response, error, body, faults }:
// - status: the HTTP status the server would answer with.
// - success, response, error: the answer as the client reads it.
// - body: the JSON the server sends.
// - faults: the errors the server would log at error level. The same array takes the faults of
//   background work the call started, so it is complete once session.settled() resolves.
// `run` is given the context and makes the @lowdefy/api call.
async function answerCall({ req, run, testSession, user }) {
  const { testApp } = testSession;
  const faults = [];
  const context = createCallContext({ faults, req, testSession, user });
  let result;
  try {
    result = await run(context);
  } catch (error) {
    return createErrorAnswer({ context, error, faults, testApp });
  }
  return createResultAnswer({ faults, result, testApp });
}

export default answerCall;
