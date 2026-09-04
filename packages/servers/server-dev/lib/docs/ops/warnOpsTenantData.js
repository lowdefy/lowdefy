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

import getOpsSinkCredentials from './getOpsSinkCredentials.js';
import readBuildArtifact from '../readBuildArtifact.js';

// One line at boot, and only for the app where it means something: the ops
// tools can read production telemetry into an agent's context, and this app
// walls its data by tenant, so those rows may carry other organizations'
// values. The developer is told once, at the moment the credentials are
// present, rather than on every query or on every multi-tenant app.
function warnOpsTenantData({ logger }) {
  const tenantConnections = readBuildArtifact({
    name: 'tenantConnections.json',
    deserialize: true,
  });
  if (!type.isArray(tenantConnections) || tenantConnections.length === 0) {
    return false;
  }
  // The origin is unknown at boot and the loopback check runs per call; what
  // is knowable here is whether the credentials exist at all.
  if (getOpsSinkCredentials().missing.length > 0) {
    return false;
  }
  logger.warn(
    {
      event: 'ops_tenant_data_warning',
      tenantConnections: tenantConnections.map((connection) => connection.connectionId),
    },
    `Ops query credentials are set and this app has ${tenantConnections.length} tenant-walled connection(s). The dev MCP ops tools can read production events across every organization into an agent's context. Set config.ops.enabled: false in lowdefy.yaml to refuse them.`
  );
  return true;
}

export default warnOpsTenantData;
