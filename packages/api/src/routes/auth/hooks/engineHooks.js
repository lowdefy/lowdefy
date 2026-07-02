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

// Engine-tier hook bindings - hard-coded framework behavior, not entries in
// auth.hooks. Keyed by point; each point lists BetterAuth-native callbacks
// (before: (data, ctx) => false | { data } | undefined, after: (data, ctx)).
// Engine hooks run first in each composed slot, so the user hook sees the
// engine-normalized record. The membership behaviors (auto-join, active-org
// policy) register here in a later phase.
const engineHooks = {};

export default engineHooks;
