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

import { ConfigError } from '@lowdefy/errors';

import evaluateRoutineOperators from '../endpoints/evaluateRoutineOperators.js';
import getConnection from '../connections/getConnection.js';
import getConnectionConfig from '../connections/getConnectionConfig.js';
import resolveTenancy from './resolveTenancy.js';

// The seam a plugin uses to reach a walled MongoDB collection: the resolver
// receives `walled(connectionId)`. It resolves the named connection from the
// app config, evaluates its properties against the calling request's frame,
// and computes the tenant verdict and unscoped-write guard for THIS request
// (the same resolveTenancy the request layer runs, so tenant: none and shared
// connections behave exactly as they do for a stock request). What it returns
// is the argument bag of getWalledCollection in
// @lowdefy/connection-mongodb/walled, so the plugin never sees the raw client:
//
//   const walled = getWalledCollection(await resolvers.walled('mongo'));
//
// Only a connection type that implements the scoping contract (meta.tenant)
// can be named; anything else has no wall to apply.
function createWalledResolver(context, { requestConfig, routineContext }) {
  const frame = routineContext ?? {
    arrayIndices: [],
    error: null,
    items: {},
    payload: context.payload ?? {},
    state: {},
    steps: {},
  };
  return async function walled(connectionId) {
    const configKey = requestConfig['~k'];
    const connectionConfig = await getConnectionConfig(context, { connectionId, configKey });
    const connection = getConnection(context, { connectionConfig });
    if (connection.meta?.tenant !== true) {
      throw new ConfigError(
        `Connection "${connectionId}" (${connectionConfig.type}) can not be used as a walled MongoDB client: its type does not implement the tenant scoping contract.`,
        { configKey }
      );
    }
    const { tenant, tenantGuard } = resolveTenancy(context, {
      connection,
      connectionConfig,
      requestConfig,
    });
    const properties = evaluateRoutineOperators(context, frame, {
      input: connectionConfig.properties || {},
      location: connectionId,
    });
    return {
      connection: properties,
      connectionId,
      endpointId: context.endpointId,
      requestId: requestConfig.stepId ?? requestConfig.requestId,
      tenant,
      tenantGuard,
    };
  };
}

export default createWalledResolver;
