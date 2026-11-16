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

import decodeErrorBody from '@lowdefy/client-core/decodeErrorBody.js';

// What the client reads from a server answer, as client-core's request.js reads a response: the
// JSON body when the server answered 200, which the engine deserializes; otherwise the decoded
// error is thrown, or, for a body that carries none, an error with the body's message.
function readAnswer(answer) {
  if (answer.status === 200) {
    return answer.body;
  }
  const error = decodeErrorBody(answer.body);
  if (error === null) {
    throw new Error(answer.body?.message ?? `The server answered ${answer.status}.`);
  }
  throw error;
}

export default readAnswer;
