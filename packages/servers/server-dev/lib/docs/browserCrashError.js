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

import { type } from '@lowdefy/helpers';

// A browser can break while it stays connected: newContext and newPage then
// answer `Target crashed` on every call. Such a browser is retired, so the
// next getBrowser() launches a new one, and the call that hit it says so.
function browserCrashError({ error, browser, lifecycle }) {
  if (!type.isString(error?.message) || !error.message.includes('Target crashed')) {
    return error;
  }
  lifecycle.retire(browser);
  return new Error(
    `The headless browser crashed (${error.message.trim()}); it is relaunched for the next call.`,
    { cause: error }
  );
}

export default browserCrashError;
