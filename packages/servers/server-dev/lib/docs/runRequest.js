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
import readBuildArtifact from './readBuildArtifact.js';
import truncateResponse from './truncateResponse.js';

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
async function runRequest({ pageId, requestId, payload = {}, user, honoContext }) {
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

  if (!type.isNone(user) && !type.isObject(user)) {
    throw new ConfigError(
      `run_request "user" must be an object, e.g. {"roles":["admin"]}. Received ${JSON.stringify(
        user
      )}.`
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

  // Deferred import: createLowdefyContext statically imports build/plugins/*
  // artifacts, which only exist in a running server directory — importing it
  // at module load would break every consumer of this module (e.g. the MCP
  // server) in environments without a full build.
  const { default: createLowdefyContext } = await import('../server/createLowdefyContext.js');
  const context = await createLowdefyContext({ c: honoContext, user });
  context.logger.info({ event: 'agent_run_request', pageId, requestId, user });

  try {
    const result = await callRequest(context, {
      blockId: undefined,
      pageId,
      payload,
      requestId,
    });
    return { refused: false, ...truncateResponse(result) };
  } catch (error) {
    return {
      refused: false,
      error: {
        name: error.name,
        message: error.message,
      },
    };
  }
}

export default runRequest;
