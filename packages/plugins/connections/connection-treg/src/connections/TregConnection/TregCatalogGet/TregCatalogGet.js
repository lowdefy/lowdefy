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

import mapTregError from '../mapTregError.js';
import tregFetch from '../tregFetch.js';
import schema from './schema.js';

// One catalog endpoint in full: params, cost, reliability, sibling providers and an example
// response. With access: true, the team's own access to it is added as `access`
// ({ tier, detail, estimated_cost_micro, estimated_cost_usd, ... }), the price this team
// would pay, for a provider catalogue's cost estimate.
async function TregCatalogGet({ request, connection, signal }) {
  const target = `"${request.endpoint}"`;
  const response = await tregFetch({
    connection,
    path: `/catalog/endpoints/${request.endpoint}`,
    signal,
  });
  if (response.status !== 200) {
    throw mapTregError({ response, target, connection });
  }
  if (request.access !== true) return response.body;

  const access = await tregFetch({
    connection,
    path: `/catalog/endpoints/${request.endpoint}/access`,
    signal,
  });
  if (access.status !== 200) {
    throw mapTregError({ response: access, target, connection });
  }
  return { ...response.body, access: access.body };
}

TregCatalogGet.schema = schema;
TregCatalogGet.meta = {
  checkRead: false,
  checkWrite: false,
};

export default TregCatalogGet;
