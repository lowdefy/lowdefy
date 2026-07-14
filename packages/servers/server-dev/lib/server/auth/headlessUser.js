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

// Shared between the headless renderer (getBrowser.js, which sets the cookie on
// its browser context) and the dev getSession (getHeadlessSession.js, which
// decodes it) so the cookie name and injected user shape live in one place.
const HEADLESS_USER_COOKIE = 'lowdefy_headless_user';

const headlessUser = {
  sub: 'lowdefy-headless',
  id: 'lowdefy-headless',
  name: 'Lowdefy Headless',
  roles: [],
};

export { HEADLESS_USER_COOKIE, headlessUser };
