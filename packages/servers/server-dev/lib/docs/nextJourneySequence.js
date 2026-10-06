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

// One ordering for every journey's network events and step windows in this
// process. A clock can give a call and the step after it the same millisecond;
// a sequence cannot, so "started since the step began" is never a tie. Kept on
// globalThis, as journeyActor.js keeps its token, so two module instances of
// this file (Vite's SSR module graph and Node's) still share one order.
const SEQUENCE_KEY = Symbol.for('lowdefy.devServer.journeySequence');
globalThis[SEQUENCE_KEY] ??= 0;

function nextJourneySequence() {
  globalThis[SEQUENCE_KEY] += 1;
  return globalThis[SEQUENCE_KEY];
}

export default nextJourneySequence;
