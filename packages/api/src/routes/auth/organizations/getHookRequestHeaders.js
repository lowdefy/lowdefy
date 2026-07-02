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

// The engine's baseURL is dynamic (resolved per request from the request
// host), so a nested auth.api call made from inside a hook must carry the
// firing request as its source - a headerless direct call cannot resolve a
// base URL and BetterAuth rejects it. Database hooks receive the endpoint
// context when the write runs inside a request lifecycle; the headers come
// from there.
function getHookRequestHeaders(ctx) {
  return ctx?.headers ?? ctx?.request?.headers ?? ctx?.context?.headers;
}

export default getHookRequestHeaders;
