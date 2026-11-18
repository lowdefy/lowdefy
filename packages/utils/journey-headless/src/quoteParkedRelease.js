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

// The release step a parked call's message tells the author to write, quoted, followed by the
// hold it lets go when that release names another parked call too (createJourneyRaces):
// `"release: claim"`, or `"release: claim" (the hold at step 1, once the call at step 2 is let go)`.
function quoteParkedRelease({ hold, release }) {
  const quoted = `"${release}"`;
  return hold === undefined ? quoted : `${quoted} (${hold})`;
}

export default quoteParkedRelease;
