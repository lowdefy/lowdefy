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

// The four OAuth URI templates for the per-org MCP protected resources live
// together here so the resource identifiers, the aud checks, the RFC 9728
// metadata, and the WWW-Authenticate challenge can never drift apart.
// The origin always comes from the pinned BETTER_AUTH_URL - never a Host
// header, which is caller-controlled.

// One path segment, sane charset, bounded length. Covers BetterAuth generated
// org ids and pinned-policy slugs; excludes '/', '.', '%' and whitespace so
// arbitrary input is never reflected into a metadata resource value.
const orgSegmentRegex = /^[A-Za-z0-9_-]{1,64}$/;

function getCanonicalUrl() {
  const canonicalUrl = process.env.BETTER_AUTH_URL?.trim();
  if (!canonicalUrl) {
    return null;
  }
  return canonicalUrl.replace(/\/$/, '');
}

// The prefix is the boundary the /api/* aud-rejection tests against: any
// accepted aud must extend it by exactly one well-formed org segment.
function getMcpUriPrefix({ config }) {
  const canonicalUrl = getCanonicalUrl();
  if (canonicalUrl === null) {
    return null;
  }
  return `${canonicalUrl}${config.basePath ?? ''}/api/mcp/`;
}

// Under the pinned organization policy the org id is the slug.
function getMcpResourceUri({ config, orgId }) {
  const prefix = getMcpUriPrefix({ config });
  if (prefix === null) {
    return null;
  }
  return `${prefix}${orgId}`;
}

// The authorization server's issuer identifier - what it stamps on iss and
// its metadata issuer. Carries the /api/auth suffix (BetterAuth baseURL +
// auth basePath), distinct from the MCP resource prefix, and not the bare
// origin.
function getAsIssuer({ config }) {
  const canonicalUrl = getCanonicalUrl();
  if (canonicalUrl === null) {
    return null;
  }
  return `${canonicalUrl}${config.basePath ?? ''}/api/auth`;
}

function isWellFormedOrgSegment(segment) {
  return typeof segment === 'string' && orgSegmentRegex.test(segment);
}

export { getMcpUriPrefix, getMcpResourceUri, getAsIssuer, isWellFormedOrgSegment };
