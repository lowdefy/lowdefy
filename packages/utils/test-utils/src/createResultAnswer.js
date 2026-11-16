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

// The answer for a call the route answered with 200: the JSON the server sends, and its
// `response` and `error` as the client reads them, with the serializer's markers turned back
// into dates and errors. A routine that failed or rejected is a 200 too, with success false.
function createResultAnswer({ faults, result, testApp }) {
  const { serializer } = testApp.modules.helpers;
  const text = JSON.stringify(result);
  const read = serializer.deserializeFromString(text);
  return {
    status: 200,
    success: read.success,
    response: read.response ?? null,
    error: read.error ?? null,
    body: JSON.parse(text),
    faults,
  };
}

export default createResultAnswer;
