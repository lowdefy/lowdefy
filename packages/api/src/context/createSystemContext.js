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

import createEvaluateOperators from './createEvaluateOperators.js';
import createReadConfigFile from './createReadConfigFile.js';
import getOrganizationBinding from '../routes/auth/organizations/getOrganizationBinding.js';

// Builds a fresh off-request context for a trusted system caller - an auth
// hook fire. The caller is the auth engine, not a user: `user` is empty so
// `_user` resolves to nothing (the hook's subject is in `_payload`), and the
// target endpoint's auth is not re-checked against a session - InternalApi
// already guarantees the endpoint is unreachable over HTTP.
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
    user: {},
    websockets,
  };
  // Hook routines read the retained organizations state too - a step or
  // _organization inside a hook-bound endpoint resolves the same pinned org.
  context.organization = getOrganizationBinding({ auth: auth ?? null });
  // System caller: trusted internal invocation - endpoint auth is not
  // re-checked against a session.
  context.authorize = () => true;
  context.handleError = createHandleError({ context });
  context.readConfigFile = createReadConfigFile(context);
  context.evaluateOperators = createEvaluateOperators(context);
  return context;
}

export default createSystemContext;
