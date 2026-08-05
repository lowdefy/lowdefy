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

// The single writer of the pre-resolved-caller shape. A dev mock user, the dev
// headless renderer cookie, and the e2e test cookie each substitute for the
// whole resolveAuthentication step, and must match the shape it produces. That
// output always carries roles as an array and attributes as an object (a
// whole-bag { _user: 'attributes' } read gives {} on a real caller), so both
// are floored here. profile and activeOrganizationId are only ever produced by
// a real user-row/member read, so they are left exactly as the caller carries
// them - absent stays absent, and a bare _user.profile read is null-safe.
// organizationId (the tenant wall's org value) mirrors resolveAuthentication,
// where it always equals activeOrganizationId - an injected caller declaring
// either key gets both, so mock/e2e callers pass walled connections without
// duplicating the org under two names. A caller with neither stays org-less
// and fails closed on walled connections, same as a strategy caller.
function normalizeInjectedCaller(user) {
  const normalized = {
    ...user,
    roles: user.roles ?? [],
    attributes: user.attributes ?? {},
  };
  const organizationId = user.organizationId ?? user.activeOrganizationId;
  if (organizationId != null) {
    normalized.organizationId = organizationId;
    normalized.activeOrganizationId = user.activeOrganizationId ?? organizationId;
  }
  return normalized;
}

export default normalizeInjectedCaller;
