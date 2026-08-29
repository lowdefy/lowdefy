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

import { ConfigError } from '@lowdefy/errors';
import { get, type } from '@lowdefy/helpers';

// The curated catalog of readable projection paths. Extending it is a
// deliberate addition to this list — never a fall-through.
const readablePaths = [
  'emailAndPassword.enabled',
  'magicLink.enabled',
  'twoFactor.enabled',
  'twoFactor.required',
  'twoFactor.trustDevice',
  'passkey.enabled',
  'phoneNumber.enabled',
  'phoneNumber.signUpOnVerification',
  'captcha.enabled',
  'captcha.provider',
  'captcha.siteKey',
  'providers',
  'organizations.policy',
  'organizations.signup',
  'roles',
];

// Build-only operator, addressed as { _build.authConfig: '<path>' }. Reads the
// auth config projection the build computes in a scoped pre-pass before
// buildRefs. It deliberately has no runtime sibling — none of this data ships
// to the client or server at runtime.
function _authConfig({ authConfig, params }) {
  if (type.isUndefined(authConfig)) {
    // The projection is present on the build context after the pre-pass, so an
    // undefined projection means the operator ran somewhere it can never
    // exist: inside the auth: block during the pre-pass (self-reference), or
    // in app metadata (app:), which resolves earlier and is never re-walked.
    // Walks whose output IS re-walked post-projection (module entry vars,
    // deferred-record bodies) defer the fold instead of reaching this throw.
    throw new ConfigError(
      "_build.authConfig is not available here. The auth config projection is computed from the app's auth: block, so the operator can not resolve inside that block itself (a self-reference), nor in app metadata (app:), which resolves earlier."
    );
  }
  if (!readablePaths.includes(params)) {
    throw new ConfigError(
      `_build.authConfig received an unreadable path ${JSON.stringify(
        params
      )}. Readable paths are: ${readablePaths.map((path) => `"${path}"`).join(', ')}.`
    );
  }
  return get(authConfig, params, { copy: true });
}

// dynamic true keeps the bare _authConfig spelling out of build-time static
// evaluation — the only supported address is the explicit _build.authConfig,
// which evaluates regardless of dynamic (matching _build.app).
_authConfig.dynamic = true;

export default _authConfig;
