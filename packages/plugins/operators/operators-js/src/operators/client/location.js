/*
  Copyright 2020-2024 Lowdefy, Inc

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

import { getFromObject } from '@lowdefy/operators';

const validProperties = [
  'basePath',
  'hash',
  'homePageId',
  'host',
  'hostname',
  'href',
  'origin',
  'pageId',
  'pathname',
  'port',
  'protocol',
  'search',
];

function _location({ arrayIndices, basePath, home, location, pageId, params, globals }) {
  const { window } = globals;
  if (!window?.location) {
    throw new Error(
      `Operator Error: Browser window.location not available for _location. Received: ${JSON.stringify(
        params
      )} at ${location}.`
    );
  }
  if (!validProperties.includes(params)) {
    throw new Error(
      `Operator Error: _location only returns values for ${validProperties.join(
        ', '
      )}. Received: ${JSON.stringify(params)} at ${location}.`
    );
  }
  const windowLocation = {
    basePath,
    hash: window.location.hash,
    homePageId: home.pageId,
    host: window.location.host,
    hostname: window.location.hostname,
    href: window.location.href,
    origin: window.location.origin,
    pageId,
    pathname: window.location.pathname,
    port: window.location.port,
    protocol: window.location.protocol,
    search: window.location.search,
  };
  return getFromObject({
    arrayIndices,
    location,
    object: windowLocation,
    operator: '_location',
    params,
  });
}

export default _location;
