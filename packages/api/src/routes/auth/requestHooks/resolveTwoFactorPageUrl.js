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

import { type } from '@lowdefy/helpers';

// Where a two-factor challenge sends the browser. Absolute when the auth base
// URL is pinned, path-relative otherwise - the same rule onAPIError.errorURL
// follows, so both redirect targets behave alike when no origin is known.
//
// undefined means no challenge page is configured, which build validation only
// permits when twoFactor is off - so callers read undefined as "no interception
// to register" rather than as a misconfiguration to report.
function resolveTwoFactorPageUrl({ authConfig, basePath = '', baseUrlOrigin }) {
  const page = authConfig.authPages?.twoFactor;
  if (!type.isString(page)) {
    return undefined;
  }
  const path = `${basePath}${page}`;
  return type.isString(baseUrlOrigin) ? `${baseUrlOrigin}${path}` : path;
}

export default resolveTwoFactorPageUrl;
