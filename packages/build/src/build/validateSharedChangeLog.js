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

import { get } from '@lowdefy/helpers';
import { ConfigError } from '@lowdefy/errors';

import collectExceptions from '../utils/collectExceptions.js';
import tenantTargetKey from './tenantTargetKey.js';

// A tenant: shared connection's writes belong to no organization, so its
// change-log records carry no tenant field: there is no verdict to stamp, and
// stamping one from the written document or the caller would put a record in
// an organization the wall never verified. A walled collection can not hold
// such a record - every walled read filters it out and the tenant preflight
// refuses to serve the app once one exists. So a shared connection may not
// change-log into a collection a scoped connection reads (walledTargets,
// collectWalledTargets). Names resolved at runtime (_secret, _payload) can not
// be compared and are skipped.
function validateSharedChangeLog({ connections, context, walledTargets }) {
  const connectionMetas = context.typesMap?.connectionMetas ?? {};
  connections.forEach((connection) => {
    if (connection.tenant !== 'shared') return;
    const tenantTarget = connectionMetas[connection.type]?.tenantTarget;
    if (!tenantTarget) return;
    const key = tenantTargetKey({
      connection,
      tenantTarget,
      collection: get(connection.properties, tenantTarget.changeLogCollection),
    });
    if (!walledTargets.has(key)) return;
    const logCollection = get(connection.properties, tenantTarget.changeLogCollection);
    const scopedConnectionId = walledTargets.get(key).connectionId;
    collectExceptions(
      context,
      new ConfigError(
        `Connection "${connection.connectionId}" is tenant: shared but change-logs into collection "${logCollection}", which scoped connection "${scopedConnectionId}" reads. A shared connection's change-log records belong to no organization and carry no tenant field, so in a walled collection they are invisible to every walled read and make the tenant preflight refuse to serve the app. Point this connection's change log at a collection no scoped connection reads.`,
        { configKey: connection['~k'] }
      )
    );
  });
}

export default validateSharedChangeLog;
