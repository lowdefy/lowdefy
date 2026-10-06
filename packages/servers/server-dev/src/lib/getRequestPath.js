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

// The rest of the request path after basePath and prefix, still encoded: the
// page matcher decodes each segment once, and Hono's c.req.path is partly
// decoded, so it is taken from the request URL. path goes to the matcher as it
// arrived; matchedPath is path with one trailing "/" removed, the form the
// client compares its navigations with.
function getRequestPath({ c, basePath, prefix }) {
  const pathname = new URL(c.req.url).pathname.slice(basePath.length);
  const path = pathname.startsWith(prefix) ? pathname.slice(prefix.length) : '';
  const matchedPath = path.endsWith('/') ? path.slice(0, -1) : path;
  return { path, matchedPath };
}

export default getRequestPath;
