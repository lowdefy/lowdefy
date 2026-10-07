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

import stampTenantOnLogRecord from '../tenant/stampTenantOnLogRecord.js';

// One change log record per request that wrote cells, when the connection has a change log.
async function writeEnrichmentLog({ args, context, logCollection, response, type }) {
  if (!logCollection) return;
  const { blockId, connection, connectionId, pageId, payload, requestId, tenant } = context;
  await logCollection.insertOne(
    stampTenantOnLogRecord({
      record: {
        args,
        blockId,
        connectionId,
        pageId,
        payload,
        requestId,
        response,
        timestamp: new Date(),
        type,
        meta: connection.changeLog?.meta,
      },
      tenant,
    })
  );
}

export default writeEnrichmentLog;
