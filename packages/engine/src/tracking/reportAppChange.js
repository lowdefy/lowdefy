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

// Global and API responses are app-wide, but change sets are per context. A change is reported to
// every context the app holds, so a context that stays mounted, or is shown again without a
// render-time full pass, still re-evaluates the blocks that read it.
function reportAppChange({ context, key }) {
  const contexts = new Set([context, ...Object.values(context._internal.lowdefy.contexts)]);
  contexts.forEach((appContext) => {
    appContext._internal.DependencyTracker.reportChange(key);
  });
}

export default reportAppChange;
