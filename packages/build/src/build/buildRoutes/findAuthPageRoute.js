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

import authPageUrlPath from './authPageUrlPath.js';

// The route an auth page URL ("/login", "/crm/login?next=x") is served by: the
// route whose path is the URL's path, as the server matches it. A page without
// a path has its id as its route path. Returns null for an absolute URL, which
// points outside the app, and for a URL no page is served at.
function findAuthPageRoute({ routes, url }) {
  const urlPath = authPageUrlPath({ url });
  if (type.isNull(urlPath)) {
    return null;
  }
  return routes.find((route) => route.path === urlPath) ?? null;
}

export default findAuthPageRoute;
