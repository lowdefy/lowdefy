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

import generateClientJsModule from '../buildJs/generateClientJsModule.js';
import jsMapParser from '../buildJs/jsMapParser.js';

// A shell cannot load the web client's clientJsMap module, so the client _js of
// mobile.events reaches it as module text in the mobile root, as a mobile
// page's does (_jsEntries). As with a mobile page, it stays out of the web
// module: the events' _js source is replaced with its hashes here, not by
// buildJs. null for an app without a mobile key or without _js in its events.
function buildMobileAppJs({ components, context }) {
  context.mobileAppJsEntries = null;
  if (type.isNone(components.mobile)) {
    return components;
  }
  const jsMap = {};
  components.mobile.events = jsMapParser({
    input: components.mobile.events,
    jsMap,
    env: 'client',
  });
  if (Object.keys(jsMap.client).length > 0) {
    context.mobileAppJsEntries = generateClientJsModule(jsMap.client);
  }
  return components;
}

export default buildMobileAppJs;
