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

import { StreamableHTTPTransport } from '@hono/mcp';
import { createMcpServer, getMcpResourceMetadataUri, getMcpUriPrefix } from '@lowdefy/api';
import { type } from '@lowdefy/helpers';

import authJson from '../../lib/build/auth.js';

// The RFC 6750 challenge for this org's resource, pointing at its RFC 9728
// metadata. The invalid_token extension exists for the one failure a client
// can act on: BetterAuth mints opaque tokens when a client omits the RFC 8707
// resource parameter, and those can never verify here - the description names
// the parameter, never app state.
function getChallengeHeader({ context, orgId, parseableJwt }) {
  const metadataUri = getMcpResourceMetadataUri({ config: context.config, orgId });
  if (parseableJwt === false) {
    return `Bearer error="invalid_token", error_description="The access token is not a JWT. Connect with a client that sends the RFC 8707 resource parameter.", resource_metadata="${metadataUri}"`;
  }
  return `Bearer resource_metadata="${metadataUri}"`;
}

// Browser cross-site defence: an Origin that is neither the pinned canonical
// origin nor one the app registered on BetterAuth's trustedOrigins is
// refused. Non-browser MCP clients send no Origin and pass.
function isOriginAllowed({ c, context }) {
  const origin = c.req.header('origin');
  if (type.isNone(origin)) {
    return true;
  }
  const canonicalOrigin = new URL(getMcpUriPrefix({ config: context.config })).origin;
  if (origin === canonicalOrigin) {
    return true;
  }
  // Exact strings only - a trustedOrigins function or wildcard entry is not
  // consulted here.
  const trustedOrigins = context.auth?.options?.trustedOrigins;
  return type.isArray(trustedOrigins) && trustedOrigins.includes(origin);
}

// Stateless per-request MCP server over the app's configured endpoints. The
// apiContext middleware has already resolved the caller from the bearer token
// (context.mcpAuth), so tool listing and calls are authorized per request.
//
// The 401 challenge is decided here, before the transport runs -
// transport.handleRequest writes tool results over HTTP 200, so past this
// boundary a role or scope shortfall stays opaque inside the tool surface,
// never a 403 or insufficient_scope.
async function mcpHandler(c) {
  const context = c.get('lowdefyContext');
  const mcpConfig = await context.readConfigFile('mcp.json');
  if (type.isNone(mcpConfig) || mcpConfig.configured !== true) {
    return c.json({ error: 'MCP is not configured.' }, 404);
  }
  // Without an authorization server the build guaranteed an all-public tool
  // surface, so the route serves openly - no challenge envelope at all.
  if (!type.isNone(authJson.oauthProvider)) {
    if (!isOriginAllowed({ c, context })) {
      return c.json({ error: 'Origin not allowed.' }, 403);
    }
    const { tokenStatus, parseableJwt } = context.mcpAuth ?? {};
    const orgId = c.req.param('org');
    if (tokenStatus === 'invalid') {
      return c.json({ error: 'Unauthorized.' }, 401, {
        'WWW-Authenticate': getChallengeHeader({ context, orgId, parseableJwt }),
      });
    }
    // Nothing to serve anonymously - challenge instead of an empty tool list.
    if (tokenStatus === 'none' && mcpConfig.hasPublicTool === false) {
      return c.json({ error: 'Unauthorized.' }, 401, {
        'WWW-Authenticate': getChallengeHeader({ context, orgId, parseableJwt: true }),
      });
    }
  }
  const server = await createMcpServer({ context });
  const transport = new StreamableHTTPTransport();
  await server.connect(transport);
  return transport.handleRequest(c);
}

export default mcpHandler;
