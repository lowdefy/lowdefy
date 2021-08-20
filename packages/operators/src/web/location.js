/*
  Copyright 2020-2021 Lowdefy, Inc

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

import getFromObject from '../getFromObject';

const validProperties = [
  'basePath',
  'href',
  'origin',
  'protocol',
  'homePageId',
  'host',
  'hostname',
  'port',
  'pageId',
  'pathname',
  'search',
  'hash',
];

function _location({ arrayIndices, context, contexts, env, location, params }) {
  if (!window || !window.location) {
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
    basePath: context.lowdefy.basePath,
    href: window.location.href,
    origin: window.location.origin,
    protocol: window.location.protocol,
    homePageId: context.lowdefy.homePageId,
    host: window.location.host,
    hostname: window.location.hostname,
    port: window.location.port,
    pageId: context.lowdefy.pageId,
    pathname: window.location.pathname,
    search: window.location.search,
    hash: window.location.hash,
  };
  return getFromObject({
    arrayIndices,
    context,
    contexts,
    env,
    location,
    object: windowLocation,
    operator: '_location',
    params,
  });
}

export default _location;
