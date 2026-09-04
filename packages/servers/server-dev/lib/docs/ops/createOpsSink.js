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

import createAxiomAdapter from './createAxiomAdapter.js';
import createJsonlAdapter from './createJsonlAdapter.js';
import isOpsQueryAllowed from './isOpsQueryAllowed.js';

// The one door every ops tool goes through: access control first, then the
// adapter the query URL names. A file:// URL is a saved export on the
// developer's own disk, everything else is the Axiom query API.
function createOpsSink({ origin }) {
  const access = isOpsQueryAllowed({ origin });
  if (access.allowed === false) {
    return { refused: true, reason: access.reason, howToEnable: access.howToEnable };
  }
  const { url, token, dataset } = access.sink;
  if (url.startsWith('file://')) {
    return { adapter: createJsonlAdapter({ url }) };
  }
  return { adapter: createAxiomAdapter({ url, token, dataset }) };
}

export default createOpsSink;
