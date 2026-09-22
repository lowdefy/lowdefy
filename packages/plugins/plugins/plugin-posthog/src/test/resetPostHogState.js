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

import postHogState from '../lib/postHogState.js';

// The singleton lives for the life of the module registry, so each test starts
// by putting it back to its "PostHogInit has not run" state.
function resetPostHogState() {
  postHogState.apiKey = null;
  postHogState.client = null;
  postHogState.enabled = true;
  postHogState.initialized = false;
  postHogState.lastPersonProperties = null;
}

export default resetPostHogState;
