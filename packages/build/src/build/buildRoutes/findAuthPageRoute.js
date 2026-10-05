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

// The route an auth page URL ("/login", "/crm/login?next=x") names: the route
// whose path is the URL's path, else the page whose id it is. Returns null for
// an absolute URL, which points outside the app.
function findAuthPageRoute({ routes, url }) {
  if (!type.isString(url) || !/^\/[^/]/.test(url)) {
    return null;
  }
  const urlPath = url.slice(1).split(/[?#]/)[0];
  return (
    routes.find((route) => route.path === urlPath) ??
    routes.find((route) => route.pageId === urlPath) ??
    null
  );
}

export default findAuthPageRoute;
