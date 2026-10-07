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

import postMutants from './postMutants.js';

function union({ baselines, read }) {
  return [...new Set(baselines.flatMap(({ exercised }) => read(exercised)))];
}

// Lists the mutants on everything the baselines exercised, through the dev
// server's POST /lowdefy-docs/mutants: { buildId, artifacts, ids, mutants }.
async function requestMutants({ url, baselines, operators }) {
  const requests = new Map();
  baselines.forEach(({ exercised }) =>
    exercised.requests.forEach(({ pageId, requestId }) =>
      requests.set(JSON.stringify([pageId, requestId]), { pageId, requestId })
    )
  );
  return postMutants({
    url,
    body: {
      pages: union({ baselines, read: (exercised) => exercised.pages }),
      requests: [...requests.values()],
      endpoints: union({
        baselines,
        read: (exercised) => exercised.endpoints.map(({ endpointId }) => endpointId),
      }),
      appEvents: baselines.some(({ exercised }) => exercised.appEvents),
      operators: operators ?? undefined,
    },
  });
}

export default requestMutants;
