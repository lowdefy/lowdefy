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

// expect.error after a call or request step: the answer's error contains the text, with the
// browser runner's messages. App errors the call caused are claimed with the step's window.
function expectAnswerError({ answer, text }) {
  if (answer.error === null) {
    throw new HeadlessStepError(
      `Expected ${answer.description} to answer with an error containing "${text}" but it answered ${answer.status} with no error.`,
      { actual: answer.status, expected: `an error containing "${text}"` }
    );
  }
  if (!answer.error.includes(text)) {
    throw new HeadlessStepError(
      `Expected ${answer.description} to answer with an error containing "${text}" but its error was "${answer.error}".`,
      { actual: answer.error, expected: `an error containing "${text}"` }
    );
  }
}

export default expectAnswerError;
