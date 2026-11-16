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

import { serializeQuery } from '@lowdefy/client-core';

// A page's URL as the engine reads window.location (HostLocation in the engine's getGlobals.js),
// on a fixed origin: a headless page has no server address.
function createLocation({ path, urlQuery }) {
  const search = serializeQuery(urlQuery ?? {});
  const url = new URL(`http://localhost/${path}${search === '' ? '' : `?${search}`}`);
  return {
    hash: url.hash,
    host: url.host,
    hostname: url.hostname,
    href: url.href,
    origin: url.origin,
    pathname: url.pathname,
    port: url.port,
    protocol: url.protocol,
    search: url.search,
  };
}

export default createLocation;
