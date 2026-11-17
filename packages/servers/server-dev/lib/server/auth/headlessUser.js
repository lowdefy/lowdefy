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

// The roleless user a headless browser context acts as when its caller names
// none (resolveHeadlessUser.js). The cookie that carries it is
// JOURNEY_COOKIES.headlessUser.

// BetterAuth's session user carries `id`, never `sub`. attributes is floored to
// {} by normalizeInjectedCaller at injection, so it is not spelled out here.
const headlessUser = {
  id: 'lowdefy-headless',
  name: 'Lowdefy Headless',
  roles: [],
};

export { headlessUser };
