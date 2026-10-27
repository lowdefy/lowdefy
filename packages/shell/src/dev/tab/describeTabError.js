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

function describeOne(error) {
  if (error?.name === undefined || error.name === 'Error') {
    return String(error?.message ?? error);
  }
  return `[${error.name}] ${error.message}`;
}

// The error a failed inspect, eval or step answers the agent with: a string, as the dev server
// reads it, that keeps the class ([OperatorError] ..., as the dev terminal shows it) and the cause,
// so the agent can tell a config fault from an expected refusal or a shell bug.
function describeTabError(error) {
  const description = describeOne(error);
  if (error?.cause instanceof Error) {
    return `${description} Caused by: ${describeOne(error.cause)}`;
  }
  return description;
}

export default describeTabError;
