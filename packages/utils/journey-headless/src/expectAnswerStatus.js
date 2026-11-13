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

import HeadlessStepError from './HeadlessStepError.js';

// expect.status: the HTTP status of the answer to the call or request step before it, with the
// browser runner's message.
function expectAnswerStatus({ answer, status }) {
  if (answer.status === status) {
    return;
  }
  const error = answer.error === null ? '' : `: ${answer.error}`;
  throw new HeadlessStepError(
    `Expected ${answer.description} to answer ${status} but it answered ${answer.status}${error}.`,
    { actual: answer.status, expected: status }
  );
}

export default expectAnswerStatus;
