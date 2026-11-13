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

import JourneyStepError from './JourneyStepError.js';

// expect.error after a call or request step: the answer's error contains the text. App errors
// the call caused on the server are claimed when the step's window closes, as after an
// interaction (observe/createJourneyAppErrors).
function expectAnswerError({ journey, text }) {
  const answer = journey.lastAnswer;
  if (answer.error === null) {
    throw new JourneyStepError(
      `Expected ${answer.description} to answer with an error containing "${text}" but it answered ${answer.status} with no error.`,
      { expected: `an error containing "${text}"`, actual: answer.status }
    );
  }
  if (!answer.error.includes(text)) {
    throw new JourneyStepError(
      `Expected ${answer.description} to answer with an error containing "${text}" but its error was "${answer.error}".`,
      { expected: `an error containing "${text}"`, actual: answer.error }
    );
  }
}

export default expectAnswerError;
