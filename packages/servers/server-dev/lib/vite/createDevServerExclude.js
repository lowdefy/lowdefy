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

function escapeRegExp(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

// The paths Vite serves itself; every other request routes to the Hono app.
// @hono/vite-dev-server tests these against the raw request url, before Vite
// strips its `base`, and Vite serves every module under `base` - so with
// config.basePath the patterns must carry the prefix. Without it
// `<basePath>/@vite/client` and `<basePath>/client/main.jsx` fall through to
// the Hono page route and come back as the HTML shell.
function createDevServerExclude({ basePath }) {
  const prefix = escapeRegExp(basePath);
  return [
    new RegExp(`^${prefix}/client/.+`),
    new RegExp(`^${prefix}/lib/.+`),
    new RegExp(`^${prefix}/build/.+`),
    new RegExp(`^${prefix}/@.+$`),
    new RegExp(`^${prefix}/node_modules/.*`),
    /\?t=\d+$/,
    /^\/favicon\.ico$/,
  ];
}

export default createDevServerExclude;
