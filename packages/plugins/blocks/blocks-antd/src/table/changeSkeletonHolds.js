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

// Tables holding a loading skeleton past its load (useSkeletonTiming's `holding` phase), shared by
// every table in the bundle. The count is mirrored onto window, as @lowdefy/block-utils mirrors
// its lazy loads, because the dev server's page-readiness check is serialized into the page by
// Playwright and can read only globals: a click must not pick its target while a table's rows are
// about to replace its skeleton. It is written here, never at module load, so the package keeps
// no top-level side effects.
const skeletonHoldState = {
  holding: 0,
};

function changeSkeletonHolds(delta) {
  skeletonHoldState.holding += delta;
  if (typeof window !== 'undefined') {
    window.__lowdefySkeletonHolds = skeletonHoldState.holding;
  }
}

export default changeSkeletonHolds;
