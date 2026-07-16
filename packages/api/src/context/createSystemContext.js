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

import applySystemTrust from './applySystemTrust.js';
import createEvaluateOperators from './createEvaluateOperators.js';
import createReadConfigFile from './createReadConfigFile.js';
import getOrganizationBinding from '../routes/auth/organizations/getOrganizationBinding.js';

// Builds a fresh off-request context for a trusted, caller-less system context -
// an auth hook fire. The caller is the auth engine, not a user: `user` is null
// so the run is detectable as caller-less (`type.isNone(context.user)`) and
// `_user` resolves to nothing (the hook's subject is in `_payload`). The run is
// trusted at construction (`context.system = true`), the single trust marker
// every authorization layer reads (Decision 1); its `authorize` is derived from
// createAuthorize like every other layer, so endpoint auth is not re-checked
// against a session (Decision 2).
function createSystemContext({
  agents,
  appMeta,
  auth,
  buildDirectory,
  config,
  configDirectory,
  connections,
  createHandleError,
  fileCache,
  i18n,
  jsMap,
  logger,
  operators,
  rid,
  secrets,
  steps,
  websockets,
}) {
  const context = {
    rid,
    agents,
    appMeta,
    auth,
    buildDirectory,
    config,
    configDirectory,
    connections,
    fileCache,
    headers: {},
    i18n: i18n?.defaultLocale ? { ...i18n, active: i18n.defaultLocale } : undefined,
    jsMap,
    logger,
    operators,
    req: {
      url: 'system:auth-hook',
      method: null,
      hostname: null,
    },
    secrets,
    steps,
    websockets,
  };
  // Hook routines read the retained organizations state too - a step or
  // _organization inside a hook-bound endpoint resolves the same pinned org.
  context.organization = getOrganizationBinding({ auth: auth ?? null });
  // Trusted, caller-less system context (Decisions 1, 2): user: null,
  // system: true, and authorize derived from createAuthorize - the same
  // invariant bundle the caller-less runners apply, set in one place.
  applySystemTrust(context);
  context.handleError = createHandleError({ context });
  context.readConfigFile = createReadConfigFile(context);
  context.evaluateOperators = createEvaluateOperators(context);
  return context;
}

export default createSystemContext;
