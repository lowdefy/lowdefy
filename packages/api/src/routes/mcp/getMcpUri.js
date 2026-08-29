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

// The OAuth URI templates for the MCP protected resource live together here
// so the resource identifier, the aud check, the RFC 9728 metadata, and the
// WWW-Authenticate challenge can never drift apart. There is ONE MCP resource
// per deployment - the organization a token acts in is a claim the
// authorization server stamps at consent time, not a path segment.
// The origin always comes from the pinned BETTER_AUTH_URL - never a Host
// header, which is caller-controlled.

function getCanonicalUrl() {
  const canonicalUrl = process.env.BETTER_AUTH_URL?.trim();
  if (!canonicalUrl) {
    return null;
  }
  return canonicalUrl.replace(/\/$/, '');
}

// The resource identifier (RFC 8707) every MCP access token is minted for,
// and the audience the /api/mcp route verifies against.
function getMcpResourceUri({ config }) {
  const canonicalUrl = getCanonicalUrl();
  if (canonicalUrl === null) {
    return null;
  }
  return `${canonicalUrl}${config.basePath ?? ''}/api/mcp`;
}

// The authorization server's issuer identifier - what it stamps on iss and
// its metadata issuer. Carries the /api/auth suffix (BetterAuth baseURL +
// auth basePath), distinct from the MCP resource URI, and not the bare
// origin.
function getAsIssuer({ config }) {
  const canonicalUrl = getCanonicalUrl();
  if (canonicalUrl === null) {
    return null;
  }
  return `${canonicalUrl}${config.basePath ?? ''}/api/auth`;
}

// The RFC 9728 metadata location for the resource - the well-known segment
// sits after the app basePath, where the servers mount the metadata route.
// Both the WWW-Authenticate challenge and the served document derive from
// here, so the pointer and its target cannot drift apart.
function getMcpResourceMetadataUri({ config }) {
  const canonicalUrl = getCanonicalUrl();
  if (canonicalUrl === null) {
    return null;
  }
  return `${canonicalUrl}${config.basePath ?? ''}/.well-known/oauth-protected-resource/api/mcp`;
}

export { getMcpResourceUri, getMcpResourceMetadataUri, getAsIssuer };
