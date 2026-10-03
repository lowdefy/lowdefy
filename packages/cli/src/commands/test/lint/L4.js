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

import { type } from '@lowdefy/helpers';

function describeWrite(exercised) {
  const request = exercised.requests.find(({ write }) => write);
  if (!type.isUndefined(request)) {
    return `request "${request.requestId}" on page "${request.pageId}"`;
  }
  const endpoint = exercised.endpoints.find(({ write }) => write);
  return `endpoint "${endpoint.endpointId}"`;
}

// L4: a journey that writes declares `data:`, so it writes to its own data
// set rather than whatever database the dev server points at. "Writes" is
// what its newest measured run called.
function L4({ journey, exercisedEntry }) {
  if (type.isNone(exercisedEntry)) {
    return [
      {
        severity: 'warning',
        message: 'not checked for writes: run lowdefy test once so lint can see what it calls.',
      },
    ];
  }
  const { exercised } = exercisedEntry;
  const writes =
    exercised.requests.some(({ write }) => write) || exercised.endpoints.some(({ write }) => write);
  if (!writes || !type.isNone(journey.data)) {
    return [];
  }
  return [
    {
      severity: 'error',
      message: `writes (${describeWrite(exercised)}) but declares no data: set.`,
    },
  ];
}

export default L4;
