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

import { createAsMetadataHandler } from '@lowdefy/api';
import { type } from '@lowdefy/helpers';

import authJson from '../../lib/build/auth.js';
import mcpProtectedResourceMetadataHandler from './mcpProtectedResourceMetadata.js';

// OAuth discovery for the per-org MCP resources. Both documents are public,
// unauthenticated and constant per deployment, so they mount outside the api
// context. Nothing mounts when the app is not an authorization server - the
// build then guaranteed an all-public tool surface with nothing to discover.
function mountOauthDiscovery({ app, auth }) {
  if (type.isNone(authJson.oauthProvider)) {
    return;
  }
  app.get(
    '/.well-known/oauth-protected-resource/api/mcp/:org',
    mcpProtectedResourceMetadataHandler
  );
  // The auth instance is absent only in dev mock mode, which runs no auth
  // engine - the static resource document above still serves there.
  if (type.isNone(auth)) {
    return;
  }
  // The oauth-provider serves its AS metadata relative to the auth mount, so
  // the RFC 8414 path-inserted location a client derives from the issuer must
  // be mounted here, re-exposing the same live document.
  const asMetadataHandler = createAsMetadataHandler({ auth });
  app.get('/.well-known/oauth-authorization-server/api/auth', (c) => asMetadataHandler(c.req.raw));
}

export default mountOauthDiscovery;
