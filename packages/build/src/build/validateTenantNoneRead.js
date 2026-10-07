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
import { ConfigError } from '@lowdefy/errors';

import getLiteralWriteTarget from './getLiteralWriteTarget.js';

const writeRemedy =
  'To write rows of one organization from a system run, call an endpoint with a CallApi step that names the "organization": its requests are filtered and stamped with that organization.';

// tenant: none lifts the wall's filter so a request can read rows of every
// organization; on a scoped connection it may only read. A request type
// writes when its plugin's requestMetas say so (the table its resolvers carry
// as meta). An aggregation reads by its meta but writes through a $out or
// $merge stage, which the build refuses only for a literal target
// (getLiteralWriteTarget) - the connection refuses every one at runtime, and
// the api refuses a write request type (resolveTenancy).
function validateTenantNoneRead({
  config,
  location,
  requestMetas,
  tenantConnectionIds,
  configKey,
}) {
  if (config.tenant !== 'none') {
    return;
  }
  if (!tenantConnectionIds.has(config.connectionId)) {
    return;
  }
  if (requestMetas?.[config.type]?.checkWrite === true) {
    throw new ConfigError(
      `${location} is a ${config.type} request on tenant connection "${config.connectionId}" with tenant: none, but tenant: none may only read. ${writeRemedy}`,
      { configKey }
    );
  }
  const pipeline = config.properties?.pipeline;
  if (!type.isArray(pipeline)) {
    return;
  }
  pipeline.forEach((stage) => {
    const write = getLiteralWriteTarget(stage);
    if (write === null) {
      return;
    }
    throw new ConfigError(
      `${location} writes into collection "${write.collection}" with "${write.operator}" on tenant connection "${config.connectionId}" with tenant: none, but tenant: none may only read. ${writeRemedy}`,
      { configKey }
    );
  });
}

export default validateTenantNoneRead;
