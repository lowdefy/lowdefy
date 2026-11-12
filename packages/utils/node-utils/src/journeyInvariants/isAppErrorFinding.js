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

// Whether a finding fails a journey: an error does, and so does an environment finding, which a
// journey cannot pass on a data set whose store cannot run the app's query. A dead click is only
// a warning; a journey asserts it with expect.effect.
function isAppErrorFinding(finding) {
  return finding.severity === 'error' || finding.kind === 'environment';
}

export default isAppErrorFinding;
