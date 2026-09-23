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

// The singleton behind every action in this package. PostHogInit fills it in
// once per browser session; every other action reads it.
//
// status is one of:
// - uninitialized: PostHogInit has not run. Actions do nothing and warn once,
//   because a missing PostHogInit is a config mistake.
// - disabled: PostHogInit ran with enabled: false. Actions do nothing, silently.
// - loading: PostHogInit is downloading posthog-js. Actions wait for it.
// - failed: posthog-js could not be downloaded. Actions do nothing, silently.
// - enabled: client is the initialised posthog-js instance.
const postHogState = {
  apiKey: null,
  client: null,
  loading: null,
  status: 'uninitialized',
  warnedUninitialized: false,
};

export default postHogState;
