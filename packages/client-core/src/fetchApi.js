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

// A call to one of the app's own API routes that is not a request or an
// endpoint call: error reporting, and what a block fetches itself, such as an
// agent chat's stream. path is the route with no base, such as
// '/api/client-error'.
//
// A page shown as a view runs on another origin than its app (host.view), so
// its call goes to the app's absolute address signed in with the view's bearer
// session, which the view host mints and replaces after a 401. The app's CORS
// answer allows no credentials, so the call never asks to send any: a
// cross-origin call that asks to is refused by the browser.
//
// Every other host sends the call as it is given, under apiBase.
function fetchApi({ init, lowdefy, path }) {
  const { host } = lowdefy._internal;
  if (!type.isNone(host.view)) {
    return host.view.fetchApi(path, { ...init, credentials: 'omit' });
  }
  return host.fetch(`${lowdefy.apiBase ?? ''}${path}`, init);
}

export default fetchApi;
