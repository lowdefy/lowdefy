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

// The lazy singleton behind every action in this package. PostHogInit fills it
// in once per browser session; every other action reads it and does nothing
// while it is empty, so an app that never initialises PostHog still runs.
const postHogState = {
  apiKey: null,
  client: null,
  enabled: true,
  initialized: false,
  lastPersonProperties: null,
};

export default postHogState;
