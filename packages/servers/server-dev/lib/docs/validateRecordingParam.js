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

import { isTraceId, type } from '@lowdefy/helpers';

// The journey route's optional `recording` param, { run, journey }: the test
// run (a trace id) this journey records into, and the journey's name in it.
// Returns an error message, or undefined when the param is absent or valid.
function validateRecordingParam(recording) {
  if (type.isNone(recording)) return undefined;
  if (!type.isObject(recording)) {
    return `The "recording" param must be an object { run, journey }. Received ${JSON.stringify(
      recording
    )}.`;
  }
  if (!isTraceId(recording.run)) {
    return `The "recording.run" param must be a trace id like "20261003T151200Z-p0d4rm". Received ${JSON.stringify(
      recording.run
    )}.`;
  }
  if (!type.isNone(recording.journey) && !type.isString(recording.journey)) {
    return `The "recording.journey" param must be a string or null. Received ${JSON.stringify(
      recording.journey
    )}.`;
  }
  return undefined;
}

export default validateRecordingParam;
