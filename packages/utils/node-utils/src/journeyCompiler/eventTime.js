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

// A trace whose events carry no parsable timestamp still has an order: the one
// the lines came in. Reading an unparsable `t` as 0 keeps that order stable
// under a sort and stops the run-collapse window from firing on it.
function eventTime({ event }) {
  const parsed = Date.parse(event.t);
  return Number.isNaN(parsed) ? 0 : parsed;
}

export default eventTime;
