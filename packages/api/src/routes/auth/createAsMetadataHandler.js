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

import { oauthProviderAuthServerMetadata } from '@better-auth/oauth-provider';

// The oauth-provider plugin serves its AS metadata relative to the auth
// mount, so the RFC 8414 path-inserted location a client derives from the
// issuer (/.well-known/oauth-authorization-server/api/auth) must be mounted
// by the servers themselves. This wraps the vendor handler around the live
// auth instance - the served document, issuer included, then cannot drift
// from the plugin's own metadata - and keeps the @better-auth/oauth-provider
// import beside the plugin registration instead of in each server. Returns
// (request: Request) => Promise<Response>.
function createAsMetadataHandler({ auth }) {
  return oauthProviderAuthServerMetadata(auth);
}

export default createAsMetadataHandler;
