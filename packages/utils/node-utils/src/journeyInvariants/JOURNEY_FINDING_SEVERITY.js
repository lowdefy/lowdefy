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

// How much each kind of journey finding counts. An error fails the journey; a dead click is a
// warning a journey asserts with expect.effect; an environment finding says the data set's store
// could not run what the app asked, which is not the app's fault.
//   action-error    an event failed with an error that is not an expected outcome
//   client-error    an error the page raised or reported
//   server-error    a fault the server logged for a call the run made
//   request-failed  a 5xx from the app's request or endpoint routes no server error explains
//   dev-server      the dev server could not reach its web server for a call
//   dead-click      a click that succeeded and changed nothing
//   environment     a server error from a $search or $vectorSearch stage
const JOURNEY_FINDING_SEVERITY = {
  'action-error': 'error',
  'client-error': 'error',
  'server-error': 'error',
  'request-failed': 'error',
  'dev-server': 'error',
  'dead-click': 'warning',
  environment: 'info',
};

export default JOURNEY_FINDING_SEVERITY;
