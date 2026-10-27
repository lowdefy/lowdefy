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

// Every call a shell makes leaves cookies alone. React Native's fetch keeps a cookie jar unless
// told not to, and a request carrying a Cookie is not a native one to the server: it would get
// no set-auth-token on sign-in. The session travels only as the bearer token.
function withoutCookies(fetch) {
  return function cookielessFetch(url, init = {}) {
    return fetch(url, { ...init, credentials: 'omit' });
  };
}

export default withoutCookies;
