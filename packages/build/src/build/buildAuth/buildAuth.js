/* eslint-disable no-param-reassign */

/*
  Copyright 2020-2024 Lowdefy, Inc

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
import buildAuthPlugins from './buildAuthPlugins.js';
import buildPageAuth from './buildPageAuth.js';
import validateAuthConfig from './validateAuthConfig.js';

let warningLogged = false;

function buildAuth({ components, context }) {
  const configured = !type.isNone(components.auth);

  if (configured && !context.entitlements.includes('AUTH')) {
    if (!warningLogged) {
      context.logger.warn(`
┏━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┓
┃ Authentication configured without a license key. ┃
┠──────────────────────────────────────────────────┨
┃ Paid features can not be used in production      ┃
┃ without a valid license.                         ┃
┃                                                  ┃
┃ See https://docs.lowdefy.com/licenses.            ┃
┗━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┛`);
      warningLogged = true;
    }
  }

  validateAuthConfig({ components });
  components.auth.configured = configured;
  buildPageAuth({ components });
  buildAuthPlugins({ components, context });

  return components;
}

export default buildAuth;
