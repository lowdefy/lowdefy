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

// Dependency tracking is on unless one of these switches turns it off:
//   - lowdefy._internal.dependencyTracking === false: an engine option, so a harness can run the
//     same page tracked and with full passes.
//   - lowdefy.lowdefyApp.dependencyTracking === false: config.dependencyTracking: false in the app,
//     carried to the client in appMeta.
//   - window.__lowdefyFullEvaluation === true: a per-session switch for debugging.
function isDependencyTrackingEnabled({ lowdefy }) {
  if (lowdefy._internal.dependencyTracking === false) {
    return false;
  }
  if (lowdefy.lowdefyApp?.dependencyTracking === false) {
    return false;
  }
  // The engine reaches the browser window only through lowdefy._internal.globals.
  return lowdefy._internal.globals?.window?.__lowdefyFullEvaluation !== true;
}

export default isDependencyTrackingEnabled;
