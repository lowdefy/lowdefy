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

import { callRequest } from '@lowdefy/api';
import { ConfigError } from '@lowdefy/errors';
import { type } from '@lowdefy/helpers';

import isWriteRequestsAllowed from './isWriteRequestsAllowed.js';
import { getMock } from './devMockRegistry.js';
import formatExplainTrace from './formatExplainTrace.js';
import readBuildArtifact from './readBuildArtifact.js';
import runWithDevContext from './runWithDevContext.js';

function getRequestType({ pageId, requestId }) {
  // The request's `type` is stripped from build/pages/<pageId>.json by the
  // build (packages/build/src/build/full/writeRequests.js deletes
  // type/connectionId/properties/auth after writing the per-request file),
  // so it must be read from the dedicated per-request artifact instead —
  // the same file @lowdefy/api's getRequestConfig reads via readConfigFile.
  const requestConfig = readBuildArtifact({
    name: `pages/${pageId}/requests/${requestId}.json`,
    deserialize: true,
  });
  return requestConfig?.type ?? null;
}

// Executes a page request the same way POST /api/request/<pageId>/<requestId>
// does (src/routes/request.js), but gated for agent use: requests whose type
// is not declared read-only (checkWrite: false in requestSchemas.json meta)
// are refused unless the app opts in via lowdefy.yaml's
// cli.agentTools.allowWriteRequests. Never throws — errors and refusals are
// returned as data so an agent can reason about them.
//
// `explain: true` allocates a trace collector, threads it through callRequest
// to the resolver and the tenant wall, and adds an `explain` key to the result:
// the caller, the connection tenancy, the properties after operator
// evaluation, the effective query the driver received and every clause the
// wall injected. Without it nothing is allocated and the result is unchanged.
async function runRequest({ pageId, requestId, payload = {}, user, explain = false, honoContext }) {
  if (type.isUndefined(pageId) || !type.isString(pageId)) {
    throw new ConfigError(
      `run_request requires a "pageId" string. Received ${JSON.stringify(pageId)}.`
    );
  }
  if (type.isUndefined(requestId) || !type.isString(requestId)) {
    throw new ConfigError(
      `run_request requires a "requestId" string. Received ${JSON.stringify(requestId)}.`
    );
  }

  let requestType = getRequestType({ pageId, requestId });
  if (type.isNone(requestType)) {
    // In dev, page content (including per-request artifacts) is built JIT on
    // first page request — trigger the same build GET /api/page/* runs so a
    // freshly added request is found without the page ever being opened.
    try {
      const { default: buildPageIfNeeded } = await import('../server/jitPageBuilder.js');
      const path = await import('node:path');
      await buildPageIfNeeded({
        pageId,
        buildDirectory: path.join(process.cwd(), 'build'),
        configDirectory: process.env.LOWDEFY_DIRECTORY_CONFIG || process.cwd(),
      });
      requestType = getRequestType({ pageId, requestId });
    } catch {
      // JIT build failure surfaces through lowdefy_build_status — fall
      // through to the not-found refusal below.
    }
  }
  if (type.isNone(requestType)) {
    return {
      refused: true,
      reason:
        `Request "${requestId}" was not found on page "${pageId}". ` +
        `See GET /lowdefy-docs/app-map for the pages and requests that exist.`,
    };
  }

  const requestSchemas = readBuildArtifact({ name: 'plugins/requestSchemas.json' }) ?? {};
  const meta = requestSchemas[requestType]?.meta ?? {};

  if (meta.checkWrite !== false) {
    const allowed = await isWriteRequestsAllowed();
    if (!allowed) {
      return {
        refused: true,
        reason:
          meta.checkWrite === true
            ? `Request type "${requestType}" performs writes (checkWrite: true) and agent write access is disabled.`
            : `Request type "${requestType}" has no declared read/write meta, so it is treated as a write for safety.`,
        howToEnable: 'Set cli.agentTools.allowWriteRequests: true in lowdefy.yaml (dev only).',
      };
    }
  }

  // run_request always calls the real connection. If a loaded checkpoint is
  // replaying this same request, the page and this tool are looking at two
  // different answers — say so, rather than letting an agent conclude the page
  // shows what this result shows.
  const mock = getMock({ pageId, requestId });

  const result = await runWithDevContext({
    createTrace: () => ({ rewritten: [] }),
    explain,
    formatExplain: ({ context, trace }) =>
      formatExplainTrace({ trace, requestType, secrets: context.secrets, user: context.user }),
    honoContext,
    // The resolved caller, not the raw argument: a fixture name, an inline
    // object and the roleless default all read the same in the terminal, and
    // this is the identity the request actually ran as.
    log: ({ context }) =>
      context.logger.info({
        event: 'agent_run_request',
        pageId,
        requestId,
        user: { id: context.user?.id ?? null, roles: context.user?.roles ?? [] },
      }),
    run: ({ context, trace }) =>
      callRequest(context, {
        blockId: undefined,
        pageId,
        payload,
        requestId,
        trace,
      }),
    user,
  });

  if (type.isNone(mock)) {
    return result;
  }
  return { ...result, mockedElsewhere: { checkpoint: mock.checkpoint } };
}

export default runRequest;
