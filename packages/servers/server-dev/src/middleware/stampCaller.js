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

import { callerHash } from '@lowdefy/helpers';

// Stamps page, request and endpoint responses with the caller the server
// answered as (see callerHash). The client compares it with the caller it
// renders and reloads on a difference, so a tab never shows one caller's data
// after the session moved to another person or organization. Registered after
// apiContext, so the resolved caller is always on the context here; set after
// next() so error responses carry it too.
function stampCaller() {
  return async function stampCallerMiddleware(c, next) {
    await next();
    const context = c.get('lowdefyContext');
    c.header('x-lowdefy-caller', callerHash({ user: context.user }));
  };
}

export default stampCaller;
