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

import findOpsTokenCollision from './findOpsTokenCollision.js';
import getOpsSinkCredentials, { REQUIRED_ENV } from './getOpsSinkCredentials.js';
import isLoopbackHost from './isLoopbackHost.js';
import readBuildArtifact from '../readBuildArtifact.js';

const HOW_TO_ENABLE_ENV = `Set ${REQUIRED_ENV.join(
  ', '
)} in the dev environment. LOWDEFY_OPS_READ_TOKEN must be a read-only query credential for the log sink, never the ingest token logger.otlp sends.`;

// The ops tools read production telemetry — error bodies, user ids, tenant
// values — into an agent's context, through an MCP surface that has no
// authentication of its own. Every tool asks this first and refuses with
// howToEnable rather than vanishing from the manifest, so an agent learns the
// tool exists and what the developer has to do (the isWriteRequestsAllowed
// pattern).
function isOpsQueryAllowed({ origin }) {
  const credentials = getOpsSinkCredentials();
  if (credentials.missing.length > 0) {
    return {
      allowed: false,
      reason: `Ops queries need the log sink credentials, which are not set: ${credentials.missing.join(
        ', '
      )}.`,
      howToEnable: HOW_TO_ENABLE_ENV,
    };
  }

  const collision = findOpsTokenCollision({ token: credentials.token });
  if (!type.isNone(collision)) {
    return {
      allowed: false,
      reason: `LOWDEFY_OPS_READ_TOKEN holds the same value as "${collision}". A credential that can write to the sink must never be the query token.`,
      howToEnable:
        'Issue a read-only query token at the log sink and set LOWDEFY_OPS_READ_TOKEN to it.',
    };
  }

  if (type.isNone(origin)) {
    return {
      allowed: false,
      reason:
        'Ops queries need to know which host the caller reached this server on, and this transport does not report one.',
      howToEnable: 'Call the ops tools over the dev server on http://localhost:<port>.',
    };
  }
  const { hostname } = new URL(origin);
  if (!isLoopbackHost(hostname)) {
    return {
      allowed: false,
      reason: `This dev server was reached on "${hostname}", not loopback. The dev MCP has no authentication, so ops tools are refused on any non-loopback host — a tunnel or a LAN bind would put production data on the open internet.`,
      howToEnable:
        'Reach the dev server on localhost, without a tunnel, a port forward or a non-loopback --host.',
    };
  }

  const config = readBuildArtifact({ name: 'config.json', deserialize: true }) ?? {};
  if (config.ops?.enabled === false) {
    return {
      allowed: false,
      reason: 'This app sets config.ops.enabled: false in lowdefy.yaml.',
      howToEnable: 'Remove config.ops.enabled: false from lowdefy.yaml to allow ops queries.',
    };
  }

  return {
    allowed: true,
    sink: { url: credentials.url, token: credentials.token, dataset: credentials.dataset },
  };
}

export default isOpsQueryAllowed;
