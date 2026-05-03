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

import { ServerParser } from '@lowdefy/operators';

async function dispatchAuditEvent({ context, auditConfig, event, requestProperties }) {
  const connectionConfig = await context.readConfigFile(
    `connections/${auditConfig.connectionId}.json`
  );
  if (!connectionConfig) {
    throw new Error(
      `Audit connection "${auditConfig.connectionId}" config not found at runtime.`
    );
  }

  const connection = context.connections[connectionConfig.type];
  if (!connection) {
    throw new Error(
      `Audit connection type "${connectionConfig.type}" not registered in the server.`
    );
  }

  const requestResolver = connection.requests[auditConfig.requestType];
  if (!requestResolver) {
    throw new Error(
      `Audit request type "${auditConfig.requestType}" not registered for connection "${connectionConfig.type}".`
    );
  }

  const parser = new ServerParser({
    jsMap: context.jsMap,
    operators: context.operators,
    secrets: context.secrets,
    state: {},
    user: {},
  });
  const { output: connectionProperties, errors } = parser.parse({
    input: connectionConfig.properties ?? {},
    location: `audit/${connectionConfig.connectionId}`,
    payload: {},
    steps: {},
  });
  if (errors.length > 0) {
    throw errors[0];
  }

  return requestResolver({
    blockId: undefined,
    endpointId: undefined,
    connection: connectionProperties,
    connectionId: connectionConfig.connectionId,
    pageId: undefined,
    payload: {},
    request: requestProperties,
    requestId: `audit_${event.id}`,
  });
}

export default dispatchAuditEvent;
