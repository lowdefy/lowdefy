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

// The answer for a call that threw, as the servers' error handler answers one
// (packages/servers/server/src/middleware/errorHandler.js). An expected outcome (the system
// worked and said no) is answered with its status from the shared expectedAnswers table and a
// body of the error's name and message. Anything else is a fault: it goes to the fault sink,
// as the server logs it, and is answered 500 with the error as the wire carries it, which in
// production mode holds a generic message. The fault itself, message and config location
// included, is in `faults`.
async function createErrorAnswer({ context, error, faults, testApp }) {
  const { redactErrorResponse } = testApp.modules.api;
  const { expectedAnswers, isExpectedError } = testApp.modules.errors;
  const { serializer } = testApp.modules.helpers;
  if (isExpectedError(error)) {
    // A name expectedErrorNames gains before the table does is still a refusal: a 400.
    const { status } = expectedAnswers[error.name] ?? expectedAnswers.UserError;
    const refusal = new Error(error.message);
    refusal.name = error.name;
    return {
      status,
      success: false,
      response: null,
      error: refusal,
      body: { name: error.name, message: error.message },
      faults,
    };
  }
  await context.handleError(error);
  const text = JSON.stringify(redactErrorResponse(context, error));
  return {
    status: 500,
    success: false,
    response: null,
    error: serializer.deserializeFromString(text),
    body: JSON.parse(text),
    faults,
  };
}

export default createErrorAnswer;
