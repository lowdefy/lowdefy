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

// Whether a step's window shows the step did nothing: no event ran, no lasting
// DOM change (a mutationCount of null means the document was replaced), no
// request to the app's request or endpoint routes (the window holds only
// those) and the URL is unchanged. The dead-click invariant and the journey
// runner's expect.effect both read it, so the two cannot drift.
function hasNoEffect({ window }) {
  return (
    window.emits.length === 0 &&
    window.mutationCount === 0 &&
    window.requests.length === 0 &&
    window.urlBefore === window.urlAfter
  );
}

export default hasNoEffect;
