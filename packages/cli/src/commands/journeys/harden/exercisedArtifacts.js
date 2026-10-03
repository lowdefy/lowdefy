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

// The build artifacts one journey run read, named as the mutants route names
// them: its pages, their request artifacts, its endpoints and the app events.
function exercisedArtifacts(exercised) {
  return [
    ...exercised.pages.map((pageId) => `pages/${pageId}.json`),
    ...exercised.requests.map(
      ({ pageId, requestId }) => `pages/${pageId}/requests/${requestId}.json`
    ),
    ...exercised.endpoints.map(({ endpointId }) => `api/${endpointId}.json`),
    ...(exercised.appEvents ? ['events.json'] : []),
  ];
}

export default exercisedArtifacts;
