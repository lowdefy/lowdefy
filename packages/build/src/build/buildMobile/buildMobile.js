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
import { type } from '@lowdefy/helpers';

import mergeMobilePages from './mergeMobilePages.js';
import validateMobileConfig from './validateMobileConfig.js';
import validateMobilePageRefs from './validateMobilePageRefs.js';
import validateShellPluginsListed from './validateShellPluginsListed.js';

// Runs once the web page list is complete (after addDefaultPages) and before
// buildRoutes and buildAuth, so mobile pages get routes and auth like any page.
// An app without a mobile key is left exactly as it was. Mobile is experimental: the key builds
// only when the app opts in with config.experimental.mobile (buildExperimental).
function buildMobile({ components, context }) {
  if (type.isNone(components.mobile)) {
    return components;
  }
  // The error is collected, not thrown, so ~ignoreBuildChecks can never turn mobile on, and the
  // section is dropped so no later step (buildAuthMobile, writeMobile) builds any of it.
  if (context.experimental?.mobile !== true) {
    context.errors.push(
      new ConfigError(
        'Mobile apps are experimental. Set "config.experimental.mobile: true" in lowdefy.yaml to build the "mobile" section.',
        { configKey: components.mobile['~k'] }
      )
    );
    delete components.mobile;
    return components;
  }
  validateMobileConfig({ mobile: components.mobile, context });
  validateShellPluginsListed({ mobile: components.mobile, context });
  mergeMobilePages({ components });
  validateMobilePageRefs({ components });
  return components;
}

export default buildMobile;
