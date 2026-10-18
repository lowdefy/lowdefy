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

// A dev tab posting to the tab channel (/api/dev-inspect, /api/dev-recording):
// a browser tab from its own page, whose Origin is this server, or a phone
// shell (Lowdefy Dev), which sends no Origin and names itself with
// x-lowdefy-shell. A page on another site always sends an Origin, so it is
// refused; and a custom header from it needs a CORS preflight, which the dev
// server passes for localhost origins only.
function isTabChannelCaller(c) {
  const origin = c.req.header('origin');
  if (!origin) {
    return c.req.header('x-lowdefy-shell') !== undefined;
  }
  try {
    return new URL(origin).host === c.req.header('host');
  } catch {
    return false;
  }
}

export default isTabChannelCaller;
